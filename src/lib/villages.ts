/**
 * Kraji (relacije odvoza) v občini Žirovnica — po uradnem razporedu JEKO.
 *
 * Mešani komunalni odpadki:
 *  - ponedeljek: Rodine, Smokuč, Vrba, Doslovče, Breznica od št. 1 do 8a in od 13 do 28c
 *  - torek: Breznica nad pokopališčem, Zabreznica, Selo pri Žirovnici, Žirovnica od št. 1 dalje (razen 60–82)
 *  - sreda: Žirovnica od št. 60 do 82, Breg, Moste, Završnica
 *
 * Odpadna embalaža:
 *  - ponedeljek: Rodine, Smokuč, Vrba, Doslovče, Breznica, Zabreznica
 *  - sreda: Selo pri Žirovnici, Žirovnica, Breg, Moste, Završnica
 */

export type Village = {
  id: string; // ključ v bazi in URL-ju
  name: string; // prikazno ime
  detail?: string; // dodatno pojasnilo (hišne številke ipd.)
  /** dan odvoza: 0 = ponedeljek, 1 = torek, 2 = sreda */
  days: { mesani: number; embalaza: number };
};

export const VILLAGES: Village[] = [
  { id: 'smokuc', name: 'Smokuč', days: { mesani: 0, embalaza: 0 } },
  { id: 'rodine', name: 'Rodine', days: { mesani: 0, embalaza: 0 } },
  { id: 'vrba', name: 'Vrba', days: { mesani: 0, embalaza: 0 } },
  { id: 'doslovce', name: 'Doslovče', days: { mesani: 0, embalaza: 0 } },
  {
    id: 'breznica',
    name: 'Breznica',
    detail: 'št. 1–8a in 13–28c',
    days: { mesani: 0, embalaza: 0 },
  },
  {
    id: 'breznica-pokopalisce',
    name: 'Breznica nad pokopališčem',
    days: { mesani: 1, embalaza: 0 },
  },
  { id: 'zabreznica', name: 'Zabreznica', days: { mesani: 1, embalaza: 0 } },
  { id: 'selo', name: 'Selo pri Žirovnici', days: { mesani: 1, embalaza: 2 } },
  {
    id: 'zirovnica',
    name: 'Žirovnica',
    detail: 'od št. 1 dalje, razen 60–82',
    days: { mesani: 1, embalaza: 2 },
  },
  {
    id: 'zirovnica-60-82',
    name: 'Žirovnica 60–82',
    days: { mesani: 2, embalaza: 2 },
  },
  { id: 'breg', name: 'Breg', days: { mesani: 2, embalaza: 2 } },
  { id: 'moste', name: 'Moste', days: { mesani: 2, embalaza: 2 } },
  { id: 'zavrsnica', name: 'Završnica', days: { mesani: 2, embalaza: 2 } },
];

export const DEFAULT_VILLAGE = 'smokuc';

export const DAY_NAMES = ['ponedeljek', 'torek', 'sreda', 'četrtek', 'petek', 'sobota', 'nedelja'];

export function getVillage(id: string | null | undefined): Village {
  return VILLAGES.find((v) => v.id === id) ?? VILLAGES[0];
}

export function villageName(id: string): string {
  return VILLAGES.find((v) => v.id === id)?.name ?? id;
}

/** Kratek opis razporeda za kraj, npr. »mešani ob torkih, embalaža ob sredah«. */
export function villageSummary(v: Village): string {
  if (v.days.mesani === v.days.embalaza) {
    return `odvoz ob ${DAY_NAMES[v.days.mesani]}h`;
  }
  return `mešani ob ${DAY_NAMES[v.days.mesani]}h, embalaža ob ${DAY_NAMES[v.days.embalaza]}h`;
}

/* ------------------------------------------------------------------ */
/* Pretvorba surovih celic PDF koledarja v urnik posameznega kraja      */
/* ------------------------------------------------------------------ */

/** Ena obarvana celica iz koledarja: datum + stolpec v tednu + frakcija. */
export type WeekCell = { date: string; col: number; type: string };

export type VillageEvent = { date: string; types: string[]; note: string | null };

const pad = (n: number) => String(n).padStart(2, '0');

function mondayOf(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  const wd = (dt.getUTCDay() + 6) % 7;
  dt.setUTCDate(dt.getUTCDate() - wd);
  return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`;
}

/**
 * Iz obarvanih celic koledarja sestavi urnik za izbrani kraj.
 *
 * Koledar JEKO v istem tednu obarva dneve vseh treh relacij (po/to/sr) z isto
 * frakcijo. Kraj torej dobi tisti dan, ki ustreza njegovi relaciji; če ta dan
 * ni obarvan (praznik), se odvoz prestavi na naslednji obarvani dan v tednu.
 *
 * Če je podano `year`, se za tedne, ki se začnejo v prejšnjem letu, prestavitev
 * ne sklepa: koledar tega leta vsebuje le del tedna, manjkajoči dnevi pa so v
 * koledarju prejšnjega leta — »manjkajoč« dan torej ni praznik.
 */
export function buildVillageSchedule(cells: WeekCell[], village: Village, year?: number): VillageEvent[] {
  // skupine po tednih in frakcijah
  const weeks = new Map<string, Map<string, WeekCell[]>>();
  for (const c of cells) {
    if (!c.type) continue;
    const wk = mondayOf(c.date);
    if (!weeks.has(wk)) weeks.set(wk, new Map());
    const byType = weeks.get(wk)!;
    if (!byType.has(c.type)) byType.set(c.type, []);
    byType.get(c.type)!.push(c);
  }

  const out = new Map<string, VillageEvent>();
  for (const [monday, byType] of weeks) {
    const partialWeek = year !== undefined && Number(monday.slice(0, 4)) < year;
    for (const [type, list] of byType) {
      const wanted = type === 'embalaza' ? village.days.embalaza : village.days.mesani;
      list.sort((a, b) => a.col - b.col);
      const exact = list.find((c) => c.col === wanted);
      let picked = exact;
      let note: string | null = null;
      if (!picked && !partialWeek) {
        // praznik — odvoz z zamikom na prvi naslednji obarvani dan v tednu
        picked = list.find((c) => c.col > wanted);
        if (picked) note = 'Prestavljen odvoz (praznik)';
      }
      if (!picked) continue;
      const cur = out.get(picked.date);
      if (cur) {
        if (!cur.types.includes(type)) cur.types.push(type);
        if (note && !cur.note) cur.note = note;
      } else {
        out.set(picked.date, { date: picked.date, types: [type], note });
      }
    }
  }
  return Array.from(out.values()).sort((a, b) => (a.date < b.date ? -1 : 1));
}
