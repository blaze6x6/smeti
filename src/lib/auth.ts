/**
 * Zaščita zaledja z geslom iz okolja (ADMIN_PASSWORD).
 *
 * Po uspešni prijavi dobi brskalnik podpisan piškotek (HMAC-SHA256).
 * Uporabljamo Web Crypto, da isti kodo lahko teče v middlewaru (Edge)
 * in v API potéh (Node).
 */

export const ADMIN_COOKIE = 'odvoz_admin';
/** Veljavnost seje v sekundah (30 dni). */
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30;

/** Ali je zaščita sploh vklopljena (geslo nastavljeno v okolju). */
export function authEnabled(): boolean {
  return Boolean(process.env.ADMIN_PASSWORD && process.env.ADMIN_PASSWORD.length > 0);
}

function secret(): string {
  // Podpisni ključ: ločen ADMIN_SECRET, sicer izpeljan iz gesla.
  return process.env.ADMIN_SECRET || `odvoz::${process.env.ADMIN_PASSWORD ?? ''}`;
}

const enc = new TextEncoder();

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function hmac(message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  return toHex(await crypto.subtle.sign('HMAC', key, enc.encode(message)));
}

/**
 * Zaledje brez gesla je dovoljeno le izrecno (ALLOW_OPEN_ADMIN=true) ali v razvoju.
 * V produkciji brez gesla zaledje ostane zaklenjeno (fail-closed).
 */
export function adminOpenAllowed(): boolean {
  if (authEnabled()) return false;
  return process.env.ALLOW_OPEN_ADMIN === 'true' || process.env.NODE_ENV !== 'production';
}

/** Primerjava brez časovnega uhajanja. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Ustvari vrednost piškotka za sejo, ki poteče čez SESSION_MAX_AGE. */
export async function createSessionValue(): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE;
  const sig = await hmac(String(exp));
  return `${exp}.${sig}`;
}

/** Preveri veljavnost piškotka (podpis + rok). */
export async function verifySessionValue(value: string | undefined | null): Promise<boolean> {
  if (!value) return false;
  const idx = value.lastIndexOf('.');
  if (idx <= 0) return false;
  const exp = value.slice(0, idx);
  const sig = value.slice(idx + 1);
  const expNum = Number(exp);
  if (!Number.isFinite(expNum) || expNum * 1000 < Date.now()) return false;
  const expected = await hmac(exp);
  return safeEqual(sig, expected);
}

/** Preveri vpisano geslo (primerjava SHA-256 izvlečkov — brez uhajanja dolžine). */
export async function checkPassword(input: string): Promise<boolean> {
  const pw = process.env.ADMIN_PASSWORD ?? '';
  if (!pw) return false;
  const [a, b] = await Promise.all([
    crypto.subtle.digest('SHA-256', enc.encode(input)),
    crypto.subtle.digest('SHA-256', enc.encode(pw)),
  ]);
  return safeEqual(toHex(a), toHex(b));
}
