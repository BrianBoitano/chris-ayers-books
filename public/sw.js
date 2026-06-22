// Conservative PWA service worker for chrisayersbooks.com. Network-first so the
// site stays fresh; caches the playable reader shell so The Haunt works offline.
// Never touches POST or /api/ (the save endpoint must always hit the network).
const CACHE = 'haunt-v3';
const SHELL = ['/play/the-haunt', '/play/the-haunt.json',
  '/play/the-vigil', '/play/the-vigil.json',
  '/play/the-understudy', '/play/the-understudy.json', '/which-soul',
  '/covers/the-haunt.jpg', '/icons/haunt-192.png', '/icons/haunt-512.png'];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.pathname.startsWith('/api/')) return;
  e.respondWith(
    fetch(req).then((res) => {
      if (res && res.ok && url.origin === location.origin) {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
      }
      return res;
    }).catch(() => caches.match(req).then((m) => m || caches.match('/play/the-haunt')))
  );
});
