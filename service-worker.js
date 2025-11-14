// service-worker.js — versão otimizada (funciona offline + PDF online)
const CACHE_NAME = "ronda-cache-v2";
const FILES_TO_CACHE = [
  "index.html",
  "manifest.json",
  "icon-192.png",
  "icon-512.png",
  "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"
];

// Instala e faz cache dos arquivos essenciais
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(FILES_TO_CACHE))
      .then(() => self.skipWaiting())
  );
});

// Ativa e remove caches antigos
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(key => {
        if (key !== CACHE_NAME) {
          return caches.delete(key);
        }
      }))
    )
  );
  self.clients.claim();
});

// Estratégia híbrida: usa cache offline, mas tenta buscar online primeiro
self.addEventListener("fetch", event => {
  const request = event.request;

  // Ignora requisições do jsPDF (para funcionar o PDF online)
  if (request.url.includes("jspdf")) {
    return;
  }

  // Para o restante, tenta a rede primeiro, depois cache
  event.respondWith(
    fetch(request)
      .then(response => {
        // Se obtiver resposta da rede, atualiza o cache
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
        return response;
      })
      .catch(() => caches.match(request))
  );
});
