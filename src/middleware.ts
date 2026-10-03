import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_COOKIE, authEnabled, verifySessionValue } from '@/lib/auth';

/** Zaščiti zaledje in njegove API poti, če je ADMIN_PASSWORD nastavljen. */
export async function middleware(req: NextRequest) {
  if (!authEnabled()) return NextResponse.next();

  const { pathname, search } = req.nextUrl;
  // prijavna stran in njena API pot morata ostati dostopni
  if (pathname.startsWith('/admin/prijava') || pathname.startsWith('/api/admin/auth')) {
    return NextResponse.next();
  }

  const ok = await verifySessionValue(req.cookies.get(ADMIN_COOKIE)?.value);
  if (ok) return NextResponse.next();

  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ ok: false, error: 'Potrebna je prijava v zaledje.' }, { status: 401 });
  }

  const url = req.nextUrl.clone();
  url.pathname = '/admin/prijava';
  url.search = `?nazaj=${encodeURIComponent(pathname + search)}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
