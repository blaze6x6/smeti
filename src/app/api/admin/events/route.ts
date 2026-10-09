export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { and, eq, inArray, ne, sql } from 'drizzle-orm';
import { db } from '@/db';
import { schedules } from '@/db/schema';
import { getEventsForYear, logImport } from '@/lib/data';
import { DEFAULT_VILLAGE, getVillage } from '@/lib/villages';
import { buildAllVillageRows } from '@/db/seed-lib';

/** GET ?leto=&kraj= → dogodki za leto in kraj */
export async function GET(req: NextRequest) {
  const year = parseInt(req.nextUrl.searchParams.get('leto') || '', 10);
  const village = getVillage(req.nextUrl.searchParams.get('kraj') || DEFAULT_VILLAGE);
  if (!year) return NextResponse.json({ ok: false, error: 'Manjka leto.' }, { status: 400 });
  const events = await getEventsForYear(year, village.id);
  return NextResponse.json({ ok: true, events, village: village.id });
}

type Cell = { date: string; col: number; type: string };
const ALLOWED_TYPES = new Set(['mesani', 'embalaza']);

/**
 * POST { year, cells, replace, method, filename }
 * Iz surovih celic koledarja ustvari urnik za VSE kraje v občini.
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      year?: number;
      cells?: Cell[];
      replace?: boolean;
      method?: string;
      filename?: string | null;
    };
    const year = body.year;
    if (!year || !Array.isArray(body.cells)) {
      return NextResponse.json({ ok: false, error: 'Neveljavni podatki (manjkajo celice koledarja).' }, { status: 400 });
    }
    const cells = body.cells.filter(
      (c) =>
        /^\d{4}-\d{2}-\d{2}$/.test(c.date) &&
        typeof c.col === 'number' &&
        c.col >= 0 &&
        c.col <= 6 &&
        ALLOWED_TYPES.has(c.type),
    );
    if (!cells.length) {
      return NextResponse.json({ ok: false, error: 'Ni veljavnih celic za shranjevanje.' }, { status: 400 });
    }

    const rows = buildAllVillageRows(year, cells).map((r) => ({ ...r, source: body.method || 'manual' }));
    // vse ali nič: izbris starega leta in vnos novega sta v isti transakciji
    await db.transaction(async (tx) => {
      if (body.replace) {
        await tx.delete(schedules).where(eq(schedules.year, year));
      }
      for (let i = 0; i < rows.length; i += 200) {
        await tx
          .insert(schedules)
          .values(rows.slice(i, i + 200))
          .onConflictDoUpdate({
            target: [schedules.date, schedules.village],
            // ročno popravljenih dogodkov ponovni uvoz ne povozi
            setWhere: sql`${schedules.source} <> 'manual'`,
            set: {
              types: sql`excluded.types`,
              note: sql`excluded.note`,
              year: sql`excluded.year`,
              source: sql`excluded.source`,
            },
          });
      }
    });
    await logImport({
      year,
      filename: body.filename ?? null,
      method: body.method || 'manual',
      eventsCount: rows.length,
    });
    return NextResponse.json({ ok: true, saved: rows.length, villages: new Set(rows.map((r) => r.village)).size });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, error: 'Napaka pri shranjevanju.' }, { status: 500 });
  }
}

function validDate(s: unknown): s is string {
  if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const [y, m, d] = s.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

function cleanTypes(t: unknown): string[] | null {
  if (!Array.isArray(t)) return null;
  const out = Array.from(new Set(t.filter((x): x is string => typeof x === 'string' && ALLOWED_TYPES.has(x))));
  return out.length ? out : null;
}

/**
 * PUT { id, date, types, note, alsoSame }
 * Popravi en dogodek. Z `alsoSame` enako spremembo uveljavi še v drugih krajih, ki imajo
 * na isti (stari) datum enak odvoz — tako se zamik cele relacije popravi z enim klikom.
 */
export async function PUT(req: NextRequest) {
  try {
    const body = (await req.json()) as { id?: number; date?: string; types?: string[]; note?: string | null; alsoSame?: boolean };
    const types = cleanTypes(body.types);
    if (!body.id || !validDate(body.date) || !types) {
      return NextResponse.json({ ok: false, error: 'Neveljavni podatki (datum ali frakcija).' }, { status: 400 });
    }
    const date = body.date;
    const note = body.note?.trim() ? body.note.trim().slice(0, 200) : null;
    const year = Number(date.slice(0, 4));

    const result = await db.transaction(async (tx) => {
      const [row] = await tx.select().from(schedules).where(eq(schedules.id, body.id!)).limit(1);
      if (!row) return { status: 404 as const };
      const clash = await tx
        .select({ id: schedules.id })
        .from(schedules)
        .where(and(eq(schedules.village, row.village), eq(schedules.date, date), ne(schedules.id, row.id)))
        .limit(1);
      if (clash.length) return { status: 409 as const };

      const ids = [row.id];
      if (body.alsoSame) {
        const sameKey = row.types.slice().sort().join(',');
        const others = await tx
          .select()
          .from(schedules)
          .where(and(eq(schedules.date, row.date), ne(schedules.id, row.id)));
        for (const o of others) {
          if (o.types.slice().sort().join(',') !== sameKey) continue;
          const c = await tx
            .select({ id: schedules.id })
            .from(schedules)
            .where(and(eq(schedules.village, o.village), eq(schedules.date, date)))
            .limit(1);
          if (!c.length) ids.push(o.id);
        }
      }
      await tx.update(schedules).set({ date, types, note, year, source: 'manual' }).where(inArray(schedules.id, ids));
      return { status: 200 as const, changed: ids.length };
    });

    if (result.status === 404) return NextResponse.json({ ok: false, error: 'Dogodek ne obstaja.' }, { status: 404 });
    if (result.status === 409) {
      return NextResponse.json({ ok: false, error: 'V tem kraju na ta datum že obstaja drug dogodek.' }, { status: 409 });
    }
    return NextResponse.json({ ok: true, changed: result.changed });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, error: 'Napaka pri shranjevanju.' }, { status: 500 });
  }
}

/** DELETE ?id= ali ?leto= (izbriše vse kraje za leto) */
export async function DELETE(req: NextRequest) {
  const id = parseInt(req.nextUrl.searchParams.get('id') || '', 10);
  const year = parseInt(req.nextUrl.searchParams.get('leto') || '', 10);
  const kraj = req.nextUrl.searchParams.get('kraj');
  if (id) {
    await db.delete(schedules).where(eq(schedules.id, id));
    return NextResponse.json({ ok: true });
  }
  if (year) {
    await db
      .delete(schedules)
      .where(kraj ? and(eq(schedules.year, year), eq(schedules.village, kraj)) : eq(schedules.year, year));
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ ok: false, error: 'Manjka id ali leto.' }, { status: 400 });
}
