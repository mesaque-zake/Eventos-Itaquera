const CACHE_NAME = 'acoes-v3';
const assets = ['index.html', 'manifest.json', 'favicon.png', 'icone-192.png', 'icone-512.png', 'MesaLogo.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(assets);
    })
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});
