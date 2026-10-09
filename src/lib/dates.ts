/** Datumske pomožne funkcije za časovni pas Europe/Ljubljana (brez odvisnosti od ICU). */

export const MONTHS_SL = [
  'januar', 'februar', 'marec', 'april', 'maj', 'junij',
  'julij', 'avgust', 'september', 'oktober', 'november', 'december',
];
export const DAYS_SL = ['nedelja', 'ponedeljek', 'torek', 'sreda', 'četrtek', 'petek', 'sobota'];
export const DAYS_SL_SHORT = ['ne', 'po', 'to', 'sr', 'če', 'pe', 'so'];

export type YMD = { y: number; m: number; d: number };

export const pad2 = (n: number) => String(n).padStart(2, '0');
export const toStr = (p: YMD) => `${p.y}-${pad2(p.m)}-${pad2(p.d)}`;
export function parseDateStr(s: string): YMD {
  const [y, m, d] = s.split('-').map(Number);
  return { y, m, d };
}
export function weekdayOf(s: string): number {
  // 0=nedelja .. 6=sobota
  const { y, m, d } = parseDateStr(s);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}
export function addDaysStr(s: string, n: number): string {
  const { y, m, d } = parseDateStr(s);
  const t = new Date(Date.UTC(y, m - 1, d + n));
  return toStr({ y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate() });
}
export function diffDaysStr(a: string, b: string): number {
  // b - a v dneh
  const pa = parseDateStr(a);
  const pb = parseDateStr(b);
  return Math.round((Date.UTC(pb.y, pb.m - 1, pb.d) - Date.UTC(pa.y, pa.m - 1, pa.d)) / 86400000);
}

/* -------- trenutni čas v Ljubljani (CET/CEST, brez Intl) -------- */

function lastSundayUtc(year: number, month1: number): number {
  // zadnja nedelja v mesecu (month1: 1-12) ob 01:00 UTC
  let day = 31;
  while (day > 24) {
    const t = new Date(Date.UTC(year, month1 - 1, day));
    if (t.getUTCDay() === 0 && t.getUTCMonth() === month1 - 1) return day;
    day--;
  }
  return 25;
}

export function ljubljanaNow(): Date {
  const now = Date.now();
  const ref = new Date(now);
  const y = ref.getUTCFullYear();
  const dstStart = Date.UTC(y, 2, lastSundayUtc(y, 3), 1, 0, 0); // zadnja nedelja v marcu 01:00 UTC
  const dstEnd = Date.UTC(y, 9, lastSundayUtc(y, 10), 1, 0, 0);
  const offsetMin = now >= dstStart && now < dstEnd ? 120 : 60;
  return new Date(now + offsetMin * 60000);
}

export type LjParts = { y: number; m: number; d: number; hh: number; mm: number; wd: number };
export function ljubljanaParts(): LjParts {
  const t = ljubljanaNow();
  return {
    y: t.getUTCFullYear(),
    m: t.getUTCMonth() + 1,
    d: t.getUTCDate(),
    hh: t.getUTCHours(),
    mm: t.getUTCMinutes(),
    wd: t.getUTCDay(),
  };
}

export function todayStr(): string {
  const p = ljubljanaParts();
  return toStr({ y: p.y, m: p.m, d: p.d });
}

/* -------- slovensko formatiranje -------- */

export function formatSlLong(s: string): string {
  const { y, m, d } = parseDateStr(s);
  return `${DAYS_SL[weekdayOf(s)]}, ${d}. ${MONTHS_SL[m - 1]} ${y}`;
}
export function formatSlShort(s: string): string {
  const { m, d } = parseDateStr(s);
  return `${DAYS_SL_SHORT[weekdayOf(s)]}, ${d}. ${MONTHS_SL[m - 1].slice(0, 3)}.`;
}

/** ponovljen časovni žig za primerjave "danes ob HH:MM" */
export function minutesNowLj(): number {
  const p = ljubljanaParts();
  return p.hh * 60 + p.mm;
}

/** »pon, 5. 1. 2026« — kratek slovenski zapis z dnevom v tednu. */
export function formatSlDay(s: string): string {
  const { y, m, d } = parseDateStr(s);
  return `${DAYS_SL_SHORT[weekdayOf(s)]}, ${d}. ${m}. ${y}`;
}

/** »5. 1. 2026« */
export function formatSlNumeric(s: string): string {
  const { y, m, d } = parseDateStr(s);
  return `${d}. ${m}. ${y}`;
}

/**
 * Razčleni slovenski vnos datuma (»5. 1. 2026«, »5.1.2026«, »05/01/2026«, tudi ISO »2026-01-05«)
 * v ISO niz. Vrne null, če datum ni veljaven (npr. 31. 2.).
 */
export function parseSlDate(text: string): string | null {
  const t = text.trim();
  let y: number, m: number, d: number;
  let mt = t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (mt) {
    [y, m, d] = [Number(mt[1]), Number(mt[2]), Number(mt[3])];
  } else {
    mt = t.match(/^(\d{1,2})\s*[.\/-]\s*(\d{1,2})\s*[.\/-]?\s*(\d{4})$/);
    if (!mt) return null;
    [d, m, y] = [Number(mt[1]), Number(mt[2]), Number(mt[3])];
  }
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) return null;
  return toStr({ y, m, d });
}
