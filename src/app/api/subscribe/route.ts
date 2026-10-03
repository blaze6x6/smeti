export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { addSubscriber } from '@/lib/data';
import { DEFAULT_VILLAGE, VILLAGES, villageName } from '@/lib/villages';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { email?: string; village?: string };
    const email = (body.email || '').trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      return NextResponse.json({ ok: false, error: 'Vnesi veljaven e-poštni naslov.' }, { status: 400 });
    }
    const village = VILLAGES.some((v) => v.id === body.village) ? (body.village as string) : DEFAULT_VILLAGE;
    const res = await addSubscriber(email, village);
    return NextResponse.json({
      ok: true,
      existed: res.existed ?? false,
      changed: res.changed ?? false,
      village,
      villageName: villageName(village),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, error: 'Napaka strežnika.' }, { status: 500 });
  }
}
