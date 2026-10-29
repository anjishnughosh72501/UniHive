/**
 * UniHive Offline App Shell Service Worker
 * Version 4: MediaWiki Imageinfo API integration & Hardware Photography
 */

const CACHE_NAME = 'unihive-cache-v6';
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
  './js/auth.js',
  './js/media.js',
  './js/store.js',
  './js/rules.js',
  './js/seed.js',
  './js/ui.js',
  './js/qr.js',
  './js/views/explore.js',
  './js/views/login.js',
  './js/views/signup.js',
  './js/views/volunteer.js',
  './js/views/resourceDetail.js',
  './js/views/myBookings.js',
  './js/views/ownerDashboard.js',
  './js/views/incidents.js',
  './js/views/activity.js',
  './js/views/impact.js',
  './js/views/admin.js',
  './js/views/notifications.js',
  './js/views/notFound.js'
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
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          fetch(event.request).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse));
            }
          }).catch(() => {});
          return cachedResponse;
        }

        return fetch(event.request).then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200) {
            return networkResponse;
          }
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache));
          return networkResponse;
        }).catch(() => {
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
        });
      })
    );
  }
});
