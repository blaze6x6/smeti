'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
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
  const panel = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null);

  // plošča je pripeta na zaslon (portal v body): nikoli ne štrli čez rob, tudi ne v ozkem pokončnem pogledu
  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const btn = box.current?.getBoundingClientRect();
      if (!btn) return;
      const vw = document.documentElement.clientWidth;
      const margin = 12;
      const width = Math.min(vw - margin * 2, 416);
      const left = Math.max(margin, Math.min(btn.right - width, vw - width - margin));
      setPos({ top: btn.bottom + 8, left, width });
    };
    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [open]);

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
      const t = e.target as Node;
      if (box.current?.contains(t) || panel.current?.contains(t)) return;
      setOpen(false);
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
      {open && pos && createPortal(
        <div
          ref={panel}
          role="dialog"
          aria-label="Izbira barvne teme"
          style={{ position: 'fixed', top: pos.top, left: pos.left, width: pos.width, maxHeight: `calc(100vh - ${pos.top + 12}px)` }}
          className="overflow-y-auto rounded-2xl border border-paper-200 bg-card p-4 shadow-2xl z-[100]"
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
        </div>,
        document.body,
      )}
    </div>
  );
}
