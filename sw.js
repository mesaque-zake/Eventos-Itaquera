const CACHE_NAME = 'v6'; 
const assets = [
  './',
  'index.html',
  'manifest.json',
  'favicon.png',
  'icone-192.png',
  'icone-512.png',
  'apple-touch-icon.png', 
  'MesaLogo.png'
];

// 1. INSTALAÇÃO (Baixa os arquivos e força a atualização imediata)
self.addEventListener('install', (e) => {
  self.skipWaiting(); // Não espera o usuário fechar o app para atualizar
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Fazendo cache dos assets do Shell');
      return cache.addAll(assets);
    })
  );
});

// 2. ATIVAÇÃO (O Garbage Collector: Limpa os caches antigos e mortos)
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Purgando cache antigo:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim()) // Assume o controle do PWA imediatamente
  );
});

// 3. INTERCEPTAÇÃO DE REDE (Fetch Strategy: Network-First)
self.addEventListener('fetch', (e) => {
  // BLINDAGEM: Ignora requisições de outros domínios (Deixa o iFrame do Google em paz)
  if (!e.request.url.startsWith(self.location.origin)) {
    return;
  }

  e.respondWith(
    // Tenta ir na internet primeiro para pegar a versão mais recente
    fetch(e.request).catch(() => {
      // Se estiver offline ou a internet cair, busca no cache local
      return caches.match(e.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        } 
        // Se a navegação principal falhar e não achar no cache exato, força o index.html
        else if (e.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
