'use client';

import { useEffect, useRef } from 'react';
import { AlarmClock, Info, X } from 'lucide-react';
import type { ScheduleEventDto } from '@/lib/data';
import { WASTE_TYPES, wasteColor, wasteLabel, wasteTextOn, type WasteTypeId } from '@/lib/waste';
import { WasteIcon } from '@/components/waste-icons';
import { diffDaysStr, formatSlLong } from '@/lib/dates';

type Props = {
  event: ScheduleEventDto | null;
  villageName: string;
  today: string;
  onClose: () => void;
};

/** Modalno okno s podrobnostmi odvoza za izbrani dan. */
export default function DayModal({ event, villageName, today, onClose }: Props) {
  const closeRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!event) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    // prepreči drsenje ozadja, dokler je okno odprto
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [event, onClose]);

  if (!event) return null;
  const diff = diffDaysStr(today, event.date);
  const badge =
    diff === 0 ? { text: 'Danes', cls: 'bg-lime-400 text-pine-950' }
      : diff === 1 ? { text: 'Jutri', cls: 'bg-amber-400 text-pine-950' }
        : diff > 1 ? { text: `čez ${diff} dni`, cls: 'bg-pine-100 text-pine-700 border border-pine-200' }
          : { text: 'opravljeno', cls: 'bg-paper-200 text-ink-soft' };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="day-modal-title"
    >
      {/* zatemnitev ozadja */}
      <button
        aria-label="Zapri"
        onClick={onClose}
        className="absolute inset-0 bg-pine-950/55 backdrop-blur-sm animate-[fade_0.2s_ease-out]"
      />

      <div className="relative w-full sm:max-w-md max-h-[88vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl border border-paper-200 bg-card shadow-2xl anim-rise safe-b">
        {/* ročica za poteg (mobilno) */}
        <div className="sm:hidden sticky top-0 bg-card pt-3 pb-1 flex justify-center">
          <span className="w-10 h-1.5 rounded-full bg-paper-300" />
        </div>

        <div className="p-5 sm:p-7">
          <div className="flex items-start gap-3 mb-5">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] uppercase tracking-[0.2em] text-pine-600 mb-1">{villageName}</p>
              <h2 id="day-modal-title" className="font-display text-2xl text-pine-950 leading-tight">
                {formatSlLong(event.date)}
              </h2>
              <span className={`inline-block mt-2 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider ${badge.cls}`}>
                {badge.text}
              </span>
            </div>
            <button
              ref={closeRef}
              onClick={onClose}
              aria-label="Zapri okno"
              className="grid place-items-center w-10 h-10 rounded-full border border-paper-200 text-ink-soft hover:text-ink hover:border-paper-300 transition-colors shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <p className="text-[11px] font-bold uppercase tracking-wider text-ink-faint mb-2">Ta dan pobirajo</p>
          <ul className="space-y-2.5 mb-5">
            {event.types.map((t) => {
              const w = WASTE_TYPES[t as WasteTypeId];
              return (
                <li
                  key={t}
                  className="flex items-start gap-3 rounded-2xl p-3.5"
                  style={{ background: `${wasteColor(t)}1a`, border: `1px solid ${wasteColor(t)}40` }}
                >
                  <span
                    className="grid place-items-center w-11 h-11 rounded-xl shrink-0"
                    style={{ background: wasteColor(t), color: wasteTextOn(t) }}
                  >
                    <WasteIcon id={t} className="w-6 h-6" />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-semibold text-pine-950 leading-snug">{wasteLabel(t)}</span>
                    {w && <span className="block text-xs text-ink-soft mt-0.5">{w.bin}</span>}
                  </span>
                </li>
              );
            })}
          </ul>

          {event.note && (
            <p className="flex items-start gap-2 text-sm font-medium text-amber-700 bg-amber-100 rounded-2xl p-3.5 mb-4">
              <Info className="w-4 h-4 mt-0.5 shrink-0" />
              {event.note}
            </p>
          )}

          <p className="flex items-start gap-2 text-sm text-ink-soft">
            <AlarmClock className="w-4 h-4 mt-0.5 shrink-0" />
            Zabojnike postavi ob mejo zemljišča prejšnji večer oziroma najkasneje do 6. ure zjutraj.
          </p>

          <button
            onClick={onClose}
            className="mt-5 w-full rounded-full bg-pine-950 text-white py-3.5 font-semibold hover:bg-pine-900 active:scale-[0.98] transition-all min-h-[52px]"
          >
            Zapri
          </button>
        </div>
      </div>
    </div>
  );
}
