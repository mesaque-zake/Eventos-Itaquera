
self.addEventListener('install', (e) => {
  console.log('Service Worker: Instalado');
});

self.addEventListener('fetch', (e) => {
  // O iFrame precisa de rede, então apenas repassamos as requisições
  e.respondWith(fetch(e.request));
});
