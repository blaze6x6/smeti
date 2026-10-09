'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Check, FileUp, Inbox, ListChecks, Loader2, LogOut, MailPlus, Plus,
  Pencil, Send, Settings2, Sparkles, Trash2, Users, Wand2, X,
} from 'lucide-react';
import { COLLECTED_TYPES, wasteColor, wasteLabel } from '@/lib/waste';
import { DAY_NAMES, DEFAULT_VILLAGE, VILLAGES, getVillage, villageName } from '@/lib/villages';
import { DAYS_SL, formatSlDay, formatSlNumeric, parseSlDate, weekdayOf } from '@/lib/dates';

/* ------------------------------ tipi ------------------------------ */

type Ev = { date: string; types: string[]; note: string | null };
type Cell = { date: string; col: number; type: string };
type PerVillage = { id: string; name: string; count: number };
type EvRow = Ev & { id?: number };
type Sub = { id: number; email: string; village: string; active: boolean; confirmed?: boolean; createdAt: string };
type Settings = { notifyEnabled: boolean; notifyTime: string; daysBefore: number; lastRunDate: string };
type SmtpInfo = { configured: boolean; host: string; port: string; user: string; from: string };
type SentLog = { id: number; sentAt: string; targetDate: string; village: string; recipients: number; types: string[]; status: string; error: string | null };
type ImportLog = { id: number; year: number; filename: string | null; method: string; eventsCount: number; createdAt: string };

const TABS = [
  { id: 'uvoz', label: 'Uvoz PDF', icon: FileUp },
  { id: 'dogodki', label: 'Dogodki', icon: ListChecks },
  { id: 'narocniki', label: 'Naročniki', icon: Users },
  { id: 'nastavitve', label: 'Nastavitve', icon: Settings2 },
  { id: 'dnevnik', label: 'Dnevnik', icon: Inbox },
] as const;

type TabId = (typeof TABS)[number]['id'];

/* ------------------------------ pomožni ------------------------------ */

