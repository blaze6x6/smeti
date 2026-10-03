/** npm run db:seed — ročni seed baze (idempotentno) */
import { seedDatabaseIfEmpty } from './seed-lib';

async function main() {
  const res = await seedDatabaseIfEmpty();
  console.log(res.seeded ? `Vnešenih ${res.events} dogodkov.` : `Baza že vsebuje ${res.events} dogodkov.`);
  process.exit(0);
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
