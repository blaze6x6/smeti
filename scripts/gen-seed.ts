/**
 * Iz uradnih PDF koledarjev JEKO ustvari src/db/seed-data.ts.
 * Shrani SUROVE obarvane celice (datum + stolpec v tednu + frakcija),
 * iz katerih se ob zagonu izračuna urnik za vsak kraj posebej.
 *
 * Uporaba: npx tsx scripts/gen-seed.ts
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { parseCalendarPdf } from '../src/lib/pdf-import';
import { buildVillageSchedule, VILLAGES, type WeekCell } from '../src/lib/villages';

const COLOR_MAP: Record<string, string> = {
  '#3ca849': 'mesani',
  '#48a848': 'mesani',
  '#efc01a': 'embalaza',
  '#f8e838': 'embalaza',
};

const pad = (n: number) => String(n).padStart(2, '0');

async function main() {
  const out: { year: number; cells: WeekCell[] }[] = [];
  for (const [file, year] of [
    ['/tmp/pdf/koledar-2025.pdf', 2025],
    ['/tmp/pdf/koledar-2026.pdf', 2026],
  ] as const) {
    const parsed = await parseCalendarPdf(new Uint8Array(readFileSync(file)), year);
    const y = parsed.yearDetected ?? year;
    const cells: WeekCell[] = parsed.cells
      .map((c) => ({
        date: `${y}-${pad(c.month)}-${pad(c.day)}`,
        col: c.col,
        type: COLOR_MAP[c.colorHex] ?? '',
      }))
      .filter((c) => c.type)
      .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.col - b.col));
    console.log(`${y}: metoda=${parsed.method} celic=${cells.length}`);
    for (const v of VILLAGES.slice(0, 13)) {
      const ev = buildVillageSchedule(cells, v, y);
      console.log(`   ${v.name.padEnd(26)} ${String(ev.length).padStart(3)} odvozov  prvi: ${ev[0]?.date} (${ev[0]?.types[0]})`);
    }
    out.push({ year: y, cells });
  }

  const body = `// GENERIRANO iz uradnih PDF koledarjev JEKO (scripts/gen-seed.ts) — ne urejaj ročno.
// Surove obarvane celice koledarja; urnik posameznega kraja se izračuna iz njih.
import type { WeekCell } from '@/lib/villages';

export const SEED_CELLS: { year: number; cells: WeekCell[] }[] = ${JSON.stringify(out, null, 1)};
`;
  writeFileSync('src/db/seed-data.ts', body);
  console.log('\nsrc/db/seed-data.ts zapisan');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
