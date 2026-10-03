import { sql } from 'drizzle-orm';
import { db } from '@/db';
import { schedules } from '@/db/schema';
import { setSetting } from '@/lib/data';
import { SEED_CELLS } from '@/db/seed-data';
import { VILLAGES, buildVillageSchedule } from '@/lib/villages';

/** Iz surovih celic koledarja pripravi vrstice urnika za vse kraje. */
export function buildAllVillageRows(year: number, cells: { date: string; col: number; type: string }[]) {
  const rows: { date: string; types: string[]; note: string | null; year: number; village: string }[] = [];
  for (const v of VILLAGES) {
    for (const e of buildVillageSchedule(cells, v)) {
      rows.push({ date: e.date, types: e.types, note: e.note, year, village: v.id });
    }
  }
  return rows;
}

/** Idempotenten seed: napolni urnik vseh krajev iz uradnih podatkov, če je prazen. */
export async function seedDatabaseIfEmpty(): Promise<{ seeded: boolean; events: number }> {
  const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(schedules);
  if (count > 0) return { seeded: false, events: count };
  let n = 0;
  for (const { year, cells } of SEED_CELLS) {
    const rows = buildAllVillageRows(year, cells);
    for (let i = 0; i < rows.length; i += 200) {
      const chunk = rows.slice(i, i + 200).map((r) => ({ ...r, source: 'seed' }));
      await db.insert(schedules).values(chunk).onConflictDoNothing();
      n += chunk.length;
    }
  }
  await setSetting('notify.enabled', 'true');
  await setSetting('notify.time', '18:00');
  await setSetting('notify.daysBefore', '1');
  return { seeded: true, events: n };
}
