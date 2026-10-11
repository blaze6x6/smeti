/* Service worker: omogoča namestitev PWA (Chrome Android: »Namesti aplikacijo«,
   iPhone: »Dodaj na začetni zaslon«) in prikaže lastno stran, ko ni povezave.
   Podatki (urnik) se NE predpomnijo — vedno so sveži; predpomni se samo offline stran. */
const CACHE = 'odvoz-shell-v2';
const OFFLINE_URL = '/offline.html';
const PRECACHE = [OFFLINE_URL, '/themes.css'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((c) => c.addAll(PRECACHE.map((u) => new Request(u, { cache: 'reload' }))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  // samo odpiranje strani; vse ostalo gre neposredno v omrežje
  if (req.mode !== 'navigate') {
    // offline stran potrebuje temo
    if (new URL(req.url).pathname === '/themes.css') {
      event.respondWith(fetch(req).catch(() => caches.match('/themes.css')));
    }
    return;
  }
  event.respondWith(fetch(req).catch(() => caches.match(OFFLINE_URL)));
});
