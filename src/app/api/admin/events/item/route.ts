export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { schedules } from '@/db/schema';
import { VILLAGES } from '@/lib/villages';

const ALLOWED = new Set(['mesani', 'embalaza']);

/** POST { village, date, types, note } → doda en dogodek v izbrani kraj (ročni vnos). */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { village?: string; date?: string; types?: string[]; note?: string | null };
    const types = Array.from(new Set((body.types ?? []).filter((t) => ALLOWED.has(t))));
    const date = body.date ?? '';
    const [y, m, d] = date.split('-').map(Number);
    const dt = new Date(Date.UTC(y, (m || 1) - 1, d || 1));
    const validDate = /^\d{4}-\d{2}-\d{2}$/.test(date) && dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
    if (!VILLAGES.some((v) => v.id === body.village) || !validDate || !types.length) {
      return NextResponse.json({ ok: false, error: 'Neveljavni podatki (kraj, datum ali frakcija).' }, { status: 400 });
    }
    const note = body.note?.trim() ? body.note.trim().slice(0, 200) : null;
    const inserted = await db
      .insert(schedules)
      .values({ date, types, note, year: y, village: body.village!, source: 'manual' })
      .onConflictDoNothing()
      .returning({ id: schedules.id });
    if (!inserted.length) {
      return NextResponse.json({ ok: false, error: 'V tem kraju na ta datum že obstaja dogodek — uredi ga na seznamu.' }, { status: 409 });
    }
    return NextResponse.json({ ok: true, id: inserted[0].id });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, error: 'Napaka pri shranjevanju.' }, { status: 500 });
  }
}
