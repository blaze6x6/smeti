# Koledar odvoza odpadkov — Smokuč (občina Žirovnica)

Spletna aplikacija s koledarjem odvoza odpadkov za **vse kraje v občini Žirovnica**,
z uvozom uradnih PDF koledarjev **JEKO Jesenice** in **e-poštnimi obvestili dan pred odvozom** (nodemailer).

Kraj izbereš v spustnem meniju; urnik se izračuna po uradnih relacijah JEKO:
ponedeljek (Rodine, Smokuč, Vrba, Doslovče, Breznica), torek (Breznica nad pokopališčem,
Zabreznica, Selo pri Žirovnici, Žirovnica) in sreda (Žirovnica 60–82, Breg, Moste, Završnica).
Embalaža ima ponekod drugačen dan kot mešani odpadki — to je upoštevano.
Aplikacija sama prebere obarvane celice iz uradnega PDF koledarja (vektorski **in** skeniran/raster PDF),
pripravi urnik ponedeljkov ter upošteva tudi prestavitve zaradi praznikov.

## Funkcionalnosti

- 📍 **Vsi kraji občine** — izbira kraja v spustnem meniju, urnik po uradnih relacijah (po/to/sr)
- 📅 **Mesečni koledar** — pomikanje s puščicama ali s potegom prsta, barve po frakcijah, izjeme ob praznikih
- 📄 **Uvoz PDF za vsako leto** — uradni koledar JEKO; avtomatsko branje celic (brez ročnega prepisovanja)
- ✉️ **Obvestila po e-pošti** — dan pred odvozom (privzeto ob 18:00) za **naročnikov kraj**; nodemailer
- ♻️ **14 frakcij odpadkov** in zbirna mesta (zbirna centra Žirovnica/Jesenice, ekološki otoki, tekstil)
- 📱 **Mobilno + PWA** — prilagojeno Android/iPhone, dodaj na začetni zaslon kot aplikacijo
- 🔐 **Zaščiteno zaledje** — `/admin` zaklene geslo iz `.env` (`ADMIN_PASSWORD`); javni koledar ostane brez prijave
- 🐘 **PostgreSQL + Drizzle ORM** — migracije in seed tečejo samodejno ob zagonu

## Zagon z Dockerjem (priporočeno)

```bash
cp .env.example .env        # nastavi SMTP podatke
docker compose up -d --build
```

Odpri http://localhost:3000 — koledar je napolnjen z uradnimi podatki 2025/2026.
Zaledje: http://localhost:3000/admin

> **Napaka `/package-lock.json: not found` ob gradnji?** V repozitoriju je `package-lock.json` prisoten;
> če ga je tvoj checkout izpustil, ga obnovi lokalno pred gradnjo:
> ```bash
> npm install --package-lock-only
> ```
> Dockerfile sicer zdaj brez prestanka dela v obeh primerih (fallback `npm install`),
> a je za ponovljive gradnje priporočljivo imeti lockfile commitan.

### Okoljske spremenljivke

| Spremenljivka | Opis |
|---|---|
| `DATABASE_URL` | postavi `docker-compose` (lokalno: postgres na 127.0.0.1) |
| `SMTP_HOST` `SMTP_PORT` `SMTP_USER` `SMTP_PASS` | SMTP strežnik za pošiljanje (nodemailer) |
| `SMTP_FROM` | naslov pošiljatelja (neobvezno) |
| `SMTP_SECURE` | `true` za SSL/465, sicer `false` (STARTTLS) |
| `APP_BASE_URL` | javni naslov aplikacije (za povezavo za odjavo v mailih) |
| `ADMIN_PASSWORD` | geslo za zaledje `/admin`; če je prazno, je zaledje odprto |
| `ADMIN_SECRET` | neobvezno: ločen ključ za podpis seje (sicer izpeljan iz gesla) |
| `CRON_SECRET` | če je nastavljen, klic `/api/cron/daily?secret=...` zahteva ključ |

## Uvoz novega leta (pdf)

1. Odpri `/admin` → zavihek **Uvoz PDF** (urnik se shrani za vse kraje hkrati)
2. Vpiši leto, izberi uradni PDF (jeko.si → Koledar odvoza Žirovnica) in klikni **Preberi PDF**
3. Preveri predogled (urediš lahko vsako vrstico posebej) in **Shrani v koledar**
4. Če PDF ni berljiv, uporabi **Generator izmeničnega urnika** ali ročni vnos

## Zaščita zaledja

V `.env` nastavi geslo:

```bash
ADMIN_PASSWORD=mocno-geslo-123
```

Po ponovnem zagonu (`docker compose up -d`) `/admin` in vse poti `/api/admin/*`
zahtevajo prijavo. Seja se hrani v podpisanem HttpOnly piškotku in velja 30 dni;
odjaviš se z gumbom **Odjava** v zaledju. Če gesla ne nastaviš, zaledje ostane odprto
(primerno samo za lokalno uporabo ali za zaščito na reverse proxyju).

## Obvestila

- Pogon teče **znotraj aplikacije** (preverjanje vsako minuto) in pošlje obvestilo ob nastavljeni uri dan pred odvozom.
- Rezerva: zunanji `curl` klic `GET /api/cron/daily?force=1` (ali brez `force` ob nastavljeni uri).
- Test: `/admin` → **Nastavitve** → »Pošlji test« / »Sproži obvestilo zdaj«.

## Lokalni razvoj

```bash
npm ci
npm run build            # ali: npm run dev
npx drizzle-kit push      # uredi bazo (brez migracij)
npm run db:seed           # napolni uradne podatke (idempotentno)
npm run start
```

## Tehnologije

Next.js (App Router) · Tailwind CSS · PostgreSQL + Drizzle ORM · nodemailer · node-cron ·
pdfjs-dist + @napi-rs/canvas (branje PDF koledarjev) · Docker (multi-stage, standalone)

Viri podatkov: [JEKO d.o.o. Jesenice — Koledar individualnega odvoza odpadkov, Občina Žirovnica](https://jeko.si/odpadki/)
