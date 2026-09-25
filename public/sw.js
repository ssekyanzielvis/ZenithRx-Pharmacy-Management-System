// ============================================================
// ZenithRx Patient Care PWA — Service Worker v2.0
// Provides full offline capability for the Patient Portal.
// Cache-first strategy for app shell, network-first for API.
// ============================================================

const CACHE_VERSION = 'v2';
const PATIENT_CACHE  = `zenithrx-patient-${CACHE_VERSION}`;
const API_CACHE      = `zenithrx-patient-api-${CACHE_VERSION}`;

// Patient app shell assets to pre-cache on install
const PRECACHE_ASSETS = [
  '/patient.html',
  '/icon.png',
  '/patient-manifest.json',
];

// ─── INSTALL: pre-cache the app shell ──────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(PATIENT_CACHE).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
  // Force this SW to become the active SW immediately
  self.skipWaiting();
});

// ─── ACTIVATE: purge old caches from previous versions ─────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== PATIENT_CACHE && key !== API_CACHE)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// ─── FETCH: tiered caching strategy ────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests (POST, etc.)
  if (request.method !== 'GET') return;

  // API calls: network-first, fall back to cached API response
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse.ok) {
            const cloned = networkResponse.clone();
            caches.open(API_CACHE).then((cache) => cache.put(request, cloned));
          }
          return networkResponse;
        })
        .catch(() =>
          caches.match(request).then(
            (cached) =>
              cached ||
              new Response(
                JSON.stringify({ error: 'Offline. Please reconnect.', offline: true }),
                { status: 503, headers: { 'Content-Type': 'application/json' } }
              )
          )
        )
    );
    return;
  }

  // Navigation requests (HTML pages): serve patient.html shell from cache
  if (request.mode === 'navigate') {
    event.respondWith(
      caches.match('/patient.html').then(
        (cached) => cached || fetch(request)
      )
    );
    return;
  }

  // All other static assets: cache-first
  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ||
        fetch(request).then((networkResponse) => {
          if (networkResponse.ok) {
            const cloned = networkResponse.clone();
            caches.open(PATIENT_CACHE).then((cache) => cache.put(request, cloned));
          }
          return networkResponse;
        })
    )
  );
});

// ─── PUSH NOTIFICATIONS (Dose reminders, order updates) ────────────────────
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: 'ZenithRx', body: event.data ? event.data.text() : 'You have a new notification.' };
  }

  const options = {
    body: data.body || 'You have a new notification from ZenithRx Patient Care.',
    icon: '/icon.png',
    badge: '/icon.png',
    vibrate: [200, 100, 200],
    tag: data.tag || 'zenithrx-notification',
    renotify: true,
    data: { url: data.url || '/patient.html' },
    actions: [
      { action: 'open', title: 'View Details' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'ZenithRx Patient Care', options)
  );
});

// ─── NOTIFICATION CLICK ─────────────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const targetUrl = event.notification.data?.url || '/patient.html';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes('/patient') && 'focus' in client) {
          return client.focus();
        }
      }
      return clients.openWindow(targetUrl);
    })
  );
});
