export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getSettings, setSetting } from '@/lib/data';
import { smtpConfigured } from '@/lib/mailer';

export async function GET() {
  const s = await getSettings();
  return NextResponse.json({
    ok: true,
    settings: s,
    smtp: {
      configured: smtpConfigured(),
      host: process.env.SMTP_HOST || '',
      port: process.env.SMTP_PORT || '587',
      user: process.env.SMTP_USER ? mask(process.env.SMTP_USER) : '',
      from: process.env.SMTP_FROM || '',
    },
    cronSecretSet: Boolean(process.env.CRON_SECRET),
  });
}

function mask(v: string): string {
  if (v.length <= 3) return '***';
  return `${v.slice(0, 2)}***${v.slice(-2)}`;
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as { notifyEnabled?: boolean; notifyTime?: string; daysBefore?: number };
  if (typeof body.notifyEnabled === 'boolean') {
    await setSetting('notify.enabled', String(body.notifyEnabled));
  }
  if (typeof body.notifyTime === 'string' && /^([01]?\d|2[0-3]):[0-5]\d$/.test(body.notifyTime)) {
    await setSetting('notify.time', body.notifyTime.padStart(5, '0'));
  }
  if (typeof body.daysBefore === 'number' && body.daysBefore >= 0 && body.daysBefore <= 3) {
    await setSetting('notify.daysBefore', String(Math.round(body.daysBefore)));
  }
  const s = await getSettings();
  return NextResponse.json({ ok: true, settings: s });
}
