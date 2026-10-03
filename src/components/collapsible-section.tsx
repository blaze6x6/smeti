'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';

type Props = {
  /** Mala oznaka nad naslovom (npr. ikona + kratko besedilo) */
  eyebrow?: React.ReactNode;
  title: string;
  subtitle?: string;
  /** Besedilo ob gumbu, ko je razdelek zaprt (npr. »14 frakcij«) */
  hint?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  /** Sidro za povezave v meniju — ob kliku nanj se razdelek samodejno odpre */
  anchorId?: string;
  defaultOpen?: boolean;
};

/**
 * Razdelek, ki se razpre ob kliku na naslov. Vsebina se izriše šele,
 * ko je enkrat odprta (manj dela ob prvem nalaganju strani).
 */
export default function CollapsibleSection({
  eyebrow,
  title,
  subtitle,
  hint,
  icon,
  children,
  anchorId,
  defaultOpen = false,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const [everOpened, setEverOpened] = useState(defaultOpen);
  const panelId = useId();
  const wrapRef = useRef<HTMLDivElement | null>(null);

  const toggle = () => {
    setOpen((v) => {
      if (!v) setEverOpened(true);
      return !v;
    });
  };

  /* če uporabnik pride po povezavi (#sidro), razdelek odpremo */
  useEffect(() => {
    if (!anchorId) return;
    const openFromHash = () => {
      if (window.location.hash === `#${anchorId}`) {
        setOpen(true);
        setEverOpened(true);
        requestAnimationFrame(() => {
          wrapRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      }
    };
    openFromHash();
    window.addEventListener('hashchange', openFromHash);
    return () => window.removeEventListener('hashchange', openFromHash);
  }, [anchorId]);

  return (
    <div ref={wrapRef} className="scroll-mt-20">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-controls={panelId}
        className={`w-full text-left rounded-3xl border bg-card px-5 py-5 sm:px-7 sm:py-6 flex items-center gap-4 transition-all duration-300 cursor-pointer min-h-[84px] ${
          open
            ? 'border-lime-400/60 shadow-[0_18px_44px_-30px_rgba(18,58,39,0.35)] rounded-b-none sm:rounded-b-none'
            : 'border-paper-200 hover:border-lime-400/60 hover:shadow-[0_18px_44px_-32px_rgba(18,58,39,0.35)]'
        }`}
      >
        {icon && (
          <span className="grid place-items-center w-12 h-12 rounded-2xl bg-lime-100 text-lime-600 shrink-0">
            {icon}
          </span>
        )}
        <span className="flex-1 min-w-0">
          {eyebrow && (
            <span className="block text-[11px] uppercase tracking-[0.25em] text-pine-600 mb-1">{eyebrow}</span>
          )}
          <span className="block font-display text-2xl sm:text-3xl text-pine-950 leading-tight">{title}</span>
          {subtitle && <span className="block text-sm text-ink-soft mt-1 pr-2">{subtitle}</span>}
        </span>
        <span className="flex items-center gap-2 shrink-0">
          {hint && !open && (
            <span className="hidden sm:inline rounded-full bg-paper-100 border border-paper-200 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-ink-soft">
              {hint}
            </span>
          )}
          <span
            className={`grid place-items-center w-11 h-11 rounded-full border transition-all duration-300 ${
              open ? 'bg-pine-950 text-white border-pine-950 rotate-180' : 'bg-paper-100 text-pine-800 border-paper-200'
            }`}
          >
            <ChevronDown className="w-5 h-5" />
          </span>
        </span>
      </button>

      <div
        id={panelId}
        className="grid transition-all duration-300 ease-out"
        style={{ gridTemplateRows: open ? '1fr' : '0fr' }}
      >
        <div className="overflow-hidden">
          <div className={`rounded-b-3xl border border-t-0 border-lime-400/60 bg-card/60 px-4 py-5 sm:px-7 sm:py-7 ${open ? '' : 'pointer-events-none'}`}>
            {everOpened ? children : null}
          </div>
        </div>
      </div>
    </div>
  );
}
