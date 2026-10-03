import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

// Opomba: pg.Pool ob konstruktorju NE vzpostavi povezave (len do prvega queryja),
// zato je modul varen za uvoz tudi brez DATABASE_URL (npr. Next "collect page data"
// med gradnjo v Dockerju). Dejanska povezava se vzpostavi šele ob prvi poizvedbi.
const databaseUrl = process.env.DATABASE_URL ?? "";

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
};

export const pool =
  globalForDb.__arenaNextJsPostgresqlPool ??
  new Pool({
    connectionString: databaseUrl,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__arenaNextJsPostgresqlPool = pool;
}

export const db = drizzle(pool);
