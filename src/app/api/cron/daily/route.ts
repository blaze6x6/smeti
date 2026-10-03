export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { checkAndSendReminders } from '@/lib/notifications';

/**
 * Zunanji cron klic (docker `curl`): /api/cron/daily?secret=...
 * Vgrajeni razporejevalnik (instrumentation) teče samodejno; ta endpoint
 * je rezerva za zunanje urnike (cron of container, healthchecks...).
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const got = req.nextUrl.searchParams.get('secret') || req.headers.get('x-cron-secret') || '';
    if (got !== secret) return NextResponse.json({ ok: false, error: 'Neveljaven ključ.' }, { status: 401 });
  }
  const force = req.nextUrl.searchParams.get('force') === '1';
  const result = await checkAndSendReminders(force);
  return NextResponse.json({ ok: true, result });
}

export const POST = GET;
