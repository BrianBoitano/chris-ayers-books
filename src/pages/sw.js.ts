// Build-generated service worker, served at /sw.js. Network-first PWA: stays fresh,
// caches the play shell for offline, never touches POST or /api/. The precache shell
// and the cache version are derived from the ENCORE books collection, so adding a book
// updates the service worker automatically (the version bumps only when the shell
// changes). Registered by src/layouts/BaseLayout.astro.

import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import crypto from 'node:crypto';

export const prerender = true;

export const GET: APIRoute = async () => {
  const books = (await getCollection('books'))
    .filter((b) => b.data.work === 'encore')
    .sort((a, b) => (a.data.order ?? 99) - (b.data.order ?? 99));

  // Core shell + each book's reader page and play graph. Backdrops/covers are cached
  // on demand by the network-first fetch handler, so they are not precached here.
  const shell = ['/', '/play', '/which-soul', '/covers/the-haunt.jpg',
    '/icons/haunt-192.png', '/icons/haunt-512.png'];
  for (const b of books) shell.push(`/play/${b.slug}`, `/play/${b.slug}.json`);

  const version = 'enc-' + crypto.createHash('sha1').update(shell.join('|')).digest('hex').slice(0, 10);

  const body = `// AUTO-GENERATED at build by src/pages/sw.js.ts. Do not edit by hand.
const CACHE = ${JSON.stringify(version)};
const SHELL = ${JSON.stringify(shell)};
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
    }).catch(() => caches.match(req).then((m) => m || caches.match('/play')))
  );
});
`;

  return new Response(body, { headers: { 'content-type': 'text/javascript; charset=utf-8' } });
};
