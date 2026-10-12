export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getVapid } from '@/lib/push';

/** Javni VAPID ključ, potreben brskalniku za pushManager.subscribe(). */
export async function GET() {
  try {
    const v = await getVapid();
    return NextResponse.json({ ok: true, publicKey: v.publicKey });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, error: 'Push ni na voljo.' }, { status: 500 });
  }
}
