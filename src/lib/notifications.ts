import { addDaysStr, minutesNowLj, todayStr } from '@/lib/dates';
import {
  deletePushSubs,
  getEventOn,
  getPushSubsByVillage,
  getSettings,
  getSubscribersByVillage,
  logSent,
  markPushOk,
  setSetting,
} from '@/lib/data';
import { buildReminderPayload, sendPush } from '@/lib/push';
import { sendReminderMail, smtpConfigured } from '@/lib/mailer';
import { villageName } from '@/lib/villages';
import type { PoolClient } from 'pg';
import { pool } from '@/db';

export type CheckResult = {
  ranToCompletion: boolean;
  reason: string;
  sent?: number;
  targetDate?: string;
  perVillage?: { village: string; date: string; types: string[]; sent: number; push: number }[];
};

/**
 * Preveri, ali je čas za dnevno obvestilo (dan pred odvozom), in ga pošlje
 * naročnikom — vsakemu za njegov kraj. Idempotentno na dan.
 */
export async function checkAndSendReminders(force = false): Promise<CheckResult> {
  // Zaščita pred sočasnimi teki (cron vsako minuto + ročni sprožilec + več replik):
  // najprej proces-lokalni zaklep, nato Postgres advisory lock.
  if (running) return { ranToCompletion: false, reason: 'pošiljanje že teče' };
  running = true;
  let client: PoolClient | null = null;
  try {
    client = await pool.connect();
    const { rows } = await client.query<{ ok: boolean }>('select pg_try_advisory_lock($1) as ok', [LOCK_KEY]);
    if (!rows[0]?.ok) return { ranToCompletion: false, reason: 'pošiljanje že teče (druga instanca)' };
    return await runReminders(force);
  } finally {
    if (client) {
      await client.query('select pg_advisory_unlock($1)', [LOCK_KEY]).catch(() => undefined);
      client.release();
    }
    running = false;
  }
}

let running = false;
const LOCK_KEY = 74_219_001;

async function runReminders(force: boolean): Promise<CheckResult> {
  const s = await getSettings();
  const today = todayStr();

  if (!force) {
    if (!s.notifyEnabled) return { ranToCompletion: false, reason: 'obvestila so izklopljena' };
    if (s.lastRunDate === today) return { ranToCompletion: false, reason: 'danes že poslano/preverjeno' };
    const [hh, mm] = s.notifyTime.split(':').map(Number);
    if (minutesNowLj() < hh * 60 + mm) {
      return { ranToCompletion: false, reason: `še ni čas (nastavljeno ${s.notifyTime})` };
    }
  }

  // dan »rezerviramo« takoj, da morebitni zakasnjeni tek ne pošlje še enkrat
  if (!force) await setSetting('notify.lastRunDate', today);

  const target = addDaysStr(today, s.daysBefore);
  const emailByVillage = await getSubscribersByVillage();
  const pushByVillage = await getPushSubsByVillage();

  const villages = new Set<string>([...emailByVillage.keys(), ...pushByVillage.keys()]);
  if (villages.size === 0) {
    return { ranToCompletion: true, reason: 'ni aktivnih naročnikov', targetDate: target };
  }

  // e-pošta je mogoča le z SMTP in javnim naslovom; push je neodvisen
  const base = (process.env.APP_BASE_URL || '').replace(/\/$/, '');
  let emailBlocker: string | null = null;
  if (emailByVillage.size > 0) {
    if (!smtpConfigured()) emailBlocker = 'SMTP ni nastavljen';
    else if (!base) emailBlocker = 'APP_BASE_URL ni nastavljen';
  }
  if (emailBlocker) {
    await logSent({ targetDate: target, village: '—', recipients: 0, types: [], status: 'error', error: emailBlocker });
    if (pushByVillage.size === 0) {
      return { ranToCompletion: false, reason: `${emailBlocker} (potreben za pošiljanje e-pošte)`, targetDate: target };
    }
  }

  const perVillage: NonNullable<CheckResult['perVillage']> = [];
  let totalSent = 0;

  for (const village of villages) {
    const event = await getEventOn(target, village);
    if (!event) continue; // v tem kraju na ciljni dan ni odvoza

    // --- e-pošta ---
    let sent = 0;
    const subs = emailBlocker ? [] : emailByVillage.get(village) ?? [];
    if (subs.length) {
      const errors: string[] = [];
      for (const sub of subs) {
        try {
          await sendReminderMail({
            to: sub.email,
            dateStr: event.date,
            types: event.types,
            note: event.note,
            villageLabel: villageName(village),
            unsubscribeUrl: `${base}/api/unsubscribe?t=${sub.token}`,
          });
          sent++;
        } catch (e) {
          errors.push(`${sub.email}: ${e instanceof Error ? e.message : String(e)}`);
        }
      }
      await logSent({
        targetDate: target,
        village,
        recipients: sent,
        types: event.types,
        status: errors.length && !sent ? 'error' : 'ok',
        error: errors.length ? errors.slice(0, 5).join(' | ') : null,
        channel: 'email',
      });
    }

    // --- push ---
    let pushed = 0;
    const psubs = pushByVillage.get(village) ?? [];
    if (psubs.length) {
      const payload = buildReminderPayload({
        dateStr: event.date,
        types: event.types,
        note: event.note,
        villageLabel: villageName(village),
        daysBefore: s.daysBefore,
      });
      const okIds: number[] = [];
      const goneIds: number[] = [];
      const perrors: string[] = [];
      for (const ps of psubs) {
        const r = await sendPush(ps, payload);
        if (r.ok) okIds.push(ps.id);
        else if (r.gone) goneIds.push(ps.id);
        else perrors.push(r.error || `HTTP ${r.status ?? '?'}`);
      }
      await markPushOk(okIds);
      await deletePushSubs(goneIds);
      pushed = okIds.length;
      await logSent({
        targetDate: target,
        village,
        recipients: pushed,
        types: event.types,
        status: perrors.length && !pushed ? 'error' : 'ok',
        error: perrors.length ? perrors.slice(0, 5).join(' | ') : null,
        channel: 'push',
      });
    }

    totalSent += sent + pushed;
    perVillage.push({ village, date: event.date, types: event.types, sent, push: pushed });
  }

  return {
    ranToCompletion: true,
    reason: totalSent > 0 ? 'poslano' : `na ${target} ni odvoza za nobenega naročnika`,
    sent: totalSent,
    targetDate: target,
    perVillage,
  };
}
