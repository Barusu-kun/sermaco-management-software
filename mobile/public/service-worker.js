const CACHE_NAME = 'pt-chauffeur-v1';
const APP_SHELL = ['/', '/index.html', '/manifest.json'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  // Ne pas mettre en cache les appels API (toujours frais)
  if (request.url.includes('/api/')) {
    event.respondWith(fetch(request).catch(() => caches.match(request)));
    return;
  }
  // Cache-first pour l'app shell
  event.respondWith(caches.match(request).then((cached) => cached || fetch(request)));
});
