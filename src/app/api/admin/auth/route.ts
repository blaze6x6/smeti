export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_COOKIE, SESSION_MAX_AGE, authEnabled, checkPassword, createSessionValue, verifySessionValue } from '@/lib/auth';

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
  let password = '';
  try {
    const body = (await req.json()) as { password?: string };
    password = String(body.password ?? '');
  } catch {
    return NextResponse.json({ ok: false, error: 'Neveljavna zahteva.' }, { status: 400 });
  }

  // majhna zakasnitev oteži ugibanje gesla
  await new Promise((r) => setTimeout(r, 350));

  if (!checkPassword(password)) {
    return NextResponse.json({ ok: false, error: 'Napačno geslo.' }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, await createSessionValue(), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  });
  return res;
}

/** Odjava. */
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 });
  return res;
}
