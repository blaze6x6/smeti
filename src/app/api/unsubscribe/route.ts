export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { unsubscribeByToken } from '@/lib/data';
import { htmlResponse, messagePage } from '@/lib/pages';

/** GET samo pokaže potrditev (skenerji e-pošte povezav ne smejo sprožiti odjave). */
export async function GET(req: NextRequest) {
  const t = req.nextUrl.searchParams.get('t') || '';
  if (!t) return htmlResponse(messagePage({ title: 'Neveljavna povezava', text: 'Povezava za odjavo ni veljavna.' }), 400);
  return htmlResponse(
    messagePage({
      title: 'Odjava od obvestil',
      text: 'Klikni gumb, da se odjaviš od e-poštnih obvestil o odvozu odpadkov.',
      form: { action: `/api/unsubscribe?t=${encodeURIComponent(t)}`, button: 'Odjavi me' },
    }),
  );
}

/** POST: odjava s strani ali »List-Unsubscribe-Post« (RFC 8058) iz poštnega odjemalca. */
export async function POST(req: NextRequest) {
  const t = req.nextUrl.searchParams.get('t') || '';
  const ok = t ? await unsubscribeByToken(t) : false;
  return htmlResponse(
    messagePage({
      title: ok ? 'Odjava uspešna' : 'Neveljavna povezava',
      text: ok ? 'Od obvestil o odvozu odpadkov si odjavljen/a.' : 'Povezava za odjavo ni veljavna ali je že potekla.',
    }),
    ok ? 200 : 400,
  );
}
