import nodemailer from 'nodemailer';
import { formatSlLong } from '@/lib/dates';
import { WASTE_TYPES, wasteColor, wasteLabel } from '@/lib/waste';
import { escapeHtml } from '@/lib/http';

export function smtpConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER);
}

type Transporter = ReturnType<typeof nodemailer.createTransport>;
const g = globalThis as typeof globalThis & { __smokucMailer?: { key: string; t: Transporter } };

/** En skupen (pooled) transporter — ne odpiramo nove SMTP povezave za vsako sporočilo. */
function getTransporter(): Transporter {
  const host = process.env.SMTP_HOST;
  if (!host) throw new Error('SMTP ni nastavljen (manjka SMTP_HOST).');
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const secure = (process.env.SMTP_SECURE ?? (port === 465 ? 'true' : 'false')) === 'true';
  const key = [host, port, secure, process.env.SMTP_USER, process.env.SMTP_PASS].join('|');
  if (g.__smokucMailer?.key === key) return g.__smokucMailer.t;
  g.__smokucMailer?.t.close();
  const t = nodemailer.createTransport({
    host,
    port,
    secure,
    pool: true,
    maxConnections: 2,
    maxMessages: 100,
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 30000,
  });
  g.__smokucMailer = { key, t };
  return t;
}

function fromAddress(): string {
  return process.env.SMTP_FROM || process.env.SMTP_USER || 'koledar-odvoza@localhost';
}

function typeChip(typeId: string): string {
  const c = wasteColor(typeId);
  const t = (WASTE_TYPES as Record<string, { textOn: string }>)[typeId]?.textOn ?? '#fff';
  return `<span style="display:inline-block;background:${c};color:${t};border-radius:999px;padding:6px 14px;font-weight:600;font-size:14px;margin:3px 4px 3px 0;">${wasteLabel(typeId)}</span>`;
}

export function reminderHtml(opts: {
  dateStr: string;
  types: string[];
  note: string | null;
  villageLabel?: string;
  unsubscribeUrl: string;
}): string {
  const { dateStr, types, note, unsubscribeUrl } = opts;
  const kraj = opts.villageLabel || 'Smokuču';
  return `<!doctype html><html lang="sl"><body style="margin:0;padding:0;background:#0e1f16;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:24px;">
    <div style="background:#10321f;border:1px solid #1f4a30;border-radius:20px;padding:28px;color:#eaf5ec;">
      <div style="font-size:12px;letter-spacing:3px;text-transform:uppercase;color:#9fd8ad;">Obvestilo o odvozu</div>
      <h1 style="font-size:26px;line-height:1.2;margin:10px 0 4px;color:#ffffff;">Jutri je odvoz — ${kraj}</h1>
      <p style="font-size:16px;color:#c9e6cf;margin:0 0 18px;">${formatSlLong(dateStr)}</p>
      <div style="margin:8px 0 18px;">${types.map(typeChip).join('')}</div>
      ${note ? `<p style="background:#173d27;border-radius:12px;padding:12px 14px;font-size:14px;color:#ffe9a8;">Opomba: ${escapeHtml(note)}</p>` : ''}
      <p style="font-size:14px;color:#a8c9ae;line-height:1.5;">Zabojnike postavite ob mejo zemljišča <strong>prejšnji večer oziroma najkasneje do 6. ure zjutraj</strong>.</p>
      <hr style="border:none;border-top:1px solid #1f4a30;margin:20px 0;" />
      <p style="font-size:12px;color:#7fa486;">Koledar odvoza — ${kraj}, občina Žirovnica (podatki: JEKO Jesenice).
      <br/><a href="${escapeHtml(unsubscribeUrl)}" style="color:#9fd8ad;">Odjava od obvestil</a></p>
    </div>
  </div></body></html>`;
}

export async function sendReminderMail(params: {
  to: string;
  dateStr: string;
  types: string[];
  note: string | null;
  villageLabel?: string;
  unsubscribeUrl: string;
}): Promise<void> {
  const transporter = getTransporter();
  const kraj = params.villageLabel || 'Smokuč';
  const subject = `Odvoz odpadkov jutri (${formatSlLong(params.dateStr)}) — ${kraj}`;
  await transporter.sendMail({
    from: fromAddress(),
    to: params.to,
    subject,
    text: `Jutri, ${formatSlLong(params.dateStr)}, je v kraju ${kraj} odvoz: ${params.types.map(wasteLabel).join(', ')}.${params.note ? ` Opomba: ${params.note}.` : ''} Odjava: ${params.unsubscribeUrl}`,
    html: reminderHtml(params),
    // RFC 8058: odjava z enim klikom neposredno v poštnem odjemalcu
    headers: {
      'List-Unsubscribe': `<${params.unsubscribeUrl}>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    },
  });
}

/** Potrditveno sporočilo (double opt-in). */
export async function sendConfirmMail(params: { to: string; villageLabel: string; confirmUrl: string }): Promise<void> {
  const transporter = getTransporter();
  const { villageLabel, confirmUrl } = params;
  await transporter.sendMail({
    from: fromAddress(),
    to: params.to,
    subject: `Potrdi prijavo na obvestila o odvozu — ${villageLabel}`,
    text: `Prejeli smo prošnjo za e-poštna obvestila o odvozu odpadkov za kraj ${villageLabel} (občina Žirovnica). Prijavo potrdiš s klikom na povezavo: ${confirmUrl}\n\nČe prijave nisi zahteval/a ti, sporočilo preprosto ignoriraj — brez potrditve ne bomo poslali ničesar.`,
    html: `<!doctype html><html lang="sl"><body style="margin:0;padding:0;background:#0e1f16;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:24px;">
    <div style="background:#10321f;border:1px solid #1f4a30;border-radius:20px;padding:28px;color:#eaf5ec;">
      <h1 style="font-size:24px;margin:0 0 12px;color:#ffffff;">Potrdi prijavo</h1>
      <p style="font-size:15px;color:#c9e6cf;line-height:1.5;">Prejeli smo prošnjo za e-poštna obvestila o odvozu odpadkov za kraj <strong>${escapeHtml(villageLabel)}</strong> (občina Žirovnica).</p>
      <p style="margin:22px 0;"><a href="${escapeHtml(confirmUrl)}" style="background:#a3e635;color:#10321f;text-decoration:none;font-weight:700;padding:13px 24px;border-radius:999px;display:inline-block;">Potrdi prijavo</a></p>
      <p style="font-size:12px;color:#7fa486;line-height:1.5;">Če prijave nisi zahteval/a ti, sporočilo ignoriraj — brez potrditve ne bomo poslali ničesar.</p>
    </div>
  </div></body></html>`,
  });
}

export async function sendTestMail(to: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const transporter = getTransporter();
    await transporter.sendMail({
      from: fromAddress(),
      to,
      subject: 'Testno sporočilo — Koledar odvoza, občina Žirovnica',
      text: 'Pošiljanje e-pošte deluje. Obvestila o odvozu bodo prispela dan pred odvozom ob nastavljeni uri.',
      html: '<div style="font-family:Arial;padding:20px;background:#10321f;color:#eaf5ec;border-radius:16px;"><h2 style="color:#fff;margin:0 0 8px;">Test uspel ✓</h2><p style="margin:0;color:#c9e6cf;">Pošiljanje e-pošte deluje. Obvestila o odvozu bodo prispela dan pred odvozom ob nastavljeni uri.</p></div>',
    });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
