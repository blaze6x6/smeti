export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { confirmByToken } from '@/lib/data';
import { htmlResponse, messagePage } from '@/lib/pages';
import { villageName } from '@/lib/villages';

/** GET samo pokaže gumb (varnostni skenerji e-pošte odpirajo povezave); potrditev je POST. */
export async function GET(req: NextRequest) {
  const t = req.nextUrl.searchParams.get('t') || '';
  if (!t) return htmlResponse(messagePage({ title: 'Neveljavna povezava', text: 'Povezava za potrditev ni veljavna.' }), 400);
  return htmlResponse(
    messagePage({
      title: 'Potrdi prijavo',
      text: 'Klikni gumb, da potrdiš prijavo na e-poštna obvestila o odvozu odpadkov.',
      form: { action: `/api/confirm?t=${encodeURIComponent(t)}`, button: 'Potrdi prijavo' },
    }),
  );
}

export async function POST(req: NextRequest) {
  const t = req.nextUrl.searchParams.get('t') || '';
  const res = t ? await confirmByToken(t) : { ok: false as const };
  if (!res.ok) {
    return htmlResponse(
      messagePage({ title: 'Neveljavna povezava', text: 'Povezava za potrditev ni veljavna ali je že potekla.' }),
      400,
    );
  }
  return htmlResponse(
    messagePage({
      title: 'Prijava potrjena',
      text: `Obvestila za kraj ${villageName(res.village ?? '')} bodo prihajala dan pred vsakim odvozom.`,
    }),
  );
}