function Chip({ id, active, onClick }: { id: string; active: boolean; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold border transition-all ${
        active ? 'border-transparent' : 'border-paper-200 bg-transparent opacity-45 hover:opacity-80'
      }`}
      style={active ? { background: wasteColor(id), color: id === 'embalaza' || id === 'steklo' ? '#1d2321' : '#fff' } : { color: wasteColor(id) }}
    >
      {wasteLabel(id)}
      {active ? <Check className="w-3.5 h-3.5" /> : null}
    </button>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs uppercase tracking-wider text-ink-soft/80 mb-1.5">{label}</span>
      {children}
    </label>
  );
}

/** Vnos datuma v slovenskem zapisu (»5. 1. 2026«) z izpisom dneva v tednu. */
function SlDateInput({ value, onChange, className }: { value: string; onChange: (iso: string) => void; className?: string }) {
  const [text, setText] = useState(value ? formatSlNumeric(value) : '');
  const [bad, setBad] = useState(false);

  useEffect(() => {
    // zunanja sprememba (npr. nov izbor vrstice) — ne povozi tipkanja, ki že pomeni isti datum
    if (parseSlDate(text) !== value) {
      setText(value ? formatSlNumeric(value) : '');
      setBad(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div className="inline-flex flex-col">
      <input
        inputMode="numeric"
        placeholder="d. m. llll"
        value={text}
        aria-invalid={bad}
        onChange={(e) => {
          setText(e.target.value);
          const iso = parseSlDate(e.target.value);
          setBad(false);
          if (iso) onChange(iso);
        }}
        onBlur={() => {
          const iso = parseSlDate(text);
          if (iso) setText(formatSlNumeric(iso));
          else setBad(text.trim() !== '');
        }}
        className={`${className ?? ''} w-36 rounded-xl border bg-white px-3 py-2.5 text-ink min-h-[44px] focus:outline-none ${bad ? 'border-red-400' : 'border-paper-200 focus:border-lime-400'}`}
      />
      <span className={`mt-0.5 text-[11px] ${bad ? 'text-red-500' : 'text-ink-soft/70'}`}>
        {bad ? 'Neveljaven datum (npr. 5. 1. 2026)' : value && parseSlDate(text) === value ? DAYS_SL[weekdayOf(value)] : '\u00a0'}
      </span>
    </div>
  );
}

const inputCls =
  'w-full rounded-xl border border-paper-200 bg-white px-3.5 py-3 text-base text-ink focus:outline-none focus:border-lime-400 min-h-[48px]';
const btnCls =
  'inline-flex items-center justify-center gap-2 rounded-full bg-lime-400 px-5 py-3 font-semibold text-pine-950 hover:bg-lime-300 active:scale-[0.98] transition-all disabled:opacity-50 min-h-[48px]';
const ghostBtnCls =
  'inline-flex items-center justify-center gap-2 rounded-full border border-paper-300 px-5 py-3 font-medium text-ink hover:bg-paper-100 active:scale-[0.98] transition-all disabled:opacity-50 min-h-[48px]';

const COLOR_GUESS: Record<string, string> = {
  '#3ca849': 'mesani', '#48a848': 'mesani', '#efc01a': 'embalaza', '#f8e838': 'embalaza',
};

/* ------------------------------ stran ------------------------------ */

export default function AdminPage() {
  const [tab, setTab] = useState<TabId>('uvoz');
  const [notice, setNotice] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [subs, setSubs] = useState<Sub[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [smtp, setSmtp] = useState<SmtpInfo | null>(null);
  const [logs, setLogs] = useState<SentLog[]>([]);
  const [imports, setImports] = useState<ImportLog[]>([]);
  const [years, setYears] = useState<number[]>([]);
  const [auth, setAuth] = useState<{ enabled: boolean; signedIn: boolean } | null>(null);

  const say = useCallback((kind: 'ok' | 'err', text: string) => {
    setNotice({ kind, text });
    setTimeout(() => setNotice(null), 6000);
  }, []);

  const reloadMeta = useCallback(async () => {
    const [sRes, subRes, logRes, schRes, authRes] = await Promise.all([
      fetch('/api/admin/settings').then((r) => r.json()),
      fetch('/api/admin/subscribers').then((r) => r.json()),
      fetch('/api/admin/logs').then((r) => r.json()),
      fetch('/api/schedule').then((r) => r.json()).catch(() => ({ years: [] })),
      fetch('/api/admin/auth').then((r) => r.json()).catch(() => ({ enabled: false, signedIn: true })),
    ]);
    setSettings(sRes.settings);
    setSmtp(sRes.smtp);
    setSubs(subRes.subscribers ?? []);
    setLogs(logRes.logs ?? []);
    setImports(logRes.imports ?? []);
    setYears(schRes.years ?? []);
    setAuth({ enabled: Boolean(authRes.enabled), signedIn: Boolean(authRes.signedIn) });
  }, []);

  useEffect(() => {
    reloadMeta().catch(() => undefined);
  }, [reloadMeta]);

  return (
    <main className="min-h-screen pb-24">
      <header className="sticky top-0 z-40 bg-paper-50/85 backdrop-blur-md border-b border-paper-200">
        <div className="safe-x mx-auto max-w-6xl flex items-center gap-3 h-16">
          <Link href="/" className={ghostBtnCls + ' !min-h-[40px] !px-4 !py-2 text-sm'}>
            <ArrowLeft className="w-4 h-4" /> Koledar
          </Link>
          <h1 className="font-display text-xl text-ink ml-1">Zaledje</h1>
          <span className="ml-auto text-[11px] text-ink-soft/60 hidden sm:block"></span>
        </div>
      </header>

      {notice && (
        <div className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-50 rounded-full px-5 py-3 text-sm font-medium shadow-2xl ${
          notice.kind === 'ok' ? 'bg-lime-300 text-pine-950' : 'bg-red-300 text-red-950'
        }`}>
          {notice.text}
        </div>
      )}

      {(() => {
        const now = new Date();
        const needed = now.getMonth() >= 9 ? now.getFullYear() + 1 : now.getFullYear();
        if (!years.length || years.includes(needed)) return null;
        return (
          <div className="safe-x mx-auto max-w-6xl mt-4">
            <div className="rounded-2xl border border-amber-400/60 bg-amber-100 text-amber-900 px-4 py-3 text-sm font-medium">
              Za leto {needed} v koledarju še ni podatkov. Ko JEKO objavi PDF koledar, ga uvozi v zavihku »Uvoz PDF«.
            </div>
          </div>
        );
      })()}

      {/* statistika */}
      <div className="safe-x mx-auto max-w-6xl grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6">
        {[
          { label: 'aktivnih naročnikov', value: String(subs.filter((s) => s.active).length), icon: Users },
          { label: 'krajev / let', value: `${VILLAGES.length} · ${years.length ? years.join(', ') : '—'}`, icon: ListChecks },
          { label: 'obvestila', value: settings ? (settings.notifyEnabled ? `vklop · ${settings.notifyTime}` : 'izklop') : '…', icon: MailPlus },
          { label: 'SMTP', value: smtp ? (smtp.configured ? 'nastavljen ✓' : 'ni nastavljen') : '…', icon: Settings2 },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-paper-200 bg-card p-4">
            <s.icon className="w-4 h-4 text-ink-soft/70 mb-2" />
            <div className="text-lg sm:text-xl font-semibold text-ink leading-tight">{s.value}</div>
            <div className="text-[11px] uppercase tracking-wider text-ink-soft/60 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* zavihki */}
      <div className="safe-x mx-auto max-w-6xl mt-6">
        <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`inline-flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2.5 text-sm font-medium transition-colors min-h-[44px] ${
                tab === t.id ? 'bg-lime-300 text-pine-950' : 'bg-card text-ink-soft hover:bg-paper-100'
              }`}
            >
              <t.icon className="w-4 h-4" /> {t.label}
            </button>
          ))}
        </div>

        <div className="mt-5">
          {tab === 'uvoz' && <ImportTab say={say} onSaved={reloadMeta} years={years} />}
          {tab === 'dogodki' && <EventsTab say={say} years={years} onChanged={reloadMeta} />}
          {tab === 'narocniki' && <SubsTab subs={subs} say={say} onChanged={reloadMeta} />}
          {tab === 'nastavitve' && <SettingsTab settings={settings} smtp={smtp} say={say} onChanged={reloadMeta} />}
          {tab === 'dnevnik' && <LogsTab logs={logs} imports={imports} />}
        </div>
      </div>
    </main>
  );
}

