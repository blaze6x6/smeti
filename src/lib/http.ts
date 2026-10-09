import { timingSafeEqual } from 'node:crypto';
import type { NextRequest } from 'next/server';

/** IP odjemalca (za rate-limit). Za reverse proxyjem se zanese na X-Forwarded-For. */
export function clientIp(req: NextRequest): string {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim() || 'unknown';
  return req.headers.get('x-real-ip') || 'unknown';
}

/** Ali je zahteva prispela prek HTTPS (neposredno ali prek proxyja). */
export function isHttps(req: NextRequest): boolean {
  const proto = req.headers.get('x-forwarded-proto')?.split(',')[0].trim();
  return (proto || req.nextUrl.protocol.replace(':', '')) === 'https';
}

/** Javni osnovni naslov: APP_BASE_URL, sicer izpeljan iz zahteve. */
export function baseUrl(req?: NextRequest): string {
  const env = (process.env.APP_BASE_URL || '').replace(/\/$/, '');
  if (env) return env;
  if (!req) return '';
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || req.nextUrl.host;
  const proto = req.headers.get('x-forwarded-proto')?.split(',')[0].trim() || req.nextUrl.protocol.replace(':', '');
  return `${proto}://${host}`;
}

/** Primerjava skrivnosti brez časovnega uhajanja (tudi pri različnih dolžinah). */
export function secretsEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) {
    timingSafeEqual(ba, ba);
    return false;
  }
  return timingSafeEqual(ba, bb);
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
