/**
 * Preprost rate-limit v pomnilniku (drseče okno). Zadošča za enega Node proces
 * (kot ga zaganja docker-compose); ob več replikah bi bilo treba shrambo deliti.
 */
const buckets = new Map<string, number[]>();
let lastSweep = 0;

export function rateLimit(key: string, max: number, windowMs: number): { ok: boolean; retryAfterSec: number } {
  const now = Date.now();
  if (now - lastSweep > 60_000) {
    lastSweep = now;
    for (const [k, hits] of buckets) {
      if (!hits.length || now - hits[hits.length - 1] > 3_600_000) buckets.delete(k);
    }
  }
  const hits = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (hits.length >= max) {
    buckets.set(key, hits);
    return { ok: false, retryAfterSec: Math.max(1, Math.ceil((windowMs - (now - hits[0])) / 1000)) };
  }
  hits.push(now);
  buckets.set(key, hits);
  return { ok: true, retryAfterSec: 0 };
}
