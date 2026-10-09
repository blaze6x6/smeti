import { test } from 'node:test';
import assert from 'node:assert/strict';
import { VILLAGES, buildVillageSchedule, getVillage, type WeekCell } from './villages';

const smokuc = getVillage('smokuc'); // mešani + embalaža: ponedeljek
const zirovnica = getVillage('zirovnica'); // mešani: torek, embalaža: sreda

/** Običajen teden (po/to/sr) z eno frakcijo. */
const week = (monday: string, type: string): WeekCell[] => {
  const d = new Date(`${monday}T00:00:00Z`);
  return [0, 1, 2].map((col) => {
    const x = new Date(d.getTime() + col * 86400000);
    return { date: x.toISOString().slice(0, 10), col, type };
  });
};

test('običajen teden: vsak kraj dobi svoj dan', () => {
  const cells = week('2026-01-05', 'mesani');
  assert.deepEqual(buildVillageSchedule(cells, smokuc).map((e) => e.date), ['2026-01-05']);
  assert.deepEqual(buildVillageSchedule(cells, zirovnica).map((e) => e.date), ['2026-01-06']);
});

test('embalaža in mešani imata lahko različen dan istega kraja', () => {
  const cells = [...week('2026-01-05', 'mesani'), ...week('2026-01-12', 'embalaza')];
  const ev = buildVillageSchedule(cells, zirovnica);
  assert.deepEqual(ev.map((e) => [e.date, e.types[0]]), [['2026-01-06', 'mesani'], ['2026-01-14', 'embalaza']]);
});

test('praznik v ponedeljek: odvoz se prestavi na naslednji obarvani dan z opombo', () => {
  // velikonočni ponedeljek 6. 4. 2026 ni obarvan
  const cells = week('2026-04-06', 'embalaza').filter((c) => c.col !== 0);
  const ev = buildVillageSchedule(cells, smokuc);
  assert.equal(ev.length, 1);
  assert.equal(ev[0].date, '2026-04-07');
  assert.ok(ev[0].note);
});

test('začetek leta: delni teden ne ustvari lažne prestavitve', () => {
  // koledar 2025 vsebuje od tedna 30. 12. 2024 le sredo in četrtek (1. in 2. 1.)
  const cells: WeekCell[] = [
    { date: '2025-01-01', col: 2, type: 'embalaza' },
    { date: '2025-01-02', col: 3, type: 'embalaza' },
    ...week('2025-01-06', 'mesani'),
  ];
  const brezLeta = buildVillageSchedule(cells, smokuc).map((e) => e.date);
  assert.ok(brezLeta.includes('2025-01-01'), 'staro obnašanje: lažna prestavitev');
  const sLetom = buildVillageSchedule(cells, smokuc, 2025).map((e) => e.date);
  assert.deepEqual(sLetom, ['2025-01-06']);
});

test('vsak kraj ima veljavne dneve odvoza', () => {
  for (const v of VILLAGES) {
    assert.ok([0, 1, 2].includes(v.days.mesani), v.id);
    assert.ok([0, 1, 2].includes(v.days.embalaza), v.id);
  }
});
