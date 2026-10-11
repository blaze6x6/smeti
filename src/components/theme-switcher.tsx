'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, Monitor, Moon, Palette, Sun } from 'lucide-react';
import Credit from '@/components/credit';
import { DEFAULT_DARK_THEME, DEFAULT_THEME, THEMES, THEME_STORAGE_KEY, type ThemeInfo } from '@/lib/themes';

const AUTO = 'auto';

function resolve(pref: string): string {
  if (pref === AUTO) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? DEFAULT_DARK_THEME : DEFAULT_THEME;
  }
  return THEMES.some((t) => t.id === pref) ? pref : DEFAULT_THEME;
}

function apply(pref: string) {
  const id = resolve(pref);
  document.documentElement.setAttribute('data-theme', id);
  // barva sistemske vrstice brskalnika / PWA naj sledi temi
  const bg = getComputedStyle(document.documentElement).getPropertyValue('--color-paper-50').trim();
  if (bg) {
    document.querySelectorAll('meta[name="theme-color"]').forEach((m) => m.setAttribute('content', bg));
  }
}

function readPref(): string {
  try {
    return localStorage.getItem(THEME_STORAGE_KEY) || DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}

function Swatch({ t, active, onPick }: { t: ThemeInfo; active: boolean; onPick: () => void }) {
  return (
    <button
      type="button"
      onClick={onPick}
      aria-pressed={active}
      aria-label={`Tema ${t.name}`}
      className={`relative rounded-xl border-2 p-2 text-left transition-transform active:scale-95 ${
        active ? 'border-lime-600' : 'border-paper-200 hover:border-paper-300'
      }`}
      style={{ background: t.bg }}
    >
      <span className="flex items-center gap-1.5">
        <span className="w-4 h-4 rounded-full shrink-0 border" style={{ background: t.accent, borderColor: t.ink + '33' }} />
        <span className="h-4 flex-1 rounded-md border" style={{ background: t.card, borderColor: t.ink + '22' }} />
      </span>
      <span className="mt-1.5 block text-[11px] font-semibold leading-tight truncate" style={{ color: t.ink }}>
        {t.name}
      </span>
      {active && (
        <span className="absolute -top-1.5 -right-1.5 grid place-items-center w-5 h-5 rounded-full bg-btn text-btn-text">
          <Check className="w-3 h-3" />
        </span>
      )}
    </button>
  );
}

/** Gumb v glavi + plošča z 20 svetlimi in 20 temnimi temami. Izbira se zapomni v brskalniku. */
export default function ThemeSwitcher() {
  const [pref, setPref] = useState<string>(DEFAULT_THEME);
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const p = readPref();
    setPref(p);
    apply(p);
    const onStorage = (e: StorageEvent) => {
      if (e.key === THEME_STORAGE_KEY) {
        const np = readPref();
        setPref(np);
        apply(np);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // pri »samodejno« sledi sistemski svetli/temni nastavitvi
  useEffect(() => {
    if (pref !== AUTO) return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const on = () => apply(AUTO);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, [pref]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent | TouchEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('touchstart', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('touchstart', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const pick = useCallback((p: string) => {
    setPref(p);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, p);
    } catch {
      /* brez shrambe — tema velja do osvežitve */
    }
    apply(p);
  }, []);

  const light = THEMES.filter((t) => t.mode === 'light');
  const dark = THEMES.filter((t) => t.mode === 'dark');

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Barvna tema"
        aria-expanded={open}
        className="grid place-items-center w-10 h-10 rounded-full border border-paper-300 bg-card text-ink-soft hover:text-ink hover:border-lime-500 transition-colors"
      >
        <Palette className="w-4 h-4" />
      </button>
      {open && (
        <div
          role="dialog"
          aria-label="Izbira barvne teme"
          className="absolute right-0 top-full mt-2 w-[min(92vw,26rem)] max-h-[75vh] overflow-y-auto rounded-2xl border border-paper-200 bg-card p-4 shadow-2xl z-50"
        >
          <button
            type="button"
            onClick={() => pick(AUTO)}
            aria-pressed={pref === AUTO}
            className={`w-full flex items-center gap-2 rounded-xl border-2 px-3 py-2.5 text-sm font-semibold mb-4 ${
              pref === AUTO ? 'border-lime-600 text-heading' : 'border-paper-200 text-ink-soft hover:border-paper-300'
            }`}
          >
            <Monitor className="w-4 h-4" /> Samodejno (po nastavitvi telefona / računalnika)
            {pref === AUTO && <Check className="w-4 h-4 ml-auto" />}
          </button>

          <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-ink-soft mb-2">
            <Sun className="w-3.5 h-3.5" /> Svetle teme
          </p>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-4">
            {light.map((t) => (
              <Swatch key={t.id} t={t} active={pref === t.id} onPick={() => pick(t.id)} />
            ))}
          </div>

          <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-ink-soft mb-2">
            <Moon className="w-3.5 h-3.5" /> Temne teme
          </p>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {dark.map((t) => (
              <Swatch key={t.id} t={t} active={pref === t.id} onPick={() => pick(t.id)} />
            ))}
          </div>

          <Credit className="mt-4 text-center" />
        </div>
      )}
    </div>
  );
}
