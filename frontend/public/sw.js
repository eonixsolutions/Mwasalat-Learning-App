// Runtime-caching service worker: makes the installed PWA usable offline for
// anything the user already visited, without needing a build-time precache
// manifest (Vite's hashed filenames are content-addressed, so caching them
// on first fetch and serving cache-first afterwards is always safe/correct).
const VERSION = 'v1';
const STATIC_CACHE = `mwasalat-static-${VERSION}`;
const API_CACHE = `mwasalat-api-${VERSION}`;
const OFFLINE_URL = '/offline.html';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll([OFFLINE_URL]))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== STATIC_CACHE && key !== API_CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

const offlineJsonResponse = () =>
  new Response(
    JSON.stringify({ success: false, message: "You're offline and this hasn't been loaded before.", data: null, error: { offline: true } }),
    { status: 503, headers: { 'Content-Type': 'application/json' } }
  );

// Content-addressed build assets (hashed JS/CSS/fonts/images) — safe to
// serve straight from cache once fetched once; refresh the cache in the
// background so the next load picks up a rebuilt file at the same URL.
async function cacheFirstStatic(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(request);
  const networkFetch = fetch(request)
    .then((response) => {
      if (response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => null);

  // networkFetch was already kicked off above — if we have a cached copy,
  // return it immediately and let that fetch keep running to refresh the
  // cache in the background instead of awaiting it here.
  return cached || (await networkFetch) || Response.error();
}

// GET API calls — prefer live data, fall back to the last successful
// response for that exact URL when offline (never cache non-GET requests).
async function networkFirstApi(request) {
  const cache = await caches.open(API_CACHE);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    return (await cache.match(request)) || offlineJsonResponse();
  }
}

// SPA navigations — prefer live HTML, fall back to a cached copy of the same
// route, then to the offline fallback page.
async function networkFirstNavigate(request) {
  const cache = await caches.open(STATIC_CACHE);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    return (await cache.match(request)) || (await cache.match(OFFLINE_URL));
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return; // never intercept mutations

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // leave Cloudinary/Zoom/GSI/sockets alone

  if (request.mode === 'navigate') {
    event.respondWith(networkFirstNavigate(request));
    return;
  }

  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstApi(request));
    return;
  }

  event.respondWith(cacheFirstStatic(request));
});

// Browser push notifications (web-push, VAPID) — delivered by the push
// service even when no tab is open. Payload shape is whatever
// backend/src/integrations/webPush.js sent as the JSON body: { title, body, url? }.
self.addEventListener('push', (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { body: event.data?.text() };
  }
  const { title = 'Mwasalat Academy', body, url = '/' } = payload;

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: '/mwasalat-logo.png',
      badge: '/mwasalat-logo.png',
      data: { url },
    })
  );
});

// Focuses an already-open tab instead of stacking a new one when the user
// taps the notification — falls back to opening the target URL only when
// nothing is open.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      const existing = clientList.find((c) => c.url.startsWith(self.location.origin));
      if (existing) {
        return targetUrl === '/' ? existing.focus() : existing.focus().then(() => existing.navigate(targetUrl));
      }
      return self.clients.openWindow(targetUrl);
    })
  );
});
