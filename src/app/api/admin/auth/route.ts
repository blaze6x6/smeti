export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_COOKIE, SESSION_MAX_AGE, authEnabled, checkPassword, createSessionValue, verifySessionValue } from '@/lib/auth';
import { clientIp, isHttps } from '@/lib/http';
import { rateLimit } from '@/lib/ratelimit';

/** Stanje prijave (ali je zaščita vklopljena in ali je uporabnik prijavljen). */
export async function GET(req: NextRequest) {
  const enabled = authEnabled();
  const signedIn = enabled ? await verifySessionValue(req.cookies.get(ADMIN_COOKIE)?.value) : true;
  return NextResponse.json({ ok: true, enabled, signedIn });
}

/** Prijava z geslom iz .env (ADMIN_PASSWORD). */
export async function POST(req: NextRequest) {
  if (!authEnabled()) {
    return NextResponse.json({ ok: true, enabled: false });
  }
  // zaščita pred ugibanjem gesla: 10 poskusov / 15 min na IP
  const ip = clientIp(req);
  const rl = rateLimit(`admin-login:${ip}`, 10, 15 * 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { ok: false, error: `Preveč poskusov. Poskusi znova čez ${Math.ceil(rl.retryAfterSec / 60)} min.` },
      { status: 429, headers: { 'retry-after': String(rl.retryAfterSec) } },
    );
  }

  let password = '';
  try {
    const body = (await req.json()) as { password?: string };
    password = String(body.password ?? '');
  } catch {
    return NextResponse.json({ ok: false, error: 'Neveljavna zahteva.' }, { status: 400 });
  }

  // majhna zakasnitev oteži ugibanje gesla
  await new Promise((r) => setTimeout(r, 350));

  if (!(await checkPassword(password))) {
    return NextResponse.json({ ok: false, error: 'Napačno geslo.' }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, await createSessionValue(), {
    httpOnly: true,
    sameSite: 'lax',
    // Secure le, če je zahteva res prišla prek HTTPS (sicer prijava prek http://LAN-IP ne bi delovala)
    secure: isHttps(req),
    path: '/',
    maxAge: SESSION_MAX_AGE,
  });
  return res;
}

/** Odjava. */
export async function DELETE(req: NextRequest) {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, '', { httpOnly: true, sameSite: 'lax', secure: isHttps(req), path: '/', maxAge: 0 });
  return res;
}
