/**
 * One-time script to get a Microsoft OAuth2 refresh token.
 * Run: node src/scripts/getRefreshToken.js
 * Then copy the printed MICROSOFT_REFRESH_TOKEN into your .env file.
 */
import http from 'http';
import { exec } from 'child_process';
import axios from 'axios';

const TENANT_ID     = 'ca9f0c03-4ba2-4bc0-9387-00b4c3e52b7b';
const CLIENT_ID     = 'c52cc288-5425-4cbb-9c95-c5bcc8bef45e';
const CLIENT_SECRET = 'YOUR_CLIENT_SECRET_HERE';
const REDIRECT_URI  = 'http://localhost:3001/callback';
const SCOPE         = 'Files.ReadWrite offline_access User.Read';

const authUrl =
  `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/authorize` +
  `?client_id=${CLIENT_ID}` +
  `&response_type=code` +
  `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
  `&scope=${encodeURIComponent(SCOPE)}` +
  `&response_mode=query` +
  `&prompt=select_account`;

const server = http.createServer(async (req, res) => {
  if (!req.url.startsWith('/callback')) { res.end(); return; }

  const code = new URL(req.url, 'http://localhost:3001').searchParams.get('code');
  if (!code) {
    res.writeHead(400); res.end('No code in callback URL.'); return;
  }

  try {
    const tokenRes = await axios.post(
      `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`,
      new URLSearchParams({
        client_id:     CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code,
        redirect_uri:  REDIRECT_URI,
        grant_type:    'authorization_code',
        scope:         SCOPE,
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    const { refresh_token } = tokenRes.data;

    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
      <html><body style="font-family:sans-serif;padding:40px;max-width:700px">
        <h2 style="color:#1F5E63">✅ Success!</h2>
        <p>Copy the value below and add it to your <code>.env</code> file:</p>
        <pre style="background:#f0f0f0;padding:16px;border-radius:8px;word-break:break-all;font-size:13px">MICROSOFT_REFRESH_TOKEN=${refresh_token}</pre>
        <p style="color:#94A3B8">You can close this window and stop the script (Ctrl+C).</p>
      </body></html>
    `);

    console.log('\n✅  Refresh token obtained!\n');
    console.log('Add this line to your backend .env:\n');
    console.log(`MICROSOFT_REFRESH_TOKEN=${refresh_token}\n`);
  } catch (err) {
    const msg = err.response?.data?.error_description ?? err.message;
    res.writeHead(500); res.end(`Error: ${msg}`);
    console.error('\n❌  Error exchanging code for token:', msg);
  }
});

server.listen(3001, () => {
  console.log('Listening on http://localhost:3001');
  console.log('\nOpening browser for Microsoft login...');
  console.log('Sign in as academy@eonixsolutions.in\n');

  // Open browser on Windows
  exec(`start "" "${authUrl}"`, (err) => {
    if (err) {
      console.log('Could not open browser automatically. Open this URL manually:\n');
      console.log(authUrl + '\n');
    }
  });
});
