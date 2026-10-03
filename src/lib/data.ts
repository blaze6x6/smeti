import { and, asc, eq, gte, sql } from 'drizzle-orm';
import { db } from '@/db';
import { imports, schedules, sentLogs, settings, subscribers, type ScheduleRow } from '@/db/schema';
import { todayStr } from '@/lib/dates';
import { DEFAULT_VILLAGE } from '@/lib/villages';

export type ScheduleEventDto = {
  id: number;
  date: string;
  types: string[];
  note: string | null;
  source: string;
};

function toDto(r: ScheduleRow): ScheduleEventDto {
  return { id: r.id, date: r.date, types: r.types ?? [], note: r.note, source: r.source };
}

export async function getAvailableYears(village: string = DEFAULT_VILLAGE): Promise<number[]> {
  const rows = await db
    .selectDistinct({ year: schedules.year })
    .from(schedules)
    .where(eq(schedules.village, village))
    .orderBy(asc(schedules.year));
  return rows.map((r) => r.year);
}

export async function getEventsForYear(year: number, village: string = DEFAULT_VILLAGE): Promise<ScheduleEventDto[]> {
  const rows = await db
    .select()
    .from(schedules)
    .where(and(eq(schedules.year, year), eq(schedules.village, village)))
    .orderBy(asc(schedules.date));
  return rows.map(toDto);
}

export async function getAllEvents(village: string = DEFAULT_VILLAGE): Promise<ScheduleEventDto[]> {
  const rows = await db.select().from(schedules).where(eq(schedules.village, village)).orderBy(asc(schedules.date));
  return rows.map(toDto);
}

export async function getUpcomingEvents(limit = 6, village: string = DEFAULT_VILLAGE): Promise<ScheduleEventDto[]> {
  const rows = await db
    .select()
    .from(schedules)
    .where(and(eq(schedules.village, village), gte(schedules.date, todayStr())))
    .orderBy(asc(schedules.date))
    .limit(limit);
  return rows.map(toDto);
}

export async function getEventOn(dateStr: string, village: string = DEFAULT_VILLAGE): Promise<ScheduleEventDto | null> {
  const rows = await db
    .select()
    .from(schedules)
    .where(and(eq(schedules.village, village), eq(schedules.date, dateStr)))
    .limit(1);
  return rows.length ? toDto(rows[0]) : null;
}

/* ---------- nastavitve ---------- */

export type AppSettings = {
  notifyEnabled: boolean;
  notifyTime: string; // 'HH:MM'
  daysBefore: number; // 1 = dan prej
  lastRunDate: string; // '' če še ni teklo
  smtpFrom: string;
};

export const DEFAULT_SETTINGS: AppSettings = {
  notifyEnabled: true,
  notifyTime: '18:00',
  daysBefore: 1,
  lastRunDate: '',
  smtpFrom: '',
};

export async function getSettings(): Promise<AppSettings> {
  const rows = await db.select().from(settings);
  const map = new Map(rows.map((r) => [r.key, r.value]));
  return {
    notifyEnabled: (map.get('notify.enabled') ?? 'true') === 'true',
    notifyTime: map.get('notify.time') ?? DEFAULT_SETTINGS.notifyTime,
    daysBefore: parseInt(map.get('notify.daysBefore') ?? '1', 10) || 1,
    lastRunDate: map.get('notify.lastRunDate') ?? '',
    smtpFrom: map.get('smtp.from') ?? '',
  };
}

export async function setSetting(key: string, value: string): Promise<void> {
  await db
    .insert(settings)
    .values({ key, value })
    .onConflictDoUpdate({ target: settings.key, set: { value } });
}

/* ---------- naročniki ---------- */

export async function getSubscribers(activeOnly = true) {
  const rows = await db.select().from(subscribers).orderBy(asc(subscribers.email));
  return activeOnly ? rows.filter((r) => r.active) : rows;
}

export async function addSubscriber(
  email: string,
  village: string = DEFAULT_VILLAGE,
): Promise<{ ok: boolean; existed?: boolean; changed?: boolean }> {
  const clean = email.trim().toLowerCase();
  const existing = await db.select().from(subscribers).where(eq(subscribers.email, clean)).limit(1);
  if (existing.length) {
    const row = existing[0];
    const changed = row.village !== village;
    if (!row.active || changed) {
      await db.update(subscribers).set({ active: true, village }).where(eq(subscribers.id, row.id));
      return { ok: true, changed };
    }
    return { ok: true, existed: true };
  }
  const token = crypto.randomUUID();
  await db.insert(subscribers).values({ email: clean, village, token, active: true });
  return { ok: true };
}

/** Aktivni naročniki, združeni po kraju. */
export async function getSubscribersByVillage(): Promise<Map<string, { email: string; token: string }[]>> {
  const rows = await db.select().from(subscribers).where(eq(subscribers.active, true));
  const map = new Map<string, { email: string; token: string }[]>();
  for (const r of rows) {
    if (!map.has(r.village)) map.set(r.village, []);
    map.get(r.village)!.push({ email: r.email, token: r.token });
  }
  return map;
}

export async function removeSubscriber(id: number): Promise<void> {
  await db.delete(subscribers).where(eq(subscribers.id, id));
}

export async function unsubscribeByToken(token: string): Promise<boolean> {
  const rows = await db.select().from(subscribers).where(eq(subscribers.token, token)).limit(1);
  if (!rows.length) return false;
  await db.update(subscribers).set({ active: false }).where(eq(subscribers.id, rows[0].id));
  return true;
}

/* ---------- dnevnik ---------- */

export async function logSent(entry: {
  targetDate: string;
  village: string;
  recipients: number;
  types: string[];
  status: string;
  error?: string | null;
}) {
  await db.insert(sentLogs).values({
    targetDate: entry.targetDate,
    village: entry.village,
    recipients: entry.recipients,
    types: entry.types,
    status: entry.status,
    error: entry.error ?? null,
  });
}

export async function getRecentLogs(limit = 30) {
  return db.select().from(sentLogs).orderBy(sql`${sentLogs.sentAt} desc`).limit(limit);
}

export async function logImport(entry: { year: number; filename: string | null; method: string; eventsCount: number }) {
  await db.insert(imports).values(entry);
}

export async function getRecentImports(limit = 10) {
  return db.select().from(imports).orderBy(sql`${imports.createdAt} desc`).limit(limit);
}
