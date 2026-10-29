/**
 * CampusShare Offline App Shell Service Worker
 */

const CACHE_NAME = 'campusshare-cache-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './css/tokens.css',
  './css/base.css',
  './css/components.css',
  './css/pages.css',
  './css/motion.css',
  './js/app.js',
  './js/store.js',
  './js/rules.js',
  './js/seed.js',
  './js/ui.js',
  './js/qr.js',
  './js/views/explore.js',
  './js/views/resourceDetail.js',
  './js/views/myBookings.js',
  './js/views/ownerDashboard.js',
  './js/views/incidents.js',
  './js/views/activity.js',
  './js/views/impact.js',
  './js/views/admin.js',
  './js/views/notifications.js',
  './js/views/notFound.js',
  './tests/rules.test.html'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((response) => {
        // Return response directly if not ok or external non-cached
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return response;
      }).catch(() => {
        if (event.request.destination === 'document') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
