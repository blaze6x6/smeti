export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;
  // migracije + seed + razporejevalnik ob zagonu strežnika (tudi v Dockerju)
  try {
    const { migrate } = await import('drizzle-orm/node-postgres/migrator');
    const { db } = await import('@/db');
    await migrate(db, { migrationsFolder: 'drizzle' });
    console.log('[boot] migracije baze: OK');
  } catch (e) {
    console.warn('[boot] migracije preskočene:', e instanceof Error ? e.message : e);
  }
  try {
    const { seedDatabaseIfEmpty } = await import('@/db/seed-lib');
    const res = await seedDatabaseIfEmpty();
    if (res.seeded) console.log(`[boot] seed: vnešenih ${res.events} dogodkov (uradni koledar JEKO)`);
  } catch (e) {
    console.warn('[boot] seed preskočen:', e instanceof Error ? e.message : e);
  }
  try {
    const { startScheduler } = await import('@/lib/scheduler');
    startScheduler();
  } catch (e) {
    console.warn('[boot] razporejevalnik preskočen:', e instanceof Error ? e.message : e);
  }
}
