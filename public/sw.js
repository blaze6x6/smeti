/* Service worker: omogoča namestitev PWA (Chrome Android: »Namesti aplikacijo«,
   iPhone: »Dodaj na začetni zaslon«) in prikaže lastno stran, ko ni povezave.
   Podatki (urnik) se NE predpomnijo — vedno so sveži; predpomni se samo offline stran. */
const CACHE = 'odvoz-shell-v3';
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

/* ---------- Web Push ---------- */
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { body: event.data ? event.data.text() : '' };
  }
  const title = data.title || 'Odvoz odpadkov';
  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body || '',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag: data.tag || 'odvoz',
      renotify: true,
      data: { url: data.url || '/' },
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if ('focus' in c) {
          return c.focus().then((w) => (w && 'navigate' in w ? w.navigate(url) : w));
        }
      }
      return self.clients.openWindow(url);
    }),
  );
});
