import {
  pgTable, serial, text, integer, boolean, timestamp, date, uniqueIndex,
} from 'drizzle-orm/pg-core';

/** Urnik odvoza za kraj (Smokuč — odvoz ob ponedeljkih) */
export const schedules = pgTable(
  'schedules',
  {
    id: serial('id').primaryKey(),
    date: date('date').notNull(), // ISO 'YYYY-MM-DD'
    types: text('types').array().notNull(), // npr. ['mesani'] ali ['mesani','bio']
    note: text('note'),
    year: integer('year').notNull(),
    village: text('village').notNull().default('smokuc'),
    source: text('source').notNull().default('seed'), // seed | pdf-import | ročno
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('schedules_date_village_uq').on(t.date, t.village)],
);

/** Naročniki e-poštnih obvestil */
export const subscribers = pgTable(
  'subscribers',
  {
    id: serial('id').primaryKey(),
    email: text('email').notNull(),
    village: text('village').notNull().default('smokuc'),
    active: boolean('active').notNull().default(true),
    token: text('token').notNull(), // za odjavo
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('subscribers_email_uq').on(t.email)],
);

/** Nastavitve aplikacije (ključ/vrednost) */
export const settings = pgTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
});

/** Dnevnik poslanih obvestil */
export const sentLogs = pgTable('sent_logs', {
  id: serial('id').primaryKey(),
  sentAt: timestamp('sent_at', { withTimezone: true }).notNull().defaultNow(),
  targetDate: text('target_date').notNull(), // datum odvoza, za katerega je obvestilo
  village: text('village').notNull().default('smokuc'),
  recipients: integer('recipients').notNull().default(0),
  types: text('types').array().notNull().default([]),
  status: text('status').notNull().default('ok'), // ok | error | preskočeno
  error: text('error'),
});

/** Zgodovina uvozov PDF koledarjev */
export const imports = pgTable('imports', {
  id: serial('id').primaryKey(),
  year: integer('year').notNull(),
  filename: text('filename'),
  method: text('method').notNull().default('unknown'), // vector | raster | manual | generator
  eventsCount: integer('events_count').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export type ScheduleRow = typeof schedules.$inferSelect;
export type SubscriberRow = typeof subscribers.$inferSelect;
