import { addDaysStr, minutesNowLj, todayStr } from '@/lib/dates';
import { getEventOn, getSettings, getSubscribersByVillage, logSent, setSetting } from '@/lib/data';
import { sendReminderMail, smtpConfigured } from '@/lib/mailer';
import { villageName } from '@/lib/villages';

export type CheckResult = {
  ranToCompletion: boolean;
  reason: string;
  sent?: number;
  targetDate?: string;
  perVillage?: { village: string; date: string; types: string[]; sent: number }[];
};

/**
 * Preveri, ali je čas za dnevno obvestilo (dan pred odvozom), in ga pošlje
 * naročnikom — vsakemu za njegov kraj. Idempotentno na dan.
 */
export async function checkAndSendReminders(force = false): Promise<CheckResult> {
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

  const target = addDaysStr(today, s.daysBefore);
  const byVillage = await getSubscribersByVillage();

  if (byVillage.size === 0) {
    if (!force) await setSetting('notify.lastRunDate', today);
    return { ranToCompletion: true, reason: 'ni aktivnih naročnikov', targetDate: target };
  }

  if (!smtpConfigured()) {
    await logSent({ targetDate: target, village: '—', recipients: 0, types: [], status: 'error', error: 'SMTP ni nastavljen' });
    if (!force) await setSetting('notify.lastRunDate', today);
    return { ranToCompletion: false, reason: 'SMTP ni nastavljen (nastavi SMTP_HOST, SMTP_USER, SMTP_PASS)', targetDate: target };
  }

  const base = (process.env.APP_BASE_URL || '').replace(/\/$/, '');
  const perVillage: { village: string; date: string; types: string[]; sent: number }[] = [];
  let totalSent = 0;

  for (const [village, subs] of byVillage) {
    const event = await getEventOn(target, village);
    if (!event) continue; // v tem kraju jutri ni odvoza

    let sent = 0;
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
    totalSent += sent;
    perVillage.push({ village, date: event.date, types: event.types, sent });
    await logSent({
      targetDate: target,
      village,
      recipients: sent,
      types: event.types,
      status: errors.length && !sent ? 'error' : 'ok',
      error: errors.length ? errors.slice(0, 5).join(' | ') : null,
    });
  }

  await setSetting('notify.lastRunDate', today);
  return {
    ranToCompletion: true,
    reason: totalSent > 0 ? 'poslano' : `na ${target} ni odvoza za nobenega naročnika`,
    sent: totalSent,
    targetDate: target,
    perVillage,
  };
}
