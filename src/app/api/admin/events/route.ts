export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
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
      (c) => /^\d{4}-\d{2}-\d{2}$/.test(c.date) && typeof c.col === 'number' && Boolean(c.type),
    );
    if (!cells.length) {
      return NextResponse.json({ ok: false, error: 'Ni veljavnih celic za shranjevanje.' }, { status: 400 });
    }

    if (body.replace) {
      await db.delete(schedules).where(eq(schedules.year, year));
    }
    const rows = buildAllVillageRows(year, cells).map((r) => ({ ...r, source: body.method || 'manual' }));
    for (let i = 0; i < rows.length; i += 200) {
      await db.insert(schedules).values(rows.slice(i, i + 200)).onConflictDoNothing();
    }
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
