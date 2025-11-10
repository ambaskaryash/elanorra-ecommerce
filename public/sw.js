const CACHE_NAME = 'elanorra-pwa-v2';
const ASSETS_TO_CACHE = [
  '/',
  '/offline',
  '/icon.svg',
  '/manifest.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only cache GET requests
  if (request.method !== 'GET') return;

  // Navigation requests: network-first, fallback to offline page
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const preloadResp = await event.preloadResponse;
          if (preloadResp) return preloadResp;
          const networkResp = await fetch(request);
          return networkResp;
        } catch (err) {
          const cache = await caches.open(CACHE_NAME);
          const offlineResp = await cache.match('/offline');
          return offlineResp || Response.error();
        }
      })()
    );
    return;
  }

  // Asset requests: cache-first, then network with background update
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(request);
      const networkFetch = fetch(request)
        .then(async (resp) => {
          if (request.url.startsWith(self.location.origin) && resp.status === 200) {
            try { await cache.put(request, resp.clone()); } catch (_) {}
          }
          return resp;
        })
        .catch(() => cached);

      return cached || networkFetch;
    })()
  );
});