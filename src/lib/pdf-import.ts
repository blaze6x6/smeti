/**
 * Uvoz koledarja odvoza odpadkov iz PDF-ja (JEKO Jesenice / občina Žirovnica).
 *
 * Dve strategiji:
 *  - "vector": PDF z vektorskim besedilom in barvnimi celicami (npr. koledar 2025)
 *  - "raster": skenirani/rasterizirani PDF (npr. koledar 2026) — render + analiza pikslov
 *
 * Izhod: seznam obarvanih celic (datum, stolpec v tednu, barva) za celo leto.
 */

import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';

export type RawCell = {
  month: number; // 1-12
  day: number; // dan v mesecu
  weekRow: number; // zaporedna tedenska vrstica v mesecu (0-5)
  col: number; // stolpec v tednu: 0=ponedeljek ... 6=nedelja
  colorHex: string; // zaznana barva celice (#rrggbb)
};

export type ParsedCalendar = {
  method: 'vector' | 'raster';
  yearDetected: number | null;
  cells: RawCell[];
  colors: string[]; // vse zaznane barve (brez belih/sivih)
  pages: number;
};

const MONTHS_SL = [
  'JANUAR', 'FEBRUAR', 'MAREC', 'APRIL', 'MAJ', 'JUNIJ',
  'JULIJ', 'AVGUST', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DECEMBER',
];
const WEEKDAYS_SL = ['Po', 'To', 'Sr', 'Če', 'Pe', 'So', 'Ne'];

/* ------------------------------------------------------------------ */
/* Pomozne funkcije za datume                                          */
/* ------------------------------------------------------------------ */

export function monthOffsetMonday(month: number, year: number): number {
  // na kateri stolpec (0=Po) pade 1. v mesecu
  return (new Date(year, month - 1, 1).getDay() + 6) % 7;
}
export function daysInMonth(month: number, year: number): number {
  return new Date(year, month, 0).getDate();
}

/* ------------------------------------------------------------------ */
/* VEKTORSKA pot                                                       */
/* ------------------------------------------------------------------ */

type Rect = { x0: number; y0: number; x1: number; y1: number; c: string };

const FILL_OPS = new Set([pdfjs.OPS.fill, pdfjs.OPS.eoFill, pdfjs.OPS.fillStroke, pdfjs.OPS.eoFillStroke]);
const DRAW = { moveTo: 0, lineTo: 1, curveTo: 2, quadraticCurveTo: 3, closePath: 4 } as const;

type OpList = Awaited<ReturnType<pdfjs.PDFPageProxy['getOperatorList']>>;

function collectColoredRects(opList: OpList): Rect[] {
  const nameOf: Record<number, string> = {};
  for (const [k, v] of Object.entries(pdfjs.OPS)) if (typeof v === 'number') nameOf[v] = k;
  let ctm = [1, 0, 0, 1, 0, 0] as number[];
  const stack: number[][] = [];
  let fillColor = '#000000';
  const apply = (m: number[], x: number, y: number): [number, number] => [
    m[0] * x + m[2] * y + m[4],
    m[1] * x + m[3] * y + m[5],
  ];
  const rects: Rect[] = [];
  for (let i = 0; i < opList.fnArray.length; i++) {
    const fn = opList.fnArray[i];
    const a = opList.argsArray[i] as unknown[];
    const nm = nameOf[fn];
    if (fn === pdfjs.OPS.save) stack.push([...ctm]);
    else if (fn === pdfjs.OPS.restore) ctm = stack.pop() || ctm;
    else if (fn === pdfjs.OPS.transform) ctm = pdfjs.Util.transform(ctm, a as number[]);
    else if (nm === 'setFillRGBColor') fillColor = String(a?.[0] ?? '').toLowerCase();
    else if (nm === 'constructPath') {
      const paintOp = a[0] as number;
      if (!FILL_OPS.has(paintOp)) continue;
      const data = a[1] as unknown[];
      const path = Array.from(((data && data[0]) || []) as ArrayLike<number>);
      let sub: [number, number][] = [];
      let j = 0;
      const flush = () => {
        if (sub.length) {
          const xs = sub.map((p) => p[0]);
          const ys = sub.map((p) => p[1]);
          rects.push({ x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys), c: fillColor });
          sub = [];
        }
      };
      while (j < path.length) {
        const op = path[j++];
        if (op === DRAW.moveTo) { flush(); sub = [apply(ctm, path[j++], path[j++])]; }
        else if (op === DRAW.lineTo) { sub.push(apply(ctm, path[j++], path[j++])); }
        else if (op === DRAW.curveTo) {
          sub.push(apply(ctm, path[j], path[j + 1]), apply(ctm, path[j + 2], path[j + 3]), apply(ctm, path[j + 4], path[j + 5]));
          j += 6;
        } else if (op === DRAW.quadraticCurveTo) { sub.push(apply(ctm, path[j], path[j + 1]), apply(ctm, path[j + 2], path[j + 3])); j += 4; }
        else if (op === DRAW.closePath) flush();
        else j++;
      }
      flush();
    }
  }
  return rects.filter((r) => r.c && r.c !== '#ffffff' && r.c !== '#000000' && r.c !== '#231f20' && (r.x1 - r.x0) < 220 && (r.y1 - r.y0) < 220 && (r.x1 - r.x0) > 4 && (r.y1 - r.y0) > 4);
}

