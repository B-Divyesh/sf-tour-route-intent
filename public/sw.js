const CACHE = 'tour-route-intent-v4';
const SHELL = ['/assets/route-geometry.webp', '/assets/route-geometry-mobile.webp', '/favicon.svg', '/privacy/', '/terms/'];

async function cacheShell() {
  const cache = await caches.open(CACHE);
  const page = await fetch('/', { cache: 'reload' });
  if (!page.ok) throw new Error('App shell unavailable');
  await cache.put('/', page.clone());
  const html = await page.text();
  const buildAssets = [...html.matchAll(/(?:src|href)="(\/assets\/[^"?#]+\.(?:js|css))"/g)].map((match) => match[1]);
  await cache.addAll([...SHELL, ...buildAssets]);
}

self.addEventListener('install', (event) => event.waitUntil(cacheShell()));
self.addEventListener('activate', (event) => event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))));
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== location.origin) return;
  event.respondWith(caches.match(event.request, { ignoreVary: true }).then((cached) => cached || fetch(event.request).then((response) => {
    if (response.ok) caches.open(CACHE).then((cache) => cache.put(event.request, response.clone()));
    return response;
  }).catch(() => event.request.mode === 'navigate' ? caches.match('/', { ignoreVary: true }) : Response.error())));
});
