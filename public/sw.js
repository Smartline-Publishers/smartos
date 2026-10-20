const CACHE_NAME = 'smartos-v1';
const STATIC_CACHE = 'smartos-static-v1';
const API_CACHE = 'smartos-api-v1';

// Core app shell assets to precache
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/books',
  '/books/',
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

// API endpoints to cache with stale-while-revalidate
const CACHEABLE_API = [
  '/api/v1/dashboard/summary',
  '/api/v1/books?page=0&size=10',
  '/api/v1/contributors?page=0&size=10',
  '/api/v1/inventory/levels',
  '/api/v1/inventory/warehouses',
  '/api/v1/production/jobs?page=0&size=10',
  '/api/v1/organizations/current'
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

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter((cacheName) => {
          return cacheName !== CACHE_NAME &&
                 cacheName !== STATIC_CACHE &&
                 cacheName !== API_CACHE;
        }).map((cacheName) => caches.delete(cacheName))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Handle API requests with stale-while-revalidate
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      caches.open(API_CACHE).then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          const fetchPromise = fetch(event.request).then((networkResponse) => {
            if (networkResponse.ok) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          });
          return cachedResponse || fetchPromise;
        });
      })
    );
    return;
  }

  // Handle navigation requests (HTML pages) - serve from cache, fallback to network
  if (event.request.mode === 'navigate') {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        return cachedResponse || fetch(event.request).catch(() => {
          return caches.match('/');
        });
      })
    );
    return;
  }

  // Handle static assets - cache first, then network
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return cachedResponse || fetch(event.request).then((networkResponse) => {
        if (networkResponse.ok && STATIC_ASSETS.includes(url.pathname)) {
          caches.open(STATIC_CACHE).then((cache) => {
            cache.put(event.request, networkResponse.clone());
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