async function parseVector(page: pdfjs.PDFPageProxy, opList: OpList): Promise<{ cells: RawCell[]; colors: string[] }> {
  const text = await page.getTextContent();
  type Item = { s: string; x: number; y: number };
  const items: Item[] = [];
  for (const it of text.items as Array<{ str?: string; transform?: number[] }>) {
    const s = (it.str || '').trim();
    if (s && it.transform) items.push({ s, x: it.transform[4], y: it.transform[5] });
  }
  if (items.length < 50) return { cells: [], colors: [] };

  const norm = (s: string) => s.replace(/Ĳ/g, 'IJ').replace(/ĳ/g, 'ij').toUpperCase();
  const monthLabels = items.filter((i) => MONTHS_SL.includes(norm(i.s)));
  const numItems = items
    .filter((i) => /^\d{1,2}$/.test(i.s))
    .map((i) => ({ n: +i.s, x: i.x, y: i.y }));
  // zacentri mrež = pozicije oznake "Po" (ponedeljek) — 12 mesecev
  const poAnchors = items.filter((i) => i.s === 'Po').sort((a, b) => b.y - a.y || a.x - b.x);
  if (poAnchors.length < 6 || numItems.length < 100) return { cells: [], colors: [] };

  const rects = collectColoredRects(opList);
  const colors = Array.from(new Set(rects.map((r) => r.c)));
  const cells: RawCell[] = [];

  for (const anchor of poAnchors) {
    const gridNums = numItems.filter((n) => n.x >= anchor.x - 8 && n.x <= anchor.x + 135 && n.y < anchor.y + 4 && n.y > anchor.y - 140);
    if (gridNums.length < 20) continue;
    // mesec za mrežo
    let month = -1;
    let best = 1e9;
    for (const m of monthLabels) {
      if (m.x >= anchor.x - 10 && m.x <= anchor.x + 170) {
        const d = Math.abs(m.y - anchor.y);
        if (d < best) { best = d; month = MONTHS_SL.indexOf(norm(m.s)) + 1; }
      }
    }
    if (month < 1) continue;
    // stolpci: 7 enakomernih stolpcev od min do max x
    const minX = Math.min(...gridNums.map((n) => n.x));
    const maxX = Math.max(...gridNums.map((n) => n.x));
    const cellW = (maxX - minX) / 6 || 18;
    const colOf = (x: number) => Math.max(0, Math.min(6, Math.round((x - minX) / cellW)));
    for (const n of gridNums) {
      const c = colOf(n.x);
      const cellBox = { x0: n.x - 5, x1: n.x + cellW - 5, y0: n.y - 3, y1: n.y + 11 };
      // poišči barvni pravokotnik, ki seka celico
      let hit: Rect | null = null;
      for (const r of rects) {
        if (r.x0 - 1 < cellBox.x1 && r.x1 + 1 > cellBox.x0 && r.y0 - 1 < cellBox.y1 && r.y1 + 1 > cellBox.y0) {
          if (!hit || (r.x1 - r.x0) * (r.y1 - r.y0) < (hit.x1 - hit.x0) * (hit.y1 - hit.y0)) hit = r;
        }
      }
      if (hit) {
        cells.push({ month, day: n.n, weekRow: 0, col: c, colorHex: hit.c });
      }
    }
  }
  // weekRow izračunamo kasneje (ko je znan year); sedaj 0
  return { cells, colors };
}

