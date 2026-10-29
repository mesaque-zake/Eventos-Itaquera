// Troque o número a cada atualização publicada (v15 -> v16 ...)
const CACHE_NAME = 'v16';
const NETWORK_TIMEOUT = 4000; // ms que espera a internet antes de usar o cache

const assets = [
  './',
  'index.html',
  'manifest.json',
  'Icones/Favicon.png',
  'Icones/Icon180.png',
  'Icones/Icon192.png',
  'Icones/Icon512.png',
  // Imagens da abertura animada (mosaico, luzes e "caneta")
  'Mesa/A.png',
  'Mesa/B.png',
  'Mesa/C.png',
  'Mesa/D.png',
  'Mesa/E.png',
  'Mesa/F.png'
];

// 1. INSTALAÇÃO
// allSettled: se um arquivo faltar (404), os outros continuam sendo salvos
// e o service worker NÃO deixa de instalar.
self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.allSettled(
        assets.map((url) =>
          cache.add(url).catch((err) => {
            console.warn('[Service Worker] Não foi possível salvar:', url, err);
          })
        )
      )
    )
  );
});

// 2. ATIVAÇÃO (limpa caches antigos e assume o controle)
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
      )
      .then(() => self.clients.claim())
  );
});

// 3. REDE: network-first com timeout + cache de reserva
function fetchComTimeout(req, ms) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  // cache: 'no-cache' força a revalidação (o GitHub Pages guarda 10 min no cache do navegador)
  return fetch(req, { signal: ctrl.signal, cache: 'no-cache' }).finally(() => clearTimeout(timer));
}

async function redePrimeiro(req) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const res = await fetchComTimeout(req, NETWORK_TIMEOUT);
    // Guarda a versão mais nova para o modo offline
    if (res && res.status === 200) cache.put(req, res.clone()).catch(() => {});
    return res;
  } catch (err) {
    const salvo = await cache.match(req, { ignoreSearch: true });
    if (salvo) return salvo;

    // Navegação sem cache exato: devolve o shell
    if (req.mode === 'navigate') {
      const shell = (await cache.match('index.html')) || (await cache.match('./'));
      if (shell) return shell;
    }

    return new Response('Sem conexão', {
      status: 503,
      statusText: 'Offline',
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });
  }
}

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;

  // Ignora outros domínios (GAS, Google Fonts, Tailwind): deixa o navegador cuidar
  if (new URL(e.request.url).origin !== self.location.origin) return;

  e.respondWith(redePrimeiro(e.request));
});
