import { and, asc, eq, gte, lt, sql } from 'drizzle-orm';
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

/** Vsi dogodki kraja, združeni po letih (za koledar, ki omogoča pomik med leti). */
export async function getEventsByYear(village: string = DEFAULT_VILLAGE): Promise<Record<number, ScheduleEventDto[]>> {
  const rows = await db.select().from(schedules).where(eq(schedules.village, village)).orderBy(asc(schedules.date));
  const out: Record<number, ScheduleEventDto[]> = {};
  for (const r of rows) (out[r.year] ??= []).push(toDto(r));
  return out;
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

function parseDaysBefore(v: string | undefined): number {
  const n = parseInt(v ?? '', 10);
  return Number.isFinite(n) && n >= 0 && n <= 3 ? n : DEFAULT_SETTINGS.daysBefore;
}

export async function getSettings(): Promise<AppSettings> {
  const rows = await db.select().from(settings);
  const map = new Map(rows.map((r) => [r.key, r.value]));
  return {
    notifyEnabled: (map.get('notify.enabled') ?? 'true') === 'true',
    notifyTime: map.get('notify.time') ?? DEFAULT_SETTINGS.notifyTime,
    daysBefore: parseDaysBefore(map.get('notify.daysBefore')),
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

/** Admin: doda (ali posodobi) naročnika brez potrditve — admin jamči za naslov. */
export async function addSubscriber(
  email: string,
  village: string = DEFAULT_VILLAGE,
): Promise<{ ok: boolean; existed?: boolean; changed?: boolean }> {
  const clean = email.trim().toLowerCase();
  const inserted = await db
    .insert(subscribers)
    .values({ email: clean, village, token: crypto.randomUUID(), active: true, confirmed: true })
    .onConflictDoNothing({ target: subscribers.email })
    .returning({ id: subscribers.id });
  if (inserted.length) return { ok: true };

  const [row] = await db.select().from(subscribers).where(eq(subscribers.email, clean)).limit(1);
  if (!row) return { ok: false };
  const changed = row.village !== village;
  if (!row.active || !row.confirmed || changed || row.pendingVillage) {
    await db
      .update(subscribers)
      .set({ active: true, confirmed: true, village, pendingVillage: null })
      .where(eq(subscribers.id, row.id));
    return { ok: true, changed };
  }
  return { ok: true, existed: true };
}

/**
 * Javna prijava (double opt-in): nič se ne aktivira, dokler lastnik naslova ne klikne
 * povezave v potrditveni e-pošti. Vrne žeton, če je treba poslati potrditveno sporočilo.
 */
export async function requestSubscription(
  email: string,
  village: string = DEFAULT_VILLAGE,
): Promise<{ send: boolean; token?: string; alreadySubscribed?: boolean }> {
  const clean = email.trim().toLowerCase();
  const token = crypto.randomUUID();
  const inserted = await db
    .insert(subscribers)
    .values({ email: clean, village, token, active: false, confirmed: false, pendingVillage: village })
    .onConflictDoNothing({ target: subscribers.email })
    .returning({ id: subscribers.id });
  if (inserted.length) return { send: true, token };

  const [row] = await db.select().from(subscribers).where(eq(subscribers.email, clean)).limit(1);
  if (!row) return { send: false };
  if (row.active && row.confirmed && row.village === village) {
    return { send: false, alreadySubscribed: true };
  }
  // sprememba kraja ali ponovna prijava: velja šele po potrditvi
  await db.update(subscribers).set({ pendingVillage: village }).where(eq(subscribers.id, row.id));
  return { send: true, token: row.token };
}

/** Potrdi prijavo (ali spremembo kraja) z žetonom iz e-pošte. */
export async function confirmByToken(token: string): Promise<{ ok: boolean; village?: string }> {
  const [row] = await db.select().from(subscribers).where(eq(subscribers.token, token)).limit(1);
  if (!row) return { ok: false };
  const village = row.pendingVillage ?? row.village;
  await db
    .update(subscribers)
    .set({ active: true, confirmed: true, village, pendingVillage: null })
    .where(eq(subscribers.id, row.id));
  return { ok: true, village };
}

/** Počisti nepotrjene prijave, starejše od 7 dni. */
export async function purgeStalePending(): Promise<void> {
  await db
    .delete(subscribers)
    .where(and(eq(subscribers.confirmed, false), lt(subscribers.createdAt, sql`now() - interval '7 days'`)));
}

/** Aktivni (in potrjeni) naročniki, združeni po kraju. */
export async function getSubscribersByVillage(): Promise<Map<string, { email: string; token: string }[]>> {
  const rows = await db
    .select()
    .from(subscribers)
    .where(and(eq(subscribers.active, true), eq(subscribers.confirmed, true)));
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
  await db.update(subscribers).set({ active: false, pendingVillage: null }).where(eq(subscribers.id, rows[0].id));
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