/* ------------------------------------------------------------------ */
/* RASTERSKA pot                                                       */
/* ------------------------------------------------------------------ */

type CanvasFactoryLike = { createCanvas: (w: number, h: number) => unknown };

async function renderRasterBins(page: pdfjs.PDFPageProxy) {
  // Dinamičen uvoz, da @napi-rs/canvas ni obvezen v spletnem paketu (le strežnik)
  const { createCanvas } = (await import('@napi-rs/canvas')) as unknown as { createCanvas: (w: number, h: number) => { width: number; height: number; getContext: (t: '2d') => CanvasRenderingContext2D; toBuffer: (m: string) => Buffer } };
  const scale = 2;
  const viewport = page.getViewport({ scale });
  const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height)) as unknown as {
    width: number; height: number;
    getContext: (t: '2d') => CanvasRenderingContext2D;
  };
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  // pdf.js v5: render() kličemo kot metodo na strani (zaradi `this` vezave)
  const task = page.render({ canvasContext: ctx, viewport } as unknown as Parameters<pdfjs.PDFPageProxy['render']>[0]);
  await task.promise;
  const W = canvas.width;
  const H = canvas.height;
  const img = ctx.getImageData(0, 0, W, H).data;
  const cls = (r: number, g: number, b: number): 0 | 1 | 2 => {
    if (g > 140 && g < 200 && r > 30 && r < 130 && b > 30 && b < 130 && g - r > 40 && g - b > 40) return 1; // zelena
    if (r > 218 && g > 198 && b < 140 && g - b > 80 && Math.abs(r - g) < 55) return 2; // rumena
    return 0;
  };
  const BS = 2;
  const BW = Math.ceil(W / BS);
  const BH = Math.ceil(H / BS);
  const bins = new Uint8Array(BW * BH);
  for (let by = 0; by < BH; by++) {
    for (let bx = 0; bx < BW; bx++) {
      let g = 0, y = 0, n = 0;
      for (let yy = by * BS; yy < by * BS + BS; yy += 1) {
        for (let xx = bx * BS; xx < bx * BS + BS; xx += 1) {
          const i = (yy * W + xx) * 4;
          const c = cls(img[i], img[i + 1], img[i + 2]);
          if (c === 1) g++;
          else if (c === 2) y++;
          n++;
        }
      }
      bins[by * BW + bx] = g >= n - 1 ? 1 : y >= n - 1 ? 2 : 0;
    }
  }
  return { bins, BW, BH, BS };
}

function clusters1D(idxs: number[], gap: number): [number, number][] {
  const out: [number, number][] = [];
  let s: number | null = null;
  let p: number | null = null;
  for (const i of idxs) {
    if (s === null) { s = i; p = i; }
    else if (p !== null && i - p <= gap) p = i;
    else { out.push([s, p as number]); s = i; p = i; }
  }
  if (s !== null) out.push([s, p as number]);
  return out;
}

