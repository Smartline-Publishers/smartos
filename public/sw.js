const CACHE_NAME = 'smartos-v2';
const STATIC_CACHE = 'smartos-static-v2';

// Core app shell assets to precache (same-origin only).
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/books',
  '/manuscripts',
  '/inventory',
  '/tasks',
  '/customers',
  '/finance',
  '/royalties',
  '/users',
  '/reports',
  '/audit',
  '/profile',
  '/settings',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/icons/icon-16.png',
  '/icons/icon-32.png',
  '/icons/icon-48.png',
  '/icons/icon-64.png',
  '/icons/icon-96.png',
  '/icons/icon-128.png',
  '/icons/icon-192.png',
  '/icons/icon-256.png',
  '/icons/icon-384.png',
  '/icons/icon-512.png',
  '/icons/maskable-icon.png',
  '/icons/favicon-32x32.png',
  '/icons/favicon-16x16.png',
  '/icons/apple-touch-icon.png',
  '/manifest.json'
];

// Install: precache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[SW] Some static assets failed to cache:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate: remove every previous cache version, including the old API cache.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== STATIC_CACHE && name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: never intercept API calls. Authentication responses must always come
// from the network: stale-while-revalidate here could serve an old 401/403 (or
// an old user's data) and made login appear broken. Cross-origin requests are
// likewise left entirely to the browser.
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  if (url.origin !== self.location.origin) {
    return;
  }
  if (url.pathname.startsWith('/api/')) {
    return;
  }
  if (event.request.method !== 'GET') {
    return;
  }

  // Navigations: network first so a new deploy is visible immediately, with
  // the cached shell as an offline fallback.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request).then((cached) => cached || caches.match('/')))
    );
    return;
  }

  // Static assets: cache first, then network.
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return cachedResponse || fetch(event.request).then((networkResponse) => {
        const responseClone = networkResponse.clone();
        if (networkResponse.ok && STATIC_ASSETS.includes(url.pathname)) {
          caches.open(STATIC_CACHE).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      });
    })
  );
});

// Listen for messages from the client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
