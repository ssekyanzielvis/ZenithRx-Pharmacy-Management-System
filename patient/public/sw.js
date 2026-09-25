// ============================================================
// ZenithRx Patient Care Portal — Service Worker v2.3
// Cache-first for static assets, network-first for navigation
// ============================================================
const CACHE_NAME = 'zenithrx-patient-pwa-v2.3';
const STATIC_CACHE = 'zenithrx-static-v2.3';

// Pre-cache minimal critical assets only (icon is large — let it be fetched on demand)
const PRECACHE_ASSETS = [
  '/manifest.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME && key !== STATIC_CACHE)
          .map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // 1. Navigation (HTML pages): Network-first so updates always propagate
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return networkResponse;
        })
        .catch(() =>
          caches.match(request).then((cached) => cached || caches.match('/index.html'))
        )
    );
    return;
  }

  // 2. Vite-hashed assets (/assets/*): Cache-first — these NEVER change (content-hashed)
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        const networkResponse = await fetch(request);
        if (networkResponse && networkResponse.status === 200) {
          cache.put(request, networkResponse.clone());
        }
        return networkResponse;
      })
    );
    return;
  }

  // 3. External requests (Supabase, CDNs, APIs): Direct network, no SW interference
  if (url.origin !== self.location.origin) {
    event.respondWith(fetch(request).catch(() => caches.match(request)));
    return;
  }

  // 4. Other same-origin requests: Stale-while-revalidate
  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(request);
      const fetchPromise = fetch(request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          cache.put(request, networkResponse.clone());
        }
        return networkResponse;
      });
      return cached || fetchPromise;
    })
  );
});
