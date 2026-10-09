export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { checkAndSendReminders } from '@/lib/notifications';
import { secretsEqual } from '@/lib/http';

/**
 * Zunanji cron klic (rezerva za vgrajeni razporejevalnik):
 *   curl -H "x-cron-secret: $CRON_SECRET" https://.../api/cron/daily
 *
 * Brez nastavljenega CRON_SECRET je endpoint izklopljen (503) — nihče ne more
 * od zunaj sprožiti pošiljanja. Ključ se sprejme samo v glavi, ne v URL-ju
 * (URL-ji se zapisujejo v dnevnike proxyjev).
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { ok: false, error: 'Zunanji cron je izklopljen (CRON_SECRET ni nastavljen).' },
      { status: 503 },
    );
  }
  const got = req.headers.get('x-cron-secret') || '';
  if (!secretsEqual(got, secret)) {
    return NextResponse.json({ ok: false, error: 'Neveljaven ključ.' }, { status: 401 });
  }
  const force = req.nextUrl.searchParams.get('force') === '1';
  const result = await checkAndSendReminders(force);
  return NextResponse.json({ ok: true, result });
}

export const POST = GET;
