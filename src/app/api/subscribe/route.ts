export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { requestSubscription } from '@/lib/data';
import { baseUrl, clientIp } from '@/lib/http';
import { rateLimit } from '@/lib/ratelimit';
import { sendConfirmMail, smtpConfigured } from '@/lib/mailer';
import { DEFAULT_VILLAGE, VILLAGES, villageName } from '@/lib/villages';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function POST(req: NextRequest) {
  try {
    const ip = clientIp(req);
    if (!rateLimit(`sub-ip:${ip}`, 8, 60 * 60_000).ok) {
      return NextResponse.json({ ok: false, error: 'Preveč prijav. Poskusi znova čez nekaj časa.' }, { status: 429 });
    }
    const body = (await req.json()) as { email?: string; village?: string };
    const email = (body.email || '').trim().toLowerCase();
    if (email.length > 254 || !EMAIL_RE.test(email)) {
      return NextResponse.json({ ok: false, error: 'Vnesi veljaven e-poštni naslov.' }, { status: 400 });
    }
    const village = VILLAGES.some((v) => v.id === body.village) ? (body.village as string) : DEFAULT_VILLAGE;
    if (!smtpConfigured()) {
      return NextResponse.json(
        { ok: false, error: 'E-poštna obvestila trenutno niso na voljo (SMTP ni nastavljen).' },
        { status: 503 },
      );
    }
    // en naslov: največ 3 potrditvena sporočila na uro (zaščita pred zasipanjem tujega predala)
    if (!rateLimit(`sub-email:${email}`, 3, 60 * 60_000).ok) {
      return NextResponse.json({ ok: true, pending: true, village, villageName: villageName(village) });
    }

    const res = await requestSubscription(email, village);
    if (res.alreadySubscribed) {
      // enak odgovor kot pri novi prijavi — ne razkrivamo, kdo je že naročnik
      return NextResponse.json({ ok: true, pending: true, village, villageName: villageName(village) });
    }
    if (res.send && res.token) {
      await sendConfirmMail({
        to: email,
        villageLabel: villageName(village),
        confirmUrl: `${baseUrl(req)}/api/confirm?t=${res.token}`,
      });
    }
    return NextResponse.json({ ok: true, pending: true, village, villageName: villageName(village) });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, error: 'Napaka strežnika.' }, { status: 500 });
  }
}
