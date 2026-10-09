export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getEventsByYear, getUpcomingEvents } from '@/lib/data';
import { parseDateStr, todayStr } from '@/lib/dates';
import { DEFAULT_VILLAGE, VILLAGES, getVillage } from '@/lib/villages';

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const village = getVillage(sp.get('kraj') || DEFAULT_VILLAGE);
  const today = todayStr();
  const [eventsByYear, upcoming] = await Promise.all([getEventsByYear(village.id), getUpcomingEvents(6, village.id)]);
  const years = Object.keys(eventsByYear).map(Number).sort((a, b) => a - b);
  const thisYear = parseDateStr(today).y;
  const requested = parseInt(sp.get('leto') || '', 10);
  const year = years.includes(requested)
    ? requested
    : years.includes(thisYear)
      ? thisYear
      : years.length
        ? years[years.length - 1]
        : thisYear;
  return NextResponse.json({
    village: village.id,
    villages: VILLAGES.map((v) => ({ id: v.id, name: v.name, detail: v.detail ?? null })),
    year,
    years,
    events: eventsByYear[year] ?? [],
    eventsByYear,
    upcoming,
    today,
  });
}
