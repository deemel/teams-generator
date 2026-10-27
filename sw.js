// Bump this whenever any cached file changes (index.html, manifest.json,
// icons, or this file). The new name makes browsers install the new
// version, and the activate handler below deletes the old cache.
// It's also what the app shows at the bottom of the page (see the
// 'message' listener below).
const CACHE_NAME = 'teams-tracker-cache-v3';

const FILES_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './favicon.png',
  './favicon-192.png',
  './favicon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(FILES_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Replies with this service worker's CACHE_NAME, so the page can show
// which version is currently serving the app.
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'GET_VERSION' && event.ports[0]) {
    event.ports[0].postMessage(CACHE_NAME);
  }
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).catch(() => {
        // If offline and not cached, fall back to the cached index.html
        // for navigation requests so the app still opens.
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
