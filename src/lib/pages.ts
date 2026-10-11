import { escapeHtml } from '@/lib/http';
import { DEFAULT_DARK_THEME, DEFAULT_THEME, THEMES, THEME_STORAGE_KEY } from '@/lib/themes';

const THEME_BOOT = `(function(){try{var ids=${JSON.stringify(THEMES.map((t) => t.id))};var t=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)})||${JSON.stringify(DEFAULT_THEME)};if(t==='auto'){t=matchMedia('(prefers-color-scheme: dark)').matches?${JSON.stringify(DEFAULT_DARK_THEME)}:${JSON.stringify(DEFAULT_THEME)}}if(ids.indexOf(t)<0)t=${JSON.stringify(DEFAULT_THEME)};document.documentElement.setAttribute('data-theme',t)}catch(e){}})();`;

/** Majhna samostojna HTML stran za potrditev / odjavo (brez React odjemalca). */
export function messagePage(opts: { title: string; text: string; form?: { action: string; button: string } }): string {
  const { title, text, form } = opts;
  return `<!doctype html><html lang="sl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${escapeHtml(title)} — Koledar odvoza</title>
  <link rel="stylesheet" href="/themes.css">
  <script>${THEME_BOOT}</script>
  <style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:var(--color-paper-50);color:var(--color-ink);font-family:system-ui,Arial}
  .k{background:var(--color-card);border:1px solid var(--color-paper-200);border-radius:20px;padding:36px;max-width:420px;text-align:center}
  h1{color:var(--color-heading)}a{color:var(--color-lime-600)}.c{font-size:11px;color:var(--color-ink-soft)}
  button{background:var(--color-btn);color:var(--color-btn-text);border:0;border-radius:999px;padding:14px 28px;font-size:16px;font-weight:600;cursor:pointer}</style></head><body><div class="k">
  <h1>${escapeHtml(title)}</h1>
  <p>${escapeHtml(text)}</p>
  ${form ? `<form method="post" action="${escapeHtml(form.action)}"><button type="submit">${escapeHtml(form.button)}</button></form>` : ''}
  <p><a href="/">← Nazaj na koledar</a></p>
  <p class="c">Created by Matjaž Tekavec</p></div></body></html>`;
}

export function htmlResponse(html: string, status = 200): Response {
  return new Response(html, {
    status,
    headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', 'referrer-policy': 'no-referrer' },
  });
}
