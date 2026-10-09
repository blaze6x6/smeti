import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_COOKIE, adminOpenAllowed, authEnabled, verifySessionValue } from '@/lib/auth';

/** Zaščiti zaledje in njegove API poti, če je ADMIN_PASSWORD nastavljen. */
export async function middleware(req: NextRequest) {
  if (!authEnabled()) {
    if (adminOpenAllowed()) return NextResponse.next();
    // produkcija brez ADMIN_PASSWORD: zaledje je zaklenjeno, dokler geslo ni nastavljeno
    const msg =
      'Zaledje je zaklenjeno: nastavi ADMIN_PASSWORD v okolju (ali izrecno ALLOW_OPEN_ADMIN=true za odprto zaledje).';
    if (req.nextUrl.pathname.startsWith('/api/')) {
      return NextResponse.json({ ok: false, error: msg }, { status: 503 });
    }
    return new NextResponse(msg, { status: 503, headers: { 'content-type': 'text/plain; charset=utf-8' } });
  }

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
