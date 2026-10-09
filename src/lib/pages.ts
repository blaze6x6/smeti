import { escapeHtml } from '@/lib/http';

/** Majhna samostojna HTML stran za potrditev / odjavo (brez React odjemalca). */
export function messagePage(opts: { title: string; text: string; form?: { action: string; button: string } }): string {
  const { title, text, form } = opts;
  return `<!doctype html><html lang="sl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${escapeHtml(title)} — Koledar odvoza</title>
  <style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#faf7ef;color:#12281d;font-family:system-ui,Arial}
  .k{background:#fff;border:1px solid #eae2cb;border-radius:20px;padding:36px;max-width:420px;text-align:center}
  a{color:#6f9a0f}button{background:#12281d;color:#fff;border:0;border-radius:999px;padding:14px 28px;font-size:16px;font-weight:600;cursor:pointer}</style></head><body><div class="k">
  <h1>${escapeHtml(title)}</h1>
  <p>${escapeHtml(text)}</p>
  ${form ? `<form method="post" action="${escapeHtml(form.action)}"><button type="submit">${escapeHtml(form.button)}</button></form>` : ''}
  <p><a href="/">← Nazaj na koledar</a></p></div></body></html>`;
}

export function htmlResponse(html: string, status = 200): Response {
  return new Response(html, {
    status,
    headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', 'referrer-policy': 'no-referrer' },
  });
}