async function parseRaster(page: pdfjs.PDFPageProxy, yearGuess: number): Promise<{ cells: RawCell[]; colors: string[] }> {
  const { bins, BW, BH, BS } = await renderRasterBins(page);
  const yp = new Uint32Array(BH);
  for (let by = 0; by < BH; by++) {
    let c = 0;
    for (let bx = 0; bx < BW; bx++) if (bins[by * BW + bx]) c++;
    yp[by] = c;
  }
  const yIdx: number[] = [];
  for (let i = 0; i < BH; i++) if (yp[i] >= 70) yIdx.push(i);
  const ybands = clusters1D(yIdx, 6).filter((b) => b[1] - b[0] >= 40).slice(0, 3);
  // Pasove razširi: robne tedenske vrstice kartonov imajo manj obarvanega
  // območja (različno število vrstic na karton), zato jih splošni prag odreže.
  for (const band of ybands) {
    let [y0, y1] = band;
    const region = (a: number, b: number) => {
      let m = 0;
      for (let i = Math.max(0, a); i <= Math.min(BH - 1, b); i++) m = Math.max(m, yp[i]);
      return m;
    };
    while (y1 + 5 < BH && region(y1 + 1, y1 + 10) > 8) y1 += 2;
    while (y0 - 5 > 0 && region(y0 - 10, y0 - 1) > 8) y0 -= 2;
    band[0] = y0;
    band[1] = y1;
  }
  if (ybands.length < 2) return { cells: [], colors: [] };

  const cells: RawCell[] = [];
  const colorsFound = new Set<string>();
  for (let ri = 0; ri < ybands.length; ri++) {
    const [by0, by1] = ybands[ri];
    const xp = new Uint32Array(BW);
    for (let by = by0; by <= by1; by++) {
      for (let bx = 0; bx < BW; bx++) if (bins[by * BW + bx]) xp[bx]++;
    }
      const xIdx: number[] = [];
      for (let i = 0; i < BW; i++) if (xp[i] >= (by1 - by0) * 0.22) xIdx.push(i);
      const xc = clusters1D(xIdx, 4).filter((c) => c[1] - c[0] >= 16);
    const cards: [number, number][] = [];
    for (const c of xc) {
      const last = cards[cards.length - 1];
      if (last && c[0] - last[1] <= 7) last[1] = c[1];
      else cards.push([...c] as [number, number]);
    }
    const pitch = cards.length >= 2 ? (cards[Math.min(3, cards.length - 1)][0] - cards[0][0]) / Math.min(3, cards.length - 1) : 0;
    for (let ci = 0; ci < Math.min(4, cards.length); ci++) {
      const [cx0, cx1] = cards[ci];
      const month = ri * 4 + ci + 1;
      const x0px = cx0 * BS;
      const x1px = (cx1 + 1) * BS;
      // ocena števila združenih stolpcev in širine celice
      const pitchCell = pitch > 0 ? (pitch * BS) / 7 : (x1px - x0px) / 3;
      const nCols = Math.max(3, Math.min(4, Math.round((x1px - x0px) / pitchCell)));
      const cellW = (x1px - x0px) / nCols;
      // tedenske vrstice
      const wp = new Uint32Array(BH);
      for (let by = by0; by <= by1; by++) {
        let c = 0;
        for (let bx = cx0; bx <= cx1; bx++) if (bins[by * BW + bx]) c++;
        wp[by] = c;
      }
      // Adaptivna meja: celice se med tedni skoraj dotikajo, zato mejo
      // računamo relativno na maksimum profila in dolge segmente delimo
      // v lokalnih minimih.
      const maxWp = Math.max(...Array.from(wp)) || 1;
      const weekLenEst = cellW / BS; // celice so približno kvadratne
      function splitDeep(r0: number, r1: number, depth: number): [number, number][] {
        if (r1 - r0 <= weekLenEst * 1.45 || depth > 6) return [[r0, r1]];
        const m = Math.max(2, Math.round(weekLenEst * 0.35));
        let minV = Infinity;
        let minI = -1;
        for (let i = r0 + m; i < r1 - m; i++) {
          if (wp[i] < minV) { minV = wp[i]; minI = i; }
        }
        if (minI < 0) return [[r0, r1]];
        if (minV > maxWp * 0.75) return [[r0, r1]];
        return [...splitDeep(r0, minI, depth + 1), ...splitDeep(minI + 1, r1, depth + 1)];
      }
      let weeks: [number, number][] = [];
      for (const t of [0.45, 0.35, 0.28, 0.2]) {
        const thr = Math.max(3, maxWp * t);
        const wIdx: number[] = [];
        for (let i = by0; i <= by1; i++) if (wp[i] >= thr) wIdx.push(i);
        const runs = clusters1D(wIdx, 4)
          .filter((w) => w[1] - w[0] >= weekLenEst * 0.4)
          .flatMap(([a, b]) => splitDeep(a, b, 0))
          .filter((w) => w[1] - w[0] >= weekLenEst * 0.4)
          .sort((a, b) => a[0] - b[0]);
        weeks = runs;
        if (runs.length >= 4 && runs.length <= 6) break;
      }
      if (weeks.length > 6) weeks = weeks.slice(0, 6);
      const mergedWeeks = weeks;
      if (process.env.PDF_DEBUG) {
        console.error(`[raster] mesec ${month}: karton x[${cx0},${cx1}] cellW=${cellW.toFixed(1)}px maxWp=${maxWp} tedni=${mergedWeeks.map((w) => `${w[0]}-${w[1]}`).join(',')}`);
      }
      // 1) Vzorči barvo vsake (teden, stolpec) celice
      const sampled: (0 | 1 | 2)[][] = [];
      for (const [wy0, wy1] of mergedWeeks) {
        const rowSamples: (0 | 1 | 2)[] = [];
        for (let c = 0; c <= 3; c++) {
          const sx0 = x0px + c * cellW;
          const sx1 = x0px + (c + 1) * cellW;
          const bxA = Math.max(cx0, Math.round((sx0 + cellW * 0.2) / BS));
          const bxB = Math.min(BW - 1, Math.round((sx1 - cellW * 0.2) / BS));
          const byA = Math.max(by0, wy0 + 1);
          const byB = Math.min(by1, wy1 - 1);
          let g = 0, y = 0;
          for (let by = byA; by <= byB; by++) {
            for (let bx = bxA; bx <= bxB; bx++) {
              const v = bins[by * BW + bx];
              if (v === 1) g++;
              else if (v === 2) y++;
            }
          }
          rowSamples.push(g > y * 2 && g >= 3 ? 1 : y > g * 2 && y >= 3 ? 2 : 0);
        }
        sampled.push(rowSamples);
      }
      // 2) Poravnava z detektiranimi tedni na dejanske koledarske vrstice.
      //    Predvidene vrstice = tiste, ki vsebujejo vsaj en dan (Po-Če) v mesecu.
      const off = monthOffsetMonday(month, yearGuess);
      const dim = daysInMonth(month, yearGuess);
      const predicted: number[] = [];
      for (let w = 0; w <= 5; w++) {
        let has = false;
        for (let c = 0; c <= 3; c++) {
          const day = w * 7 + c - off + 1;
          if (day >= 1 && day <= dim) has = true;
        }
        if (has) predicted.push(w);
      }
      if (process.env.PDF_DEBUG) {
        console.error(`[align] mesec ${month}: off=${off} dim=${dim} predicted=[${predicted.join(',')}] sampled=${sampled.map((s) => s.join('')).join(',')}`);
      }
      let bestO = 0;
      let bestScore = -1;
      const slack = predicted.length - sampled.length;
      for (let o = 0; o <= Math.max(0, slack); o++) {
        let score = 0;
        for (let i = 0; i < sampled.length; i++) {
          const w = predicted[i + o];
          if (w === undefined) continue;
          for (let c = 0; c <= 3; c++) {
            if (!sampled[i][c]) continue;
            const day = w * 7 + c - off + 1;
            if (day >= 1 && day <= dim) score++;
          }
        }
        if (score > bestScore) { bestScore = score; bestO = o; }
      }
      for (let i = 0; i < sampled.length; i++) {
        const w = predicted[i + bestO];
        if (w === undefined) continue;
        for (let c = 0; c <= 3; c++) {
          const v = sampled[i][c];
          if (!v) continue;
          const day = w * 7 + c - off + 1;
          if (day < 1 || day > dim) continue;
          const hex = v === 1 ? '#3ca849' : '#efc01a';
          colorsFound.add(hex);
          cells.push({ month, day, weekRow: w, col: c, colorHex: hex });
        }
      }
    }
  }
  return { cells, colors: Array.from(colorsFound) };
}

