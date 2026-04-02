const CACHE_NAME = 'navegantes-v2';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  self.skipWaiting(); // Force the waiting service worker to become the active service worker.
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

self.addEventListener('activate', (event) => {
  // Delete all caches that aren't named in CACHE_NAME.
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deletando cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim()) // claim clients immediately
  );
});

self.addEventListener('fetch', (event) => {
  // Try network first, then fall back to cache. Better for SPA dynamic HTML!
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Se pegou algo novo, você pode até atualizar o cache, mas por enquanto só returna
        return response;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});
