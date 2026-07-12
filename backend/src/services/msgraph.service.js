import axios from 'axios';

const TENANT_ID     = () => process.env.MICROSOFT_TENANT_ID;
const CLIENT_ID     = () => process.env.MICROSOFT_CLIENT_ID;
const CLIENT_SECRET = () => process.env.MICROSOFT_CLIENT_SECRET;
const GRAPH_BASE    = 'https://graph.microsoft.com/v1.0';
const SCOPE         = 'Files.ReadWrite offline_access User.Read';

// ── Token cache ────────────────────────────────────────────────────
let _cachedToken    = null;
let _tokenExpiresAt = 0;
let _refreshToken   = null; // kept in memory, seeded from env on first use

const getAccessToken = async () => {
  if (_cachedToken && Date.now() < _tokenExpiresAt - 60_000) return _cachedToken;

  // Seed refresh token from env on first call
  if (!_refreshToken) _refreshToken = process.env.MICROSOFT_REFRESH_TOKEN;
  if (!_refreshToken) throw new Error('MICROSOFT_REFRESH_TOKEN is not set in .env');

  const res = await axios.post(
    `https://login.microsoftonline.com/${TENANT_ID()}/oauth2/v2.0/token`,
    new URLSearchParams({
      client_id:     CLIENT_ID(),
      client_secret: CLIENT_SECRET(),
      refresh_token: _refreshToken,
      scope:         SCOPE,
      grant_type:    'refresh_token',
    }),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );

  _cachedToken    = res.data.access_token;
  _tokenExpiresAt = Date.now() + res.data.expires_in * 1000;
  // Microsoft may issue a new refresh token — keep it updated in memory
  if (res.data.refresh_token) _refreshToken = res.data.refresh_token;
  return _cachedToken;
};

// ── Core request helper ────────────────────────────────────────────
const graph = async (method, path, data = null, opts = {}) => {
  const token = await getAccessToken();
  try {
    const res = await axios({
      method,
      url: `${GRAPH_BASE}${path}`,
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...opts.headers },
      data: data ?? undefined,
      validateStatus: opts.validateStatus,
    });
    return res;
  } catch (err) {
    // Re-throw with Graph API error details included
    const graphErr = err.response?.data?.error;
    if (graphErr) {
      const enhanced = new Error(`Graph API ${err.response.status}: [${graphErr.code}] ${graphErr.message}`);
      enhanced.response = err.response;
      throw enhanced;
    }
    throw err;
  }
};

// ── Drive helpers — all via /me/drive (delegated auth) ────────────

const getDriveInfo = async () => {
  const res = await graph('GET', '/me/drive?$select=id');
  return { driveId: res.data.id };
};

const getRootId = async () => {
  const res = await graph('GET', '/me/drive/root?$select=id');
  return res.data.id;
};

// Returns true if item exists at path, null if not found
const itemExistsAtPath = async (itemPath) => {
  try {
    const encoded = itemPath.split('/').map(encodeURIComponent).join('/');
    const res = await graph('GET', `/me/drive/root:/${encoded}?$select=id,name`);
    return res.data ?? null;
  } catch (err) {
    if (err.response?.status === 404) return null;
    throw err;
  }
};

// Creates a folder under parentId; returns existing one if already there
const getOrCreateFolder = async (parentId, folderName) => {
  // Try fetching existing folder first (path-relative lookup)
  try {
    const encoded = encodeURIComponent(folderName);
    const res = await graph('GET', `/me/drive/items/${parentId}:/${encoded}?$select=id,name,webUrl`);
    if (res.data?.id) return res.data;
  } catch (getErr) {
    if (getErr.response?.status !== 404) throw getErr;
    // 404 = doesn't exist yet, proceed to create
  }

  // Create the folder
  try {
    const res = await graph('POST', `/me/drive/items/${parentId}/children`, {
      name: folderName,
      folder: {},
      '@microsoft.graph.conflictBehavior': 'fail',
    });
    if (!res.data?.id) throw new Error(`Folder created but no id returned for "${folderName}"`);
    return res.data;
  } catch (postErr) {
    // Race condition: created between our GET and POST — fetch it directly
    if (postErr.response?.status === 409) {
      const encoded = encodeURIComponent(folderName);
      const res = await graph('GET', `/me/drive/items/${parentId}:/${encoded}?$select=id,name,webUrl`);
      if (res.data?.id) return res.data;
      throw new Error(`Folder "${folderName}" exists but could not be fetched after 409`);
    }
    throw postErr;
  }
};

