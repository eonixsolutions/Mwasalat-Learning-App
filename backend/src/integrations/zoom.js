import { AppError } from '../utils/AppError.js';
import logger from '../utils/logger.js';
import { getOrgTimezone } from '../utils/orgTimezone.js';

const ZOOM_ACCOUNT_ID = process.env.ZOOM_ACCOUNT_ID;
const ZOOM_CLIENT_ID = process.env.ZOOM_CLIENT_ID;
const ZOOM_CLIENT_SECRET = process.env.ZOOM_CLIENT_SECRET;
const zoomReady = Boolean(ZOOM_ACCOUNT_ID && ZOOM_CLIENT_ID && ZOOM_CLIENT_SECRET);

// Server-to-Server OAuth (https://developers.zoom.us/docs/internal-apps/s2s-oauth/) —
// every live class is scheduled under the platform's own Zoom account rather
// than the instructor's personal one, so this needs no per-instructor Zoom
// login. Requires a Server-to-Server OAuth app created in the Zoom Marketplace
// with the meeting:write:meeting scope.
const getAccessToken = async () => {
  const res = await fetch(`https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${ZOOM_ACCOUNT_ID}`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${ZOOM_CLIENT_ID}:${ZOOM_CLIENT_SECRET}`).toString('base64')}`,
    },
  });
  if (!res.ok) {
    const body = await res.text();
    logger.error(`[zoom] Token request failed: ${res.status} ${body}`);
    throw new AppError('Failed to authenticate with Zoom', 502);
  }
  const data = await res.json();
  return data.access_token;
};

// Creates a scheduled meeting on the platform's Zoom account. Returns the
// join URL (safe to hand to learners) separately from the start URL
// (host-only — authenticates as host, must never reach a learner).
export const createZoomMeeting = async ({ topic, startTime, durationMinutes = 60 }) => {
  if (!zoomReady) {
    throw new AppError(
      'Zoom is not configured on this server. Set ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, and ZOOM_CLIENT_SECRET, or paste a meeting link manually.',
      503
    );
  }
  if (!startTime) throw new AppError('Set the scheduled date & time first', 400);

  const [accessToken, timezone] = await Promise.all([getAccessToken(), getOrgTimezone()]);
  const res = await fetch('https://api.zoom.us/v2/users/me/meetings', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      topic: (topic || 'Mwasalat Live Class').slice(0, 200),
      type: 2, // scheduled meeting
      // start_time carries the real instant (as UTC, via the trailing 'Z'); `timezone`
      // below only controls how Zoom *displays* it in its own UI/invite emails.
      start_time: new Date(startTime).toISOString(),
      duration: durationMinutes,
      timezone,
      settings: { join_before_host: false, waiting_room: true, approval_type: 0 },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    logger.error(`[zoom] Meeting creation failed: ${res.status} ${body}`);
    throw new AppError('Failed to create the Zoom meeting', 502);
  }

  const data = await res.json();
  return { joinUrl: data.join_url, startUrl: data.start_url, meetingId: String(data.id) };
};