/* ============================ UVOZ PDF ============================ */

function ImportTab({ say, onSaved, years }: { say: (k: 'ok' | 'err', t: string) => void; onSaved: () => void; years: number[] }) {
  const thisYear = new Date().getFullYear();
  const [year, setYear] = useState(thisYear + 1 > thisYear ? thisYear : thisYear);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [saveBusy, setSaveBusy] = useState(false);
  const [method, setMethod] = useState<string | null>(null);
  const [cellsCount, setCellsCount] = useState(0);
  const [colors, setColors] = useState<string[]>([]);
  const [colorMap, setColorMap] = useState<Record<string, string>>({});
  const [rows, setRows] = useState<EvRow[]>([]);
  const [cells, setCells] = useState<Cell[]>([]);
  const [perVillage, setPerVillage] = useState<PerVillage[]>([]);
  const [previewVillage, setPreviewVillage] = useState(DEFAULT_VILLAGE);
  const [replace, setReplace] = useState(true);

  const [genStartType, setGenStartType] = useState('mesani');
  const [genFirstMonday, setGenFirstMonday] = useState('');

  const parse = async () => {
    if (!file) {
      say('err', 'Najprej izberi PDF datoteko.');
      return;
    }
    setBusy(true);
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('year', String(year));
      form.append('kraj', previewVillage);
      const res = await fetch('/api/admin/parse-pdf', { method: 'POST', body: form });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || 'Uvoz ni uspel.');
      setMethod(data.method);
      setCellsCount(data.cellsCount);
      setColors(data.colors);
      setColorMap(data.colorMap);
      setRows(data.events);
      setCells(data.cells ?? []);
      setPerVillage(data.perVillage ?? []);
      if (!data.events.length) {
        say('err', 'V PDF-ju ni bilo mogoče zaznati obarvanih ponedeljkov. Poskusi generator ali ročni vnos spodaj.');
      } else {
        say('ok', `Zaznanih ${data.cellsCount} označenih celic (${data.method === 'vector' ? 'vektorski PDF' : 'skeniran PDF'}) → urnik za vse kraje v občini.`);
      }
    } catch (e) {
      say('err', e instanceof Error ? e.message : 'Napaka pri uvozu.');
    } finally {
      setBusy(false);
    }
  };

  const generateAlternating = () => {
    const first = genFirstMonday ? new Date(`${genFirstMonday}T00:00:00Z`) : new Date(Date.UTC(year, 0, 1));
    // najdi ponedeljek
    while (first.getUTCDay() !== 1) first.setUTCDate(first.getUTCDate() + 1);
    const out: EvRow[] = [];
    let i = 0;
    for (const d = new Date(first); d.getUTCFullYear() <= year; d.setUTCDate(d.getUTCDate() + 7)) {
      if (d.getUTCFullYear() < year) { i++; continue; }
      out.push({
        date: d.toISOString().slice(0, 10),
        types: [i % 2 === 0 ? genStartType : genStartType === 'mesani' ? 'embalaza' : 'mesani'],
        note: null,
      });
      i++;
    }
    setRows((prev) => {
      const map = new Map<string, EvRow>([...prev, ...out].map((e) => [e.date, e]));
      return Array.from(map.values()).sort((a, b) => (a.date < b.date ? -1 : 1));
    });
    // generator ustvari celice za vse tri relacije (po, to, sr) istega tedna
    setCells(out.flatMap((e) => {
      const [yy, mm, dd] = e.date.split('-').map(Number);
      return [0, 1, 2].map((off) => {
        const d = new Date(Date.UTC(yy, mm - 1, dd + off));
        return { date: d.toISOString().slice(0, 10), col: off, type: e.types[0] };
      });
    }));
    setMethod('generator');
    say('ok', `Generiranih ${out.length} izmeničnih ponedeljkov (od ${out[0]?.date} — ${out[0]?.types[0] === 'mesani' ? 'mešani' : 'embalaža'}). Preveri in shrani.`);
  };

  const save = async () => {
    setSaveBusy(true);
    try {
      const res = await fetch('/api/admin/events', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ year, cells, replace, method: method || 'manual', filename: file?.name ?? null }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || 'Shranjevanje ni uspelo.');
      say('ok', `Shranjeno: ${data.saved} dogodkov za ${data.villages} krajev (leto ${year}).`);
      onSaved();
    } catch (e) {
      say('err', e instanceof Error ? e.message : 'Napaka.');
    } finally {
      setSaveBusy(false);
    }
  };

  return (
    <section className="space-y-4">
      <div className="rounded-3xl border border-paper-200 bg-card p-5 sm:p-7">
        <h2 className="font-display text-2xl text-ink mb-1">Uvoz koledarja iz PDF-ja</h2>
        <p className="text-sm text-ink-soft/70 mb-5">
          Naloži uradni PDF koledar JEKO (Žirovnica). Sistem samodejno prebere obarvane celice
          (vektorski ali skeniran PDF) in pripravi urnik ponedeljkov za Smokuč.
        </p>
        <div className="grid sm:grid-cols-[10rem_1fr_auto] gap-3 items-end">
          <Field label="Leto">
            <input type="number" value={year} onChange={(e) => setYear(parseInt(e.target.value, 10) || thisYear)} className={inputCls} />
          </Field>
          <Field label="PDF datoteka">
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className={inputCls + ' file:mr-3 file:rounded-full file:border-0 file:bg-paper-200 file:px-3.5 file:py-1.5 file:text-xs file:text-ink'}
            />
          </Field>
          <button onClick={parse} disabled={busy} className={btnCls}>
            {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
            Preberi PDF
          </button>
        </div>

        {method && (
          <div className="mt-4 text-xs text-ink-soft/80">
            Metoda: <strong>{method === 'vector' ? 'vektorski PDF (avtomatsko branje besedila in barv)' : method === 'raster' ? 'skeniran PDF (analiza pikslov)' : method}</strong>
            {cellsCount ? ` · ${cellsCount} označenih celic` : ''}
          </div>
        )}

        {colors.length > 0 && (
          <div className="mt-4 rounded-2xl border border-paper-200 bg-white/60 p-4">
            <p className="text-xs uppercase tracking-wider text-ink-soft/80 mb-3">Kaj pomenijo zaznane barve?</p>
            <div className="flex flex-wrap gap-3">
              {colors.map((c) => (
                <label key={c} className="flex items-center gap-2 text-sm">
                  <span className="inline-block w-6 h-6 rounded-lg border border-white/20" style={{ background: c }} />
                  <select
                    value={colorMap[c] ?? ''}
                    onChange={(e) => setColorMap((m) => ({ ...m, [c]: e.target.value }))}
                    className="rounded-lg border border-paper-200 bg-paper-50 px-2.5 py-1.5 text-ink"
                  >
                    <option value="">— ne uporabi —</option>
                    <option value="mesani">Mešani odpadki</option>
                    <option value="embalaza">Embalaža</option>
                  </select>
                </label>
              ))}
            </div>
            <button
              onClick={() => {
                // ponovno gradi urnik iz celic ni mogoč (celice so na strežniku) — znova preberi PDF z novim mapiranjem
                parse();
              }}
              className={ghostBtnCls + ' mt-3 !min-h-[40px] !px-4 !py-2 text-xs'}
            >
              Uporabi preslikavo in znova preberi
            </button>
          </div>
        )}
      </div>

      {/* generator izmeničnega urnika */}
      <div className="rounded-3xl border border-paper-200 bg-card p-5 sm:p-7">
        <h3 className="font-display text-xl text-ink mb-1 flex items-center gap-2"><Wand2 className="w-5 h-5 text-ink-soft" /> Generator izmeničnega urnika</h3>
        <p className="text-sm text-ink-soft/70 mb-4">
          JEKO Žirovnica odvaža izmenično: en ponedeljek mešane odpadke, drugi embalažo.
          Če avtomatski uvoz ne uspe, izberi prvi ponedeljek in frakcijo — urediš pa lahko vsako vrstico posebej.
        </p>
        <div className="grid sm:grid-cols-[1fr_1fr_auto] gap-3 items-end">
          <Field label="Prvi ponedeljek z odvozom">
            <SlDateInput value={genFirstMonday} onChange={setGenFirstMonday} />
          </Field>
          <Field label="Frakcija na prvi ponedeljek">
            <select value={genStartType} onChange={(e) => setGenStartType(e.target.value)} className={inputCls}>
              <option value="mesani">Mešani odpadki</option>
              <option value="embalaza">Embalaža</option>
            </select>
          </Field>
          <button onClick={generateAlternating} className={ghostBtnCls}>
            <Wand2 className="w-4 h-4" /> Generiraj {year}
          </button>
        </div>
      </div>

      {/* predogled + urejanje */}
      <div className="rounded-3xl border border-paper-200 bg-card p-5 sm:p-7">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <h3 className="font-display text-xl text-ink">Predogled urnika {year}</h3>
          <span className="text-xs text-ink-soft/70">{rows.length} dogodkov</span>
          <label className="ml-auto inline-flex items-center gap-2 text-sm text-ink-soft">
            <input type="checkbox" checked={replace} onChange={(e) => setReplace(e.target.checked)} className="w-4 h-4 accent-lime-500" />
            prepiši obstoječe za {year}
          </label>
          <button onClick={save} disabled={saveBusy || !cells.length} className={btnCls}>
            {saveBusy ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
            Shrani v koledar
          </button>
        </div>
        {perVillage.length > 0 && (
          <div className="mb-4 rounded-2xl border border-paper-200 bg-white/60 p-4">
            <p className="text-xs uppercase tracking-wider text-ink-soft mb-2">Število odvozov po krajih (shranijo se vsi)</p>
            <div className="flex flex-wrap gap-1.5">
              {perVillage.map((p) => (
                <span key={p.id} className="text-[11px] rounded-full bg-paper-100 border border-paper-200 px-2.5 py-1 text-ink-soft">
                  {p.name}: <strong className="text-ink">{p.count}</strong>
                </span>
              ))}
            </div>
          </div>
        )}
        <p className="text-xs text-ink-soft/70 mb-2">
          Predogled prikazuje urnik za izbrani kraj. Po shranjevanju lahko vsak dogodek (datum, frakcijo, opombo)
          popraviš ali dodaš v zavihku »Dogodki«.
        </p>
        {rows.length === 0 ? (
          <p className="text-sm text-ink-soft/60 mt-4">Ni vrstic — preberi PDF, generiraj urnik ali dodaj dogodek ročno.</p>
        ) : (
          <ul className="mt-4 divide-y divide-paper-200 max-h-[480px] overflow-y-auto pr-1">
            {rows.map((r) => (
              <li key={r.date} className="py-2.5 flex flex-wrap items-center gap-2">
                <span className="w-36 font-medium text-ink text-sm">{formatSlDay(r.date)}</span>
                <div className="flex gap-1.5 flex-wrap">
                  {r.types.map((t) => <Chip key={t} id={t} active />)}
                </div>
                {r.note && <span className="text-xs text-ink-soft">{r.note}</span>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function ManualAdd({ villageLabel, onAdd }: { villageLabel: string; onAdd: (ev: Ev) => Promise<boolean> }) {
  const [date, setDate] = useState('');
  const [types, setTypes] = useState<string[]>(['mesani']);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  return (
    <div className="flex flex-wrap items-start gap-2 rounded-2xl border border-paper-200 bg-white/60 p-3 mb-4">
      <SlDateInput value={date} onChange={setDate} />
      <div className="flex gap-1.5 pt-1.5">
        {COLLECTED_TYPES.map((t) => (
          <Chip key={t} id={t} active={types.includes(t)} onClick={() => setTypes((p) => (p.includes(t) ? p.filter((x) => x !== t) : [...p, t]))} />
        ))}
      </div>
      <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="opomba (npr. praznik)" className="flex-1 min-w-[120px] rounded-xl border border-paper-200 bg-white px-3 py-2.5 text-sm text-ink min-h-[44px]" />
      <button
        disabled={busy || !date || !types.length}
        onClick={async () => {
          setBusy(true);
          const ok = await onAdd({ date, types, note: note || null });
          setBusy(false);
          if (ok) {
            setDate('');
            setNote('');
          }
        }}
        className={ghostBtnCls + ' !min-h-[44px] !px-4 !py-2 text-sm'}
        title={`Doda dogodek za kraj ${villageLabel}`}
      >
        <Plus className="w-4 h-4" /> Dodaj ({villageLabel})
      </button>
    </div>
  );
}

/* ============================ DOGODKI ============================ */

function EventsTab({ say, years, onChanged }: { say: (k: 'ok' | 'err', t: string) => void; years: number[]; onChanged: () => void }) {
  const current = new Date().getFullYear();
  const [year, setYear] = useState(years[years.length - 1] ?? current);
  const [village, setVillage] = useState(DEFAULT_VILLAGE);
  const [rows, setRows] = useState<EvRow[]>([]);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async (y: number, v: string) => {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/events?leto=${y}&kraj=${v}`);
      const data = await res.json();
      setRows((data.events ?? []).map((e: EvRow & { village?: string; source?: string; id: number }) => ({ id: e.id, date: e.date, types: e.types, note: e.note })));
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    load(year, village).catch(() => undefined);
  }, [year, village, load]);

  const del = async (id?: number, allForYear?: boolean) => {
    if (allForYear && !confirm(`Res izbrišeš VSE dogodke za ${year} (vsi kraji)?`)) return;
    const url = allForYear ? `/api/admin/events?leto=${year}` : id ? `/api/admin/events?id=${id}` : null;
    if (!url) return;
    await fetch(url, { method: 'DELETE' });
    say('ok', 'Izbrisano.');
    load(year, village);
    onChanged();
  };

  const [editId, setEditId] = useState<number | null>(null);
  const [draft, setDraft] = useState<Ev>({ date: '', types: [], note: null });
  const [alsoSame, setAlsoSame] = useState(true);
  const [saving, setSaving] = useState(false);

  const startEdit = (r: EvRow) => {
    setEditId(r.id ?? null);
    setDraft({ date: r.date, types: r.types, note: r.note });
  };

  const saveEdit = async () => {
    if (!editId) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/events', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id: editId, ...draft, alsoSame }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || 'Shranjevanje ni uspelo.');
      say('ok', data.changed > 1 ? `Popravljeno v ${data.changed} krajih.` : 'Popravljeno.');
      setEditId(null);
      await load(year, village);
      onChanged();
    } catch (e) {
      say('err', e instanceof Error ? e.message : 'Napaka.');
    } finally {
      setSaving(false);
    }
  };

  const addOne = async (ev: Ev): Promise<boolean> => {
    const res = await fetch('/api/admin/events/item', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ village, ...ev }),
    });
    const data = await res.json();
    if (!data.ok) {
      say('err', data.error || 'Napaka.');
      return false;
    }
    say('ok', `Dodano za kraj ${villageName(village)}.`);
    const y = Number(ev.date.slice(0, 4));
    if (y !== year) setYear(y);
    else await load(year, village);
    onChanged();
    return true;
  };

  const v = getVillage(village);

  return (
    <section className="rounded-3xl border border-paper-200 bg-card p-5 sm:p-7">
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <h2 className="font-display text-2xl text-ink">Dogodki v koledarju</h2>
        <select
          value={village}
          onChange={(e) => setVillage(e.target.value)}
          className={inputCls + ' !w-auto !min-h-[44px] !py-2 ml-auto'}
        >
          {VILLAGES.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
        </select>
        <select value={year} onChange={(e) => setYear(parseInt(e.target.value, 10))} className={inputCls + ' !w-auto !min-h-[44px] !py-2 ml-auto'}>
          {(years.length ? years : [current]).map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
        <button onClick={() => del(undefined, true)} className={ghostBtnCls + ' !min-h-[44px] !px-4 !py-2 text-sm !border-red-400/40 !text-red-200 hover:!bg-red-500/10'}>
          <Trash2 className="w-4 h-4" /> Izbriši vse za {year}
        </button>
      </div>
      <p className="text-xs text-ink-soft/70 mb-3">
        Urnik za <strong>{v.name}</strong>: mešani odpadki ob {DAY_NAMES[v.days.mesani]}h, embalaža ob {DAY_NAMES[v.days.embalaza]}h.
        Dogodke, ki niso na običajni dan (zamik), označi rumena oznaka — popravi jih s svinčnikom.
      </p>
      <ManualAdd villageLabel={v.name} onAdd={addOne} />
      {busy ? (
        <div className="py-10 grid place-items-center"><Loader2 className="w-6 h-6 animate-spin text-ink-soft" /></div>
      ) : rows.length === 0 ? (
        <p className="text-sm text-ink-soft/60">Ni dogodkov — uvozi PDF v zavihku »Uvoz PDF« ali dodaj dogodek zgoraj.</p>
      ) : (
        <ul className="divide-y divide-paper-200 max-h-[520px] overflow-y-auto pr-1">
          {rows.map((r) => {
            const col = (weekdayOf(r.date) + 6) % 7;
            const expected: number[] = Array.from(new Set<number>(r.types.map((t): number => (t === 'embalaza' ? v.days.embalaza : v.days.mesani))));
            const unusual = !expected.includes(col) && !r.note;
            if (editId !== null && r.id === editId) {
              return (
                <li key={r.id} className="py-3 space-y-2.5 bg-lime-400/10 -mx-2 px-2 rounded-xl">
                  <div className="flex flex-wrap items-start gap-2">
                    <SlDateInput value={draft.date} onChange={(iso) => setDraft((d) => ({ ...d, date: iso }))} />
                    <div className="flex gap-1.5 pt-1.5">
                      {COLLECTED_TYPES.map((t) => (
                        <Chip
                          key={t}
                          id={t}
                          active={draft.types.includes(t)}
                          onClick={() => setDraft((d) => ({ ...d, types: d.types.includes(t) ? d.types.filter((x) => x !== t) : [...d.types, t] }))}
                        />
                      ))}
                    </div>
                    <input
                      value={draft.note ?? ''}
                      onChange={(e) => setDraft((d) => ({ ...d, note: e.target.value || null }))}
                      placeholder="opomba (npr. praznik)"
                      className="flex-1 min-w-[140px] rounded-xl border border-paper-200 bg-white px-3 py-2.5 text-sm text-ink min-h-[44px]"
                    />
                  </div>
                  <label className="flex items-center gap-2 text-xs text-ink-soft">
                    <input type="checkbox" checked={alsoSame} onChange={(e) => setAlsoSame(e.target.checked)} className="w-4 h-4 accent-lime-500" />
                    Enako popravi tudi v drugih krajih, ki imajo na {formatSlDay(r.date)} isti odvoz
                  </label>
                  <div className="flex gap-2">
                    <button onClick={saveEdit} disabled={saving || !draft.date || !draft.types.length} className={btnCls + ' !min-h-[40px] !px-4 !py-2 text-sm'}>
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Shrani
                    </button>
                    <button onClick={() => setEditId(null)} className={ghostBtnCls + ' !min-h-[40px] !px-4 !py-2 text-sm'}>
                      <X className="w-4 h-4" /> Prekliči
                    </button>
                  </div>
                </li>
              );
            }
            return (
              <li key={r.id} className="py-2.5 flex flex-wrap items-center gap-2 text-sm">
                <span className="w-36 font-medium text-ink">{formatSlDay(r.date)}</span>
                <span className="flex gap-1.5 flex-wrap">
                  {r.types.map((t) => <Chip key={t} id={t} active />)}
                </span>
                {r.note && <span className="text-xs text-waste-embalaza/90">{r.note}</span>}
                {unusual && (
                  <span className="text-[11px] rounded-full bg-amber-100 text-amber-900 border border-amber-400/60 px-2 py-0.5" title="Datum ni na običajni dan odvoza za ta kraj">
                    ni {expected.map((e) => DAY_NAMES[e]).join('/')}
                  </span>
                )}
                <button onClick={() => startEdit(r)} className="ml-auto p-2 text-ink-soft/60 hover:text-ink" aria-label={`Uredi ${formatSlDay(r.date)}`}>
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => del(r.id)} className="p-2 text-ink-soft/60 hover:text-red-300" aria-label="Izbriši">
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

/* ============================ NAROČNIKI ============================ */

function SubsTab({ subs, say, onChanged }: { subs: Sub[]; say: (k: 'ok' | 'err', t: string) => void; onChanged: () => void }) {
  const [email, setEmail] = useState('');
  const [village, setVillage] = useState(DEFAULT_VILLAGE);
  const [busy, setBusy] = useState(false);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch('/api/admin/subscribers', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, village }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || 'Napaka.');
      setEmail('');
      say('ok', `${email} dodan za kraj ${villageName(village)}.`);
      onChanged();
    } catch (err) {
      say('err', err instanceof Error ? err.message : 'Napaka.');
    } finally {
      setBusy(false);
    }
  };

  const del = async (id: number, mail: string) => {
    if (!confirm(`Odstranim ${mail} iz naročnikov?`)) return;
    await fetch(`/api/admin/subscribers?id=${id}`, { method: 'DELETE' });
    say('ok', 'Odstranjeno.');
    onChanged();
  };

  return (
    <section className="rounded-3xl border border-paper-200 bg-card p-5 sm:p-7">
      <h2 className="font-display text-2xl text-ink mb-1">Naročniki na obvestila</h2>
      <p className="text-sm text-ink-soft/70 mb-5">Ti naslovi dobijo e-pošto dan pred odvozom (ob nastavljeni uri).</p>
      <form onSubmit={add} className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="ime.priimek@posta.si"
          className={inputCls + ' flex-1'}
        />
        <select value={village} onChange={(e) => setVillage(e.target.value)} className={inputCls + ' sm:!w-56'}>
          {VILLAGES.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
        </select>
        <button disabled={busy} className={btnCls}>
          {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
          Dodaj naslov
        </button>
      </form>
      {subs.length === 0 ? (
        <p className="text-sm text-ink-soft/60">Še ni naročnikov.</p>
      ) : (
        <ul className="divide-y divide-paper-200">
          {subs.map((s) => (
            <li key={s.id} className="py-3 flex items-center gap-3">
              <span className={`w-2 h-2 rounded-full ${s.active ? 'bg-lime-400' : 'bg-paper-300'}`} />
              <span className="text-ink">{s.email}</span>
              {!s.active && <span className="text-[11px] text-ink-soft/60">{s.confirmed === false ? '(čaka na potrditev)' : '(odjavljen)'}</span>}
              <span className="ml-auto text-xs text-ink-soft/50 hidden sm:block">{new Date(s.createdAt).toLocaleDateString('sl-SI')}</span>
              <button onClick={() => del(s.id, s.email)} className="p-2 text-ink-soft/60 hover:text-red-300" aria-label={`Odstrani ${s.email}`}>
                <X className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/* ============================ NASTAVITVE ============================ */

function SettingsTab({ settings, smtp, say, onChanged }: { settings: Settings | null; smtp: SmtpInfo | null; say: (k: 'ok' | 'err', t: string) => void; onChanged: () => void }) {
  const [enabled, setEnabled] = useState(true);
  const [time, setTime] = useState('18:00');
  const [testTo, setTestTo] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (settings) {
      setEnabled(settings.notifyEnabled);
      setTime(settings.notifyTime);
    }
  }, [settings]);

  const save = async () => {
    setBusy(true);
    try {
      await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ notifyEnabled: enabled, notifyTime: time, daysBefore: 1 }),
      });
      say('ok', 'Nastavitve shranjene.');
      onChanged();
    } finally {
      setBusy(false);
    }
  };

  const sendTest = async (mode: 'test' | 'remind') => {
    setBusy(true);
    try {
      const res = await fetch('/api/admin/test-email', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(mode === 'test' ? { email: testTo, mode } : { mode }),
      });
      const data = await res.json();
      if (mode === 'test') {
        if (data.ok) say('ok', `Testno sporočilo poslano na ${testTo}.`);
        else say('err', data.error || 'Pošiljanje ni uspelo.');
      } else {
        say(data.ok ? 'ok' : 'err', data.ok ? `Obvestilo za jutri poslano (${data.result?.sent ?? 0} prejemnikov).` : `Ni poslano: ${data.result?.reason ?? 'neznano'}`);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="space-y-4">
      <div className="rounded-3xl border border-paper-200 bg-card p-5 sm:p-7">
        <h2 className="font-display text-2xl text-ink mb-5">Obvestila po e-pošti</h2>
        <div className="grid sm:grid-cols-2 gap-4 max-w-xl">
          <label className="flex items-center gap-3 rounded-2xl border border-paper-200 bg-white/60 p-4">
            <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} className="w-5 h-5 accent-lime-500" />
            <span className="text-ink font-medium">Pošiljanje obvestil vklopljeno</span>
          </label>
          <Field label="Ura pošiljanja (dan pred odvozom)">
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className={inputCls} />
          </Field>
        </div>
        <p className="text-sm text-ink-soft/70 mt-3">
          Obvestilo se pošlje <strong>1 dan pred odvozom</strong> (ponedeljski odvoz → nedelja ob {time}), vsem aktivnim naročnikom.
          Pogon teče samodejno znotraj aplikacije; dodatno je na voljo tudi <code className="text-ink-soft">/api/cron/daily</code> za zunanji urnik.
        </p>
        <div className="mt-5 flex gap-3">
          <button onClick={save} disabled={busy} className={btnCls}>
            {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
            Shrani nastavitve
          </button>
        </div>
      </div>

      <div className="rounded-3xl border border-paper-200 bg-card p-5 sm:p-7">
        <h3 className="font-display text-xl text-ink mb-3">SMTP (nodemailer)</h3>
        {smtp?.configured ? (
          <p className="text-sm text-ink-soft/80">
            Strežnik: <strong>{smtp.host}:{smtp.port}</strong> · uporabnik: <strong>{smtp.user}</strong> · pošiljatelj: <strong>{smtp.from || '(iz uporabnika)'}</strong>
          </p>
        ) : (
          <p className="text-sm text-waste-embalaza/90">
            SMTP ni nastavljen. V docker-compose.yml / .env nastavi SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS (in po želji SMTP_FROM, SMTP_SECURE).
          </p>
        )}
        <div className="mt-4 grid sm:grid-cols-[1fr_auto_auto] gap-3 items-end">
          <Field label="Testni naslov">
            <input type="email" value={testTo} onChange={(e) => setTestTo(e.target.value)} placeholder="kam.naj.gre@test.si" className={inputCls} />
          </Field>
          <button onClick={() => sendTest('test')} disabled={busy || !testTo} className={ghostBtnCls}>
            <Send className="w-4 h-4" /> Pošlji test
          </button>
          <button onClick={() => sendTest('remind')} disabled={busy} className={ghostBtnCls}>
            <MailPlus className="w-4 h-4" /> Sproži obvestilo zdaj
          </button>
        </div>
      </div>
    </section>
  );
}

/* ============================ DNEVNIK ============================ */

function LogsTab({ logs, imports }: { logs: SentLog[]; imports: ImportLog[] }) {
  return (
    <section className="grid lg:grid-cols-2 gap-4">
      <div className="rounded-3xl border border-paper-200 bg-card p-5 sm:p-7">
        <h2 className="font-display text-2xl text-ink mb-4">Poslana obvestila</h2>
        {logs.length === 0 ? (
          <p className="text-sm text-ink-soft/60">Še ni bilo pošiljanj.</p>
        ) : (
          <ul className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
            {logs.map((l) => (
              <li key={l.id} className="rounded-xl border border-paper-200 bg-white/60 p-3 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-ink font-medium">{l.targetDate} · {villageName(l.village)} · {l.types.map(wasteLabel).join(', ')}</span>
                  <span className={`text-[11px] font-bold uppercase px-2 py-0.5 rounded-full ${l.status === 'ok' ? 'bg-lime-400/20 text-ink-soft' : 'bg-red-400/20 text-red-300'}`}>{l.status}</span>
                </div>
                <div className="text-xs text-ink-soft/60 mt-1">
                  {new Date(l.sentAt).toLocaleString('sl-SI')} · {l.recipients} prejemnik{l.recipients === 1 ? '' : l.recipients === 2 ? 'a' : l.recipients === 3 || l.recipients === 4 ? 'i' : 'ov'}
                  {l.error ? <span className="block text-red-300/90 mt-0.5">{l.error}</span> : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="rounded-3xl border border-paper-200 bg-card p-5 sm:p-7">
        <h2 className="font-display text-2xl text-ink mb-4">Uvozi koledarjev</h2>
        {imports.length === 0 ? (
          <p className="text-sm text-ink-soft/60">Še ni uvozov.</p>
        ) : (
          <ul className="space-y-2">
            {imports.map((i) => (
              <li key={i.id} className="rounded-xl border border-paper-200 bg-white/60 p-3 text-sm flex items-center gap-3">
                <span className="font-display text-xl text-ink">{i.year}</span>
                <span>
                  <span className="block text-ink-soft">{i.eventsCount} dogodkov · {i.method}{i.filename ? ` · ${i.filename}` : ''}</span>
                  <span className="block text-xs text-ink-soft/60">{new Date(i.createdAt).toLocaleString('sl-SI')}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
