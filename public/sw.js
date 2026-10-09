/* Minimalen service worker: omogoča namestitev PWA ("Dodaj na začetni zaslon").
   Brez fetch handlerja — brskalnik sam opravi omrežne zahteve (brez dodatne zakasnitve),
   vsebina je vedno sveža. */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));
