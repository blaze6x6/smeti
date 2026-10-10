/* Service worker: omogoča namestitev PWA (Chrome Android: »Namesti aplikacijo«,
   iPhone: »Dodaj na začetni zaslon«) in prikaže lastno stran, ko ni povezave.
   Podatki (urnik) se NE predpomnijo — vedno so sveži; predpomni se samo offline stran. */
const CACHE = 'odvoz-shell-v1';
const OFFLINE_URL = '/offline.html';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((c) => c.add(new Request(OFFLINE_URL, { cache: 'reload' })))
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
  if (req.mode !== 'navigate') return;
  event.respondWith(fetch(req).catch(() => caches.match(OFFLINE_URL)));
});