/* ------------------------------------------------------------------ */
/* Glavna funkcija                                                     */
/* ------------------------------------------------------------------ */

export async function parseCalendarPdf(data: Uint8Array, yearHint?: number | null): Promise<ParsedCalendar> {
  const loadingTask = pdfjs.getDocument({ data, verbosity: 0 }) as unknown as {
    promise: Promise<pdfjs.PDFDocumentProxy>;
    destroy: () => Promise<void>;
  };
  const doc = await loadingTask.promise;
  try {
    const page = await doc.getPage(1);
    const opList = await page.getOperatorList();
    const vec = await parseVector(page, opList);
    let result: ParsedCalendar;
    if (vec.cells.length >= 20) {
      result = { method: 'vector', yearDetected: null, cells: vec.cells, colors: vec.colors, pages: doc.numPages };
      try {
        const t = await page.getTextContent();
        const full = (t.items as Array<{ str?: string }>).map((i) => i.str || '').join(' ');
        const m = full.match(/\b(20[2-5][0-9])\b/);
        if (m) result.yearDetected = parseInt(m[1], 10);
      } catch {
        /* ni besedila */
      }
      const year = result.yearDetected || yearHint || new Date().getFullYear();
      for (const c of result.cells) {
        const off = monthOffsetMonday(c.month, year);
        c.weekRow = Math.floor((c.day + off - 1) / 7);
      }
    } else {
      const year = yearHint || new Date().getFullYear();
      const ras = await parseRaster(page, year);
      result = { method: 'raster', yearDetected: year, cells: ras.cells, colors: ras.colors, pages: doc.numPages };
    }
    return result;
  } finally {
    await loadingTask.destroy().catch(() => undefined);
  }
}

