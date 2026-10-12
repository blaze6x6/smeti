export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { removePushByEndpoint, upsertPushSub } from '@/lib/data';
import { clientIp } from '@/lib/http';
import { parseSubscription } from '@/lib/push-core';
import { rateLimit } from '@/lib/ratelimit';
import { DEFAULT_VILLAGE, VILLAGES, villageName } from '@/lib/villages';

export async function POST(req: NextRequest) {
  try {
    if (!rateLimit(`push-sub:${clientIp(req)}`, 30, 60 * 60_000).ok) {
      return NextResponse.json({ ok: false, error: 'Preveč zahtev. Poskusi znova kasneje.' }, { status: 429 });
    }
    const body = (await req.json()) as { subscription?: unknown; village?: string };
    const sub = parseSubscription(body.subscription, process.env.PUSH_ALLOWED_HOSTS);
    if (!sub) return NextResponse.json({ ok: false, error: 'Neveljavna naročnina na obvestila.' }, { status: 400 });
    const village = VILLAGES.some((v) => v.id === body.village) ? (body.village as string) : DEFAULT_VILLAGE;
    await upsertPushSub(sub, village);
    return NextResponse.json({ ok: true, village, villageName: villageName(village) });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, error: 'Napaka strežnika.' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    if (!rateLimit(`push-del:${clientIp(req)}`, 30, 60 * 60_000).ok) {
      return NextResponse.json({ ok: false, error: 'Preveč zahtev.' }, { status: 429 });
    }
    const body = (await req.json()) as { endpoint?: string };
    if (typeof body.endpoint === 'string' && body.endpoint.length < 2048) await removePushByEndpoint(body.endpoint);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: 'Napaka strežnika.' }, { status: 500 });
  }
}
