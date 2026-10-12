export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getPushSubByEndpoint, removePushByEndpoint, markPushOk } from '@/lib/data';
import { clientIp } from '@/lib/http';
import { buildTestPayload, sendPush } from '@/lib/push';
import { rateLimit } from '@/lib/ratelimit';
import { villageName } from '@/lib/villages';

/** Pošlje preizkusno obvestilo na eno (že shranjeno) napravo. */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { endpoint?: string };
    const endpoint = typeof body.endpoint === 'string' ? body.endpoint : '';
    if (!endpoint || endpoint.length > 2048) {
      return NextResponse.json({ ok: false, error: 'Manjka naročnina.' }, { status: 400 });
    }
    if (!rateLimit(`push-test:${clientIp(req)}`, 5, 10 * 60_000).ok) {
      return NextResponse.json({ ok: false, error: 'Preveč preizkusov. Poskusi čez nekaj minut.' }, { status: 429 });
    }
    const sub = await getPushSubByEndpoint(endpoint);
    if (!sub) return NextResponse.json({ ok: false, error: 'Naprava ni naročena.', unsubscribed: true }, { status: 404 });
    const r = await sendPush(sub, buildTestPayload(villageName(sub.village)));
    if (r.ok) {
      await markPushOk([sub.id]);
      return NextResponse.json({ ok: true });
    }
    if (r.gone) await removePushByEndpoint(endpoint);
    return NextResponse.json(
      { ok: false, error: r.gone ? 'Naročnina je potekla — naroči se znova.' : 'Pošiljanje ni uspelo.', unsubscribed: Boolean(r.gone) },
      { status: 502 },
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, error: 'Napaka strežnika.' }, { status: 500 });
  }
}
