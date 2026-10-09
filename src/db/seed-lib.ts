import { eq, sql } from 'drizzle-orm';
import { db } from '@/db';
import { schedules, settings as settingsTable } from '@/db/schema';
import { setSetting } from '@/lib/data';
import { SEED_CELLS } from '@/db/seed-data';
import { VILLAGES, buildVillageSchedule } from '@/lib/villages';

/** Iz surovih celic koledarja pripravi vrstice urnika za vse kraje. */
export function buildAllVillageRows(year: number, cells: { date: string; col: number; type: string }[]) {
  const rows: { date: string; types: string[]; note: string | null; year: number; village: string }[] = [];
  for (const v of VILLAGES) {
    for (const e of buildVillageSchedule(cells, v, year)) {
      rows.push({ date: e.date, types: e.types, note: e.note, year, village: v.id });
    }
  }
  return rows;
}

/**
 * Idempotenten seed: za vsako leto iz uradnih podatkov, ki še ni bilo vnešeno (in v bazi nima
 * vrstic), vstavi urnik vseh krajev. Že vnešena leta si zapomni v nastavitvah, zato ročno
 * izbrisano leto ob ponovnem zagonu ne vstane znova, nova leta v posodobitvah pa pridejo same.
 */
export async function seedDatabaseIfEmpty(): Promise<{ seeded: boolean; events: number }> {
  const [{ count: total }] = await db.select({ count: sql<number>`count(*)::int` }).from(schedules);
  const rec = await db.select().from(settingsTable).where(eq(settingsTable.key, 'seed.years')).limit(1);
  // obstoječe namestitve (brez zapisa) štejemo kot že posejane z letom, ki ga imajo v bazi
  let done: number[];
  if (rec.length) {
    done = rec[0].value.split(',').map(Number).filter(Boolean);
  } else if (total > 0) {
    const rows = await db.selectDistinct({ year: schedules.year }).from(schedules);
    done = rows.map((r) => r.year);
  } else {
    done = [];
  }

  let n = 0;
  const seededNow: number[] = [];
  for (const { year, cells } of SEED_CELLS) {
    if (done.includes(year)) continue;
    const rows = buildAllVillageRows(year, cells);
    for (let i = 0; i < rows.length; i += 200) {
      const chunk = rows.slice(i, i + 200).map((r) => ({ ...r, source: 'seed' }));
      await db.insert(schedules).values(chunk).onConflictDoNothing();
      n += chunk.length;
    }
    seededNow.push(year);
  }
  if (total === 0) {
    await setSetting('notify.enabled', 'true');
    await setSetting('notify.time', '18:00');
    await setSetting('notify.daysBefore', '1');
  }
  const all = Array.from(new Set([...done, ...seededNow])).sort();
  if (all.length) await setSetting('seed.years', all.join(','));
  return { seeded: seededNow.length > 0, events: n || total };
}
