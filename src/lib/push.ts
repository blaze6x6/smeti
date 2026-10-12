import webpush from 'web-push';
import { getSettingRaw, setSettingIfAbsent } from '@/lib/data';
import { buildReminderPayload, buildTestPayload, type PushPayload } from '@/lib/push-core';

export type Vapid = { publicKey: string; privateKey: string; source: 'env' | 'db' };

/**
 * VAPID ključi: iz okolja (VAPID_PUBLIC_KEY + VAPID_PRIVATE_KEY), sicer se ob prvi uporabi
 * samodejno ustvarijo in shranijo v bazo (ostanejo enaki ob ponovnih zagonih in selitvi baze).
 */
export async function getVapid(): Promise<Vapid> {
  const pub = process.env.VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (pub && priv) return { publicKey: pub, privateKey: priv, source: 'env' };

  let raw = await getSettingRaw('push.vapid');
  if (!raw) {
    await setSettingIfAbsent('push.vapid', JSON.stringify(webpush.generateVAPIDKeys()));
    raw = await getSettingRaw('push.vapid');
  }
  const k = JSON.parse(raw as string) as { publicKey: string; privateKey: string };
  return { publicKey: k.publicKey, privateKey: k.privateKey, source: 'db' };
}

/** Kontakt za push storitve (zahteva ga standard): https naslov ali mailto. */
function vapidSubject(): string {
  if (process.env.VAPID_SUBJECT) return process.env.VAPID_SUBJECT;
  const base = (process.env.APP_BASE_URL || '').trim();
  if (base.startsWith('https://')) return base;
  const mail = (process.env.SMTP_FROM || process.env.SMTP_USER || '').match(/[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+/)?.[0];
  return `mailto:${mail ?? 'obvestila@example.com'}`;
}

export type SendResult = { ok: boolean; gone?: boolean; status?: number; error?: string };

export async function sendPush(sub: { endpoint: string; p256dh: string; auth: string }, payload: PushPayload): Promise<SendResult> {
  const v = await getVapid();
  webpush.setVapidDetails(vapidSubject(), v.publicKey, v.privateKey);
  try {
    await webpush.sendNotification(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      JSON.stringify(payload),
      // 12 ur: obvestilo ob 18:00 prispe tudi, če je telefon čez noč brez povezave
      { TTL: 12 * 60 * 60, urgency: 'high', timeout: 10_000 },
    );
    return { ok: true };
  } catch (e) {
    const status = (e as { statusCode?: number }).statusCode;
    return {
      ok: false,
      // 404/410: naprava se je odjavila ali je naročnina potekla — izbrišemo jo
      gone: status === 404 || status === 410,
      status,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

export { buildReminderPayload, buildTestPayload };
