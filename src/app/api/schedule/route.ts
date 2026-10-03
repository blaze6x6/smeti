export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getAvailableYears, getEventsForYear, getUpcomingEvents } from '@/lib/data';
import { todayStr } from '@/lib/dates';
import { DEFAULT_VILLAGE, VILLAGES, getVillage } from '@/lib/villages';

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const village = getVillage(sp.get('kraj') || DEFAULT_VILLAGE);
  const years = await getAvailableYears(village.id);
  const fallback = years.length ? years[years.length - 1] : new Date().getFullYear();
  const year = parseInt(sp.get('leto') || '', 10) || fallback;
  const [events, upcoming] = await Promise.all([
    getEventsForYear(year, village.id),
    getUpcomingEvents(6, village.id),
  ]);
  return NextResponse.json({
    village: village.id,
    villages: VILLAGES.map((v) => ({ id: v.id, name: v.name, detail: v.detail ?? null })),
    year,
    years,
    events,
    upcoming,
    today: todayStr(),
  });
}
