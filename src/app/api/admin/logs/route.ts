export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getRecentImports, getRecentLogs } from '@/lib/data';

export async function GET() {
  const [logs, imports] = await Promise.all([getRecentLogs(40), getRecentImports(12)]);
  return NextResponse.json({ ok: true, logs, imports });
}
