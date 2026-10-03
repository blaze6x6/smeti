export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { unsubscribeByToken } from '@/lib/data';

export async function GET(req: NextRequest) {
  const t = req.nextUrl.searchParams.get('t') || '';
  const ok = t ? await unsubscribeByToken(t) : false;
  const html = `<!doctype html><html lang="sl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Odjava — Koledar odvoza Smokuč</title>
  <style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#faf7ef;color:#12281d;font-family:system-ui,Arial}
  .k{background:#fff;border:1px solid #eae2cb;border-radius:20px;padding:36px;max-width:420px;text-align:center}
  a{color:#6f9a0f}</style></head><body><div class="k">
  <h1>${ok ? 'Odjava uspešna' : 'Neveljavna povezava'}</h1>
  <p>${ok ? 'Od obvestil o odvozu odpadkov si odjavljen/a.' : 'Povezava za odjavo ni veljavna ali je že potekla.'}</p>
  <p><a href="/">← Nazaj na koledar</a></p></div></body></html>`;
  return new NextResponse(html, { headers: { 'content-type': 'text/html; charset=utf-8' } });
}