/* ------------------------------------------------------------------ */
/* Pretvorba v urnik za vas (ponedeljek + prestavljeni odvozi)         */
/* ------------------------------------------------------------------ */

export type ScheduleEvent = { date: string; types: string[]; note: string | null };

const pad = (n: number) => String(n).padStart(2, '0');

/**
 * Iz "surovih" celic zgradi urnik za vas, kjer je odvoz ob ponedeljkih.
 * Če ponedeljek ni obarvan, a je obarvan torek/sreda istega tedna (praznik),
 * dogodek prestavi na prvi obarvan dan z opombo.
 */
export function buildSchedule(
  cells: RawCell[],
  year: number,
  colorMap: Record<string, string>, // colorHex -> tip odpadka
): ScheduleEvent[] {
  const events = new Map<string, ScheduleEvent>();
  // Grupiraj po koledarskem tednu (ponedeljek–nedelja), ne glede na mesec.
  const byWeek = new Map<string, RawCell[]>();
  for (const c of cells) {
    if (c.day < 1 || c.day > daysInMonth(c.month, year)) continue;
    const d = new Date(Date.UTC(year, c.month - 1, c.day));
    const weekday = (d.getUTCDay() + 6) % 7; // 0=ponedeljek
    const monday = new Date(d);
    monday.setUTCDate(d.getUTCDate() - weekday);
    const key = monday.toISOString().slice(0, 10);
    if (!byWeek.has(key)) byWeek.set(key, []);
    byWeek.get(key)!.push({ ...c, col: weekday });
  }
  for (const list of byWeek.values()) {
    list.sort((a, b) => a.col - b.col);
    const monday = list.find((c) => c.col === 0);
    if (monday) {
      const date = `${year}-${pad(monday.month)}-${pad(monday.day)}`;
      addEvent(events, date, colorMap[monday.colorHex], null);
    } else {
      // prestavljen odvoz (praznik v ponedeljek) – vzemi prvi obarvan dan v tednu
      const first = list[0];
      const date = `${year}-${pad(first.month)}-${pad(first.day)}`;
      addEvent(events, date, colorMap[first.colorHex], 'Prestavljen odvoz (praznik)');
    }
  }
  return Array.from(events.values()).sort((a, b) => (a.date < b.date ? -1 : 1));
}

function addEvent(events: Map<string, ScheduleEvent>, date: string, type: string | undefined, note: string | null) {
  if (!type) return;
  const cur = events.get(date);
  if (cur) {
    if (!cur.types.includes(type)) cur.types.push(type);
    if (note && !cur.note) cur.note = note;
  } else {
    events.set(date, { date, types: [type], note });
  }
}
