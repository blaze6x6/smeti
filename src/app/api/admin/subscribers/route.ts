export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { addSubscriber, getSubscribers, removeSubscriber } from '@/lib/data';
import { DEFAULT_VILLAGE, VILLAGES } from '@/lib/villages';

export async function GET() {
  const subs = await getSubscribers(false);
  return NextResponse.json({
    ok: true,
    subscribers: subs.map((s) => ({ id: s.id, email: s.email, village: s.village, active: s.active, createdAt: s.createdAt })),
  });
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as { email?: string; village?: string };
  const email = (body.email || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return NextResponse.json({ ok: false, error: 'Neveljaven e-poštni naslov.' }, { status: 400 });
  }
  const village = VILLAGES.some((v) => v.id === body.village) ? (body.village as string) : DEFAULT_VILLAGE;
  await addSubscriber(email, village);
  return NextResponse.json({ ok: true, village });
}

export async function DELETE(req: NextRequest) {
  const id = parseInt(req.nextUrl.searchParams.get('id') || '', 10);
  if (!id) return NextResponse.json({ ok: false, error: 'Manjka id.' }, { status: 400 });
  await removeSubscriber(id);
  return NextResponse.json({ ok: true });
}
