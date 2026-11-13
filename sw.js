// Keeps a hosted copy of Doodlings working without a connection after the first visit.
// Only this site's own pages and pictures are kept here. Doodlings themselves stay in the browser's own storage.
const CACHE = 'doodlings-3';
const CORE = ['./', './manifest.webmanifest', './icon-192.png', './icon-512.png', './guide/media/cover.jpg'];

self.addEventListener('install', (e) => { self.skipWaiting(); e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE))); });
// other things may live at the same address: only ever clear out older Doodlings
self.addEventListener('activate', (e) => e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k.startsWith('doodlings-') && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== self.location.origin || !url.pathname.startsWith(new URL('./', self.location.href).pathname)) return;
  // the newest copy when there is a connection, the kept one when there is not
  e.respondWith(caches.open(CACHE).then(async (cache) => {
    try {
      const res = await fetch(e.request);
      if (res.ok && res.status === 200 && res.type === 'basic') cache.put(e.request, res.clone());
      return res;
    } catch (err) {
      const hit = await cache.match(e.request, { ignoreSearch: true });
      if (hit) return hit;
      throw err;
    }
  }));
});
