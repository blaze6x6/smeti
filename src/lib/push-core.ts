/** Čista logika za push obvestila (brez odvisnosti od strežnika ali brskalnika) — testirana v push-core.test.ts. */
import { formatSlLong } from './dates';
import { wasteLabel } from './waste';

/**
 * Strežnik pošilja na naslov (endpoint), ki ga poda odjemalec. Da to ne bi postalo SSRF,
 * sprejmemo samo znane push storitve brskalnikov. Dodatne gostitelje lahko doda PUSH_ALLOWED_HOSTS.
 */
const DEFAULT_SUFFIXES = [
  'fcm.googleapis.com', // Chrome, Edge, Samsung Internet, Opera (Android/namizje)
  '.push.services.mozilla.com', // Firefox
  'updates.push.services.mozilla.com',
  '.push.apple.com', // Safari / iOS (web.push.apple.com)
  '.notify.windows.com', // Edge (WNS)
];

export function isAllowedPushEndpoint(endpoint: string, extraHosts = ''): boolean {
  let u: URL;
  try {
    u = new URL(endpoint);
  } catch {
    return false;
  }
  if (u.protocol !== 'https:' || u.username || u.password || (u.port && u.port !== '443')) return false;
  const host = u.hostname.toLowerCase();
  const extra = extraHosts
    .split(',')
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean);
  return [...DEFAULT_SUFFIXES, ...extra].some((suf) => (suf.startsWith('.') ? host.endsWith(suf) : host === suf || host.endsWith('.' + suf)));
}

export type PushKeys = { endpoint: string; p256dh: string; auth: string };

const B64URL = /^[A-Za-z0-9_-]+={0,2}$/;

/** Preveri obliko PushSubscription JSON (toJSON()) in vrne ploščato obliko ali null. */
export function parseSubscription(input: unknown, extraHosts = ''): PushKeys | null {
  if (!input || typeof input !== 'object') return null;
  const o = input as { endpoint?: unknown; keys?: { p256dh?: unknown; auth?: unknown } };
  const { endpoint } = o;
  const p256dh = o.keys?.p256dh;
  const auth = o.keys?.auth;
  if (typeof endpoint !== 'string' || endpoint.length > 1000 || !isAllowedPushEndpoint(endpoint, extraHosts)) return null;
  if (typeof p256dh !== 'string' || p256dh.length < 20 || p256dh.length > 200 || !B64URL.test(p256dh)) return null;
  if (typeof auth !== 'string' || auth.length < 8 || auth.length > 100 || !B64URL.test(auth)) return null;
  return { endpoint, p256dh, auth };
}

export type PushPayload = { title: string; body: string; url: string; tag: string };

/** Besedilo obvestila za odvoz. daysBefore: 0 = danes, 1 = jutri, drugo = čez N dni. */
export function buildReminderPayload(opts: {
  dateStr: string;
  types: string[];
  note: string | null;
  villageLabel: string;
  daysBefore: number;
}): PushPayload {
  const { dateStr, types, note, villageLabel, daysBefore } = opts;
  const when = daysBefore === 0 ? 'Danes je odvoz' : daysBefore === 1 ? 'Jutri je odvoz' : `Odvoz čez ${daysBefore} dni`;
  const what = types.map(wasteLabel).join(', ');
  return {
    title: `${when} — ${villageLabel}`,
    body: `${formatSlLong(dateStr)}: ${what}.${note ? ` ${note}.` : ''} Zabojnike postavi do 6. ure zjutraj.`,
    url: '/',
    tag: `odvoz-${dateStr}`,
  };
}

export function buildTestPayload(villageLabel: string): PushPayload {
  return {
    title: 'Preizkus obvestil ✓',
    body: `Obvestila na tej napravi delujejo. Opomnike o odvozu za kraj ${villageLabel} boš prejel dan pred odvozom.`,
    url: '/',
    tag: 'odvoz-test',
  };
}

/** Javni VAPID ključ (base64url) → Uint8Array za pushManager.subscribe. */
export function urlBase64ToUint8Array(b64: string): Uint8Array {
  const pad = '='.repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, '+').replace(/_/g, '/'));
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}
