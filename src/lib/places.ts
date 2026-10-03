/** Zbirna mesta: zbirna centra JEKO in ekološki otoki / ulični zabojniki. */

export type OpeningRow = { days: string; hours: string; closed?: boolean };

export type CollectionCentre = {
  id: string;
  name: string;
  address: string;
  phone?: string;
  email?: string;
  mapQuery: string;
  opening: OpeningRow[];
  note?: string;
  accepts: string[]; // id-ji frakcij (WasteTypeId)
};

export const CENTRES: CollectionCentre[] = [
  {
    id: 'zc-zirovnica',
    name: 'Zbirni center Žirovnica',
    address: 'Žirovnica 66, 4274 Žirovnica',
    phone: '04 581 04 91',
    email: 'zbirnicenter.zirovnica@jeko.si',
    mapQuery: 'Zbirni center Žirovnica',
    opening: [
      { days: 'Ponedeljek', hours: 'zaprto', closed: true },
      { days: 'Torek–petek', hours: '11.00–18.00' },
      { days: 'Sobota', hours: '8.00–12.00' },
      { days: 'Nedelja, prazniki', hours: 'zaprto', closed: true },
    ],
    note: 'Pozor: ravno v ponedeljek, ko je v večini vasi odvoz, je zbirni center zaprt.',
    accepts: ['papir', 'steklo', 'embalaza', 'kovine', 'les', 'tekstil', 'olja', 'nevarni', 'eeo', 'baterije', 'kosovni', 'zeleni'],
  },
  {
    id: 'zc-jesenice',
    name: 'Zbirni center Jesenice',
    address: 'Cesta Franceta Prešerna 13, 4270 Jesenice',
    phone: '04 581 04 90',
    email: 'zbirnicenter.jesenice@jeko.si',
    mapQuery: 'Zbirni center Jesenice Cesta Franceta Prešerna 13',
    opening: [
      { days: 'Ponedeljek–petek', hours: '10.00–17.00' },
      { days: 'Sobota', hours: '8.00–13.00' },
      { days: 'Nedelja, prazniki', hours: 'zaprto', closed: true },
    ],
    note: 'Odprt tudi ob ponedeljkih. V zbirnem centru je kotiček za ponovno uporabo še uporabnih predmetov.',
    accepts: ['papir', 'steklo', 'embalaza', 'kovine', 'les', 'tekstil', 'olja', 'nevarni', 'eeo', 'baterije', 'kosovni', 'zeleni'],
  },
];

/** Splošne informacije o ekoloških otokih. */
export const ECO_ISLANDS = {
  title: 'Ekološki otoki',
  desc:
    'Ekološki otoki so postavljeni po vaseh v občini Žirovnica — na njih so zabojniki za papir in kartonsko embalažo ter za stekleno embalažo. Dostopni so ves čas, odpadke pa odlagamo le v ustrezne zabojnike in jih pred tem stisnemo.',
  accepts: ['papir', 'steklo'],
  rules: [
    'Embalažo pred odlaganjem stisni, da zavzame manj prostora.',
    'Steklenic ne odlagaj v vrečkah — vrečko odnesi s seboj.',
    'S steklenic odstrani pokrovčke (sodijo med embalažo).',
    'Ob zabojnike ne odlagaj kosovnih odpadkov ali vreč z mešanimi odpadki.',
  ],
};

/** Ulični zabojniki za uporaben tekstil (JEKO + Tekstilko). */
export const TEXTILE_POINTS: string[] = [
  'Zbirni center Žirovnica (Žirovnica 66)',
  'Zbirni center Jesenice (Cesta Franceta Prešerna 13)',
  'Ekološki otok Blejska Dobrava 93',
  'Ekološki otok Hrušica – podvoz (pri Hrušici 49a)',
  'Ekološki otok Cesta revolucije 2, Jesenice',
  'Ekološki otok Cesta Cirila Tavčarja 3b, Jesenice',
  'Ekološki otok Ulica Mirka Roglja 1, Jesenice',
  'Ekološki otok Cesta maršala Tita 4, Jesenice',
  'Ekološki otok pri OŠ Prežihov Voranc (C. Toneta Tomšiča 5)',
  'Ekološki otok Ulica bratov Stražišarjev 5 (pri podvozu)',
  'Skupinski odjem Cesta talcev 8c, Jesenice',
  'Ekološki otok Cesta Alojza Travna 20, Jesenice',
  'Parkirišče pri Cesti Franceta Prešerna 54, Jesenice',
];

export const JEKO_CONTACT = {
  company: 'JEKO, d.o.o., Jesenice',
  address: 'Cesta maršala Tita 51, 4270 Jesenice',
  wasteInfo: { name: 'Splošne informacije o odpadkih', phone: '04 581 04 55', email: 'marko.langus@jeko.si' },
  bulky: 'Odvoz kosovnih odpadkov naročiš z dopisnico ali prek spletnega obrazca na jeko.si.',
  url: 'https://jeko.si/odpadki/',
};
