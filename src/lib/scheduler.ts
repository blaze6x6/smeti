import cron from 'node-cron';
import { checkAndSendReminders } from '@/lib/notifications';

const g = globalThis as typeof globalThis & { __smokucScheduler?: boolean };

/**
 * Vsako minuto preveri, ali je čas za dnevno obvestilo (privzeto 18:00,
 * dan pred odvozom). V Dockerju teče znotraj Next.js procesa (instrumentation).
 */
export function startScheduler(): void {
  if (g.__smokucScheduler) return;
  g.__smokucScheduler = true;
  cron.schedule('* * * * *', async () => {
    try {
      await checkAndSendReminders(false);
    } catch (e) {
      console.error('[scheduler] napaka:', e);
    }
  });
  console.log('[scheduler] dnevna obvestila aktivna (preverjanje vsako minuto)');
}
