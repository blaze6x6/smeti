export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { sendTestMail } from '@/lib/mailer';
import { deletePushSubs, getAllPushSubs, markPushOk } from '@/lib/data';
import { buildTestPayload, sendPush } from '@/lib/push';
import { villageName } from '@/lib/villages';
import { checkAndSendReminders } from '@/lib/notifications';

/**
 * POST { email, mode: 'test' } → pošlje testno sporočilo
 * POST { mode: 'push' }  → preizkusno push obvestilo vsem registriranim napravam
 * POST { mode: 'remind' }  → takoj sproži pošiljanje obvestila za jutri (če je odvoz)
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { email?: string; mode?: string };
    if (body.mode === 'push') {
      const subs = await getAllPushSubs();
      if (!subs.length) return NextResponse.json({ ok: false, error: 'Ni registriranih naprav za push.' }, { status: 400 });
      const okIds: number[] = [];
      const goneIds: number[] = [];
      let failed = 0;
      for (const s of subs) {
        const r = await sendPush(s, buildTestPayload(villageName(s.village)));
        if (r.ok) okIds.push(s.id);
        else if (r.gone) goneIds.push(s.id);
        else failed++;
      }
      await markPushOk(okIds);
      await deletePushSubs(goneIds);
      return NextResponse.json({ ok: okIds.length > 0, push: { sent: okIds.length, removed: goneIds.length, failed } });
    }
    if (body.mode === 'remind') {
      const res = await checkAndSendReminders(true);
      return NextResponse.json({ ok: res.ranToCompletion && (res.sent ?? 0) > 0, result: res });
    }
    const email = (body.email || '').trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      return NextResponse.json({ ok: false, error: 'Vnesi veljaven e-naslov za test.' }, { status: 400 });
    }
    const res = await sendTestMail(email);
    return NextResponse.json(res.ok ? { ok: true } : { ok: false, error: res.error }, { status: res.ok ? 200 : 500 });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