// ── Download + upload (avoids the unreliable /copy endpoint) ──────
const transferFile = async (sourceItemId, destFolderId, newName) => {
  const token = await getAccessToken();
  console.log(`[TaskSheet] Downloading item ID: ${sourceItemId}`);

  // Step 1: download by item ID
  let content;
  try {
    const downloadRes = await axios.get(
      `${GRAPH_BASE}/me/drive/items/${sourceItemId}/content`,
      { headers: { Authorization: `Bearer ${token}` }, responseType: 'arraybuffer', maxRedirects: 5 }
    );
    content = Buffer.from(downloadRes.data);
    console.log(`[TaskSheet] Downloaded ${content.length} bytes`);
  } catch (err) {
    const detail = err.response?.data
      ? Buffer.from(err.response.data).toString('utf8')
      : err.message;
    console.error(`[TaskSheet] Download failed (id=${sourceItemId}): ${err.response?.status} — ${detail}`);
    throw new Error(`Download failed (${err.response?.status}): ${detail}`);
  }

  // Step 3: upload to destination folder
  try {
    const encodedName = encodeURIComponent(newName);
    const uploadRes = await axios.put(
      `${GRAPH_BASE}/me/drive/items/${destFolderId}:/${encodedName}:/content`,
      content,
      {
        headers: {
          Authorization:  `Bearer ${token}`,
          'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        },
      }
    );
    console.log(`[TaskSheet] Uploaded "${newName}" — webUrl: ${uploadRes.data?.webUrl ?? 'none'}`);
    return uploadRes.data?.webUrl ?? null;
  } catch (err) {
    const detail = err.response?.data
      ? (typeof err.response.data === 'object'
          ? JSON.stringify(err.response.data)
          : Buffer.from(err.response.data).toString('utf8'))
      : err.message;
    console.error(`[TaskSheet] Upload failed for "${newName}" → folder ${destFolderId}: ${err.response?.status} — ${detail}`);
    throw new Error(`Upload failed (${err.response?.status}): ${detail}`);
  }
};

// ── Resolve an OneDrive video file path → driveId + itemId ────────
// relativePath: path after the base folder, e.g. "Zero2Code/Week 1/Day 1.mp4"
const VIDEO_BASE_PATH = 'Academy Files/4.Video recordings';

const resolveFilePath = async (relativePath) => {
  // First try exact path
  const fullPath = `${VIDEO_BASE_PATH}/${relativePath.trim()}`;
  const encoded  = fullPath.split('/').map(p => encodeURIComponent(p.trim())).join('/');
  console.log(`[Video] Resolving path: "${fullPath}"`);

  try {
    const res = await graph('GET', `/me/drive/root:/${encoded}?$select=id,parentReference,name`);
    console.log(`[Video] Resolved → itemId: ${res.data.id}`);
    return { itemId: res.data.id, driveId: res.data.parentReference?.driveId, name: res.data.name };
  } catch (pathErr) {
    // Fallback: search by filename (last segment), match by partial path
    const fileName = relativePath.trim().split('/').pop();
    console.log(`[Video] Path lookup failed (${pathErr.response?.status}), searching by filename: "${fileName}"`);

    const searchRes = await graph('GET', `/me/drive/root/search(q='${encodeURIComponent(fileName)}')?$select=id,name,parentReference&$top=10`);
    const items = searchRes.data?.value ?? [];
    console.log(`[Video] Search returned ${items.length} result(s):`);
    items.forEach(i => console.log(`  → "${i.parentReference?.path}/${i.name}"`));

    if (items.length === 0) {
      throw new Error(`File "${fileName}" not found anywhere in OneDrive. Check the filename is correct.`);
    }

    // Use first match — log shows exact path so admin can correct if wrong
    const match = items[0];
    console.log(`[Video] Using: "${match.parentReference?.path}/${match.name}" (id: ${match.id})`);
    return { itemId: match.id, driveId: match.parentReference?.driveId, name: match.name };
  }
};

// ── Get a short-lived embed/preview URL for a drive item ───────────
const getPreviewUrl = async (driveId, itemId) => {
  const res = await graph('POST', `/drives/${driveId}/items/${itemId}/preview`, {});
  return res.data.getUrl ?? null;
};

// ── Create a view-only org-scoped link and return an embeddable URL ─
// createLink grants org-level access with preventDownload.
// For iframe playback we need embed.aspx?UniqueId=... (the same URL that
// SharePoint's "Share → Embed" dialog produces). webUrl from createLink
// is a redirect (:v: short link) that hits X-Frame-Options and won't embed.
const createViewOnlyLink = async (itemId, driveId) => {
  const itemEndpoint = driveId
    ? `/drives/${driveId}/items/${itemId}`
    : `/me/drive/items/${itemId}`;

  // Step 1: grant org-level access with download blocked
  await graph('POST', `${itemEndpoint}/createLink`, {
    type:            'view',
    scope:           'organization',
    preventDownload: true,
  });
  console.log(`[Video] Org-scoped view link created for item ${itemId}`);

  // Step 2: fetch file metadata to get the SharePoint UniqueId
  const metaRes  = await graph('GET', `${itemEndpoint}?$select=sharepointIds,webUrl`);
  const uniqueId = metaRes.data?.sharepointIds?.listItemUniqueId;
  const webUrl   = metaRes.data?.webUrl ?? '';
  console.log(`[Video] UniqueId: ${uniqueId} | webUrl: ${webUrl}`);

  if (uniqueId && webUrl) {
    // Extract https://{tenant}-my.sharepoint.com/personal/{user}
    const siteMatch = webUrl.match(/^(https:\/\/[^/]+-my\.sharepoint\.com\/personal\/[^/]+)/);
    if (siteMatch) {
      const embedUrl = `${siteMatch[1]}/_layouts/15/embed.aspx?UniqueId=${uniqueId}`;
      console.log(`[Video] embed.aspx URL: ${embedUrl}`);
      return embedUrl;
    }
  }

  // Fallback: webUrl is not great for iframes but better than nothing
  console.warn(`[Video] Could not build embed.aspx URL, falling back to webUrl`);
  return webUrl;
};

// ── Share folder with a specific Microsoft account ─────────────────
// role: 'write' (student can edit) | 'read' (staff can view)
const shareWithUser = async (itemId, email, role = 'write', message) => {
  await graph('POST', `/me/drive/items/${itemId}/invite`, {
    requireSignIn: true,
    sendInvitation: true,
    roles: [role],
    recipients: [{ email }],
    message: message ?? 'Your Zero2Code task sheets folder is ready on Eonix!',
  });

  const item = await graph('GET', `/me/drive/items/${itemId}?$select=webUrl`);
  return item.data.webUrl;
};

// ── High-level: provision Zero2Code student folder ─────────────────
// Template path: Academy Files/5.Task Sheets/1.Zero2Code/Week{n}/Zero2Code-Week-{n} Day-{d}.docx
// Dest path: Eonix App Files/Students/{batchName}/{studentName}/Week {n}/
const WEEKS = 4;
const MAX_DAYS = 6;

const TEMPLATE_ROOT  = 'Academy Files/5.Task sheets/1.Zero2Code';
const APP_ROOT       = 'Eonix App Files';
const STUDENTS_FOLDER = 'Students';

const provisionStudentFolder = async ({ studentName, batchName, microsoftEmail }) => {
  console.log(`[TaskSheet] Starting provision for "${studentName}" in batch "${batchName}"`);

  const { driveId } = await getDriveInfo();
  console.log(`[TaskSheet] Drive ID: ${driveId}`);
  const rootId = await getRootId();
  console.log(`[TaskSheet] Root ID: ${rootId}`);

  const appRoot     = await getOrCreateFolder(rootId, APP_ROOT);
  console.log(`[TaskSheet] App root folder: ${appRoot.id}`);

  const studentsDir = await getOrCreateFolder(appRoot.id, STUDENTS_FOLDER);
  console.log(`[TaskSheet] Students dir: ${studentsDir.id}`);
  const batchDir    = await getOrCreateFolder(studentsDir.id, batchName);
  console.log(`[TaskSheet] Batch dir: ${batchDir.id}`);
  const studentDir  = await getOrCreateFolder(batchDir.id, studentName);
  console.log(`[TaskSheet] Student folder: ${studentDir.id}`);
  if (!studentDir?.id) throw new Error('Student folder was created but returned no id — check OneDrive permissions');

  const fileUrls = [];

  for (let week = 1; week <= WEEKS; week++) {
    const weekFolder = await getOrCreateFolder(studentDir.id, `Week ${week}`);
    console.log(`[TaskSheet] Week ${week} folder: ${weekFolder.id}`);
    for (let day = 1; day <= MAX_DAYS; day++) {
      const templatePath = `${TEMPLATE_ROOT}/Week ${week}/Zero2Code-Week-${week} Day-${day}.docx`;

      const templateItem = await itemExistsAtPath(templatePath);
      if (!templateItem?.id) {
        console.log(`[TaskSheet] Template not found (skipping): ${templatePath}`);
        continue;
      }

      const fileName = `Zero2Code-Week-${week} Day-${day}.docx`;
      console.log(`[TaskSheet] Transferring Week ${week} Day ${day} (id=${templateItem.id})`);
      const fileUrl = await transferFile(templateItem.id, weekFolder.id, fileName);
      if (fileUrl) fileUrls.push({ week, day, url: fileUrl });
      console.log(`[TaskSheet] Week ${week} Day ${day} done`);
    }
  }

  console.log(`[TaskSheet] Sharing folder with ${microsoftEmail}`);
  const folderUrl = await shareWithUser(studentDir.id, microsoftEmail);
  console.log(`[TaskSheet] Done. Folder URL: ${folderUrl}`);
  return { folderId: studentDir.id, folderUrl, fileUrls };
};

export const msgraphService = {
  provisionStudentFolder,
  shareWithUser,
  lookupFolderByPath: itemExistsAtPath,
  resolveFilePath,
  createViewOnlyLink,
};
