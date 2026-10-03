'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Hand, Info, LocateFixed, MoveHorizontal, Trash2 } from 'lucide-react';
import type { ScheduleEventDto } from '@/lib/data';
import { wasteColor, wasteLabel, wasteShort, wasteTextOn } from '@/lib/waste';
import DayModal from '@/components/day-modal';
import { MONTHS_SL, diffDaysStr, formatSlLong, parseDateStr, toStr } from '@/lib/dates';

type Props = {
  years: number[];
  eventsByYear: Record<number, ScheduleEventDto[]>;
  today: string;
  villageName?: string;
};

type Cell = {
  key: number;
  day: number | null;
  str?: string;
  wd: number;
  ev?: ScheduleEventDto;
  isToday: boolean;
  isPast: boolean;
};

function buildCells(year: number, month: number, events: ScheduleEventDto[], today: string): Cell[] {
  const dim = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const firstWd = (new Date(Date.UTC(year, month - 1, 1)).getUTCDay() + 6) % 7; // 0 = po
  const byDate = new Map(events.map((e) => [e.date, e]));
  const cells: Cell[] = [];
  for (let i = 0; i < firstWd; i++) {
    cells.push({ key: -(i + 1), day: null, wd: i, isToday: false, isPast: false });
  }
  for (let d = 1; d <= dim; d++) {
    const str = toStr({ y: year, m: month, d });
    const wd = (new Date(Date.UTC(year, month - 1, d)).getUTCDay() + 6) % 7;
    cells.push({
      key: d,
      day: d,
      str,
      wd,
      ev: byDate.get(str),
      isToday: str === today,
      isPast: str < today,
    });
  }
  return cells;
}

const WEEKDAY_HEADER = ['po', 'to', 'sr', 'če', 'pe', 'so', 'ne'];

export default function CalendarExplorer({ years, eventsByYear, today, villageName = '' }: Props) {
  const [modalEvent, setModalEvent] = useState<ScheduleEventDto | null>(null);
  const tParts = parseDateStr(today);
  const hasTodayYear = years.includes(tParts.y);
  const [year, setYear] = useState<number>(hasTodayYear ? tParts.y : years[years.length - 1]);
  const [month, setMonth] = useState<number>(hasTodayYear ? tParts.m : 1); // 1-12

  const events = eventsByYear[year] ?? [];
  const cells = useMemo(() => buildCells(year, month, events, today), [year, month, events, today]);
  const eventsInMonth = useMemo(
    () => events.filter((e) => parseDateStr(e.date).m === month),
    [events, month],
  );
  const onCurrentMonth = hasTodayYear && year === tParts.y && month === tParts.m;

  const firstYear = years[0];
  const lastYear = years[years.length - 1];
  const canPrev = !(year === firstYear && month === 1);
  const canNext = !(year === lastYear && month === 12);

  const go = useCallback(
    (delta: -1 | 1) => {
      if (delta === -1 && !canPrev) return;
      if (delta === 1 && !canNext) return;
      let m = month + delta;
      let y = year;
      if (m < 1) { m = 12; y = year - 1; }
      if (m > 12) { m = 1; y = year + 1; }
      if (!years.includes(y)) return;
      setYear(y);
      setMonth(m);
    },
    [month, year, canPrev, canNext, years],
  );

  /* tipkovnica: ← / → */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') go(-1);
      else if (e.key === 'ArrowRight') go(1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go]);

  /* poteg prsta (swipe) levo/desno — samo skoraj vodoravni potegi */
  const touch = useRef<{ x: number; y: number } | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touch.current = { x: t.clientX, y: t.clientY };
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touch.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touch.current.x;
    const dy = t.clientY - touch.current.y;
    touch.current = null;
    if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.4) {
      go(dx < 0 ? 1 : -1);
    }
  };

  return (
    <div>
      {/* glava meseca + puščici */}
      <div className="flex items-center gap-2 sm:gap-4 mb-6">
        <button
          onClick={() => go(-1)}
          disabled={!canPrev}
          aria-label="Prejšnji mesec"
          className="grid place-items-center w-12 h-12 sm:w-14 sm:h-14 rounded-full border border-paper-300 bg-card text-pine-800 shadow-sm hover:border-lime-500 hover:bg-lime-100 active:scale-95 transition-all disabled:opacity-25 disabled:pointer-events-none shrink-0"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div className="flex-1 text-center">
          <h3 className="font-display text-4xl sm:text-6xl leading-none text-pine-950" key={`${year}-${month}`}>
            <span className="anim-rise inline-block">{MONTHS_SL[month - 1]}</span>{' '}
            <span className="anim-rise inline-block text-lime-600">{year}</span>
          </h3>
        </div>
        <button
          onClick={() => go(1)}
          disabled={!canNext}
          aria-label="Naslednji mesec"
          className="grid place-items-center w-12 h-12 sm:w-14 sm:h-14 rounded-full border border-paper-300 bg-card text-pine-800 shadow-sm hover:border-lime-500 hover:bg-lime-100 active:scale-95 transition-all disabled:opacity-25 disabled:pointer-events-none shrink-0"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      {!onCurrentMonth && (
        <div className="flex justify-center -mt-3 mb-4">
          <button
            onClick={() => { setYear(tParts.y); setMonth(tParts.m); }}
            className="inline-flex items-center gap-2 rounded-full bg-pine-100 border border-pine-200 text-pine-700 px-4 py-2 text-xs font-semibold uppercase tracking-wider hover:bg-pine-200 transition-colors"
          >
            <LocateFixed className="w-3.5 h-3.5" /> Nazaj na danes
          </button>
        </div>
      )}

      {/* mesečna mreža */}
      <div
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        className="rounded-3xl border border-paper-200 bg-card shadow-[0_18px_50px_-30px_rgba(18,58,39,0.25)] p-3 sm:p-6 select-none anim-rise"
        key={`grid-${year}-${month}`}
        role="grid"
        aria-label={`Koledar za ${MONTHS_SL[month - 1]} ${year}`}
      >
        {/* glava dnevov */}
        <div className="cal-grid mb-1.5">
          {WEEKDAY_HEADER.map((d, i) => (
            <div
              key={d + i}
              className={`text-center text-[10px] sm:text-xs font-extrabold uppercase tracking-wider py-1.5 ${
                i === 0 ? 'text-pine-700' : 'text-ink-faint'
              }`}
            >
              {d}
            </div>
          ))}
        </div>
        {/* dnevi */}
        <div className="cal-grid">
          {cells.map((c) => {
            if (c.day === null) return <div key={c.key} className="min-h-[52px] sm:min-h-[78px]" />;
            const monday = c.wd === 0;
            let style: React.CSSProperties | undefined;
            let textCls = monday ? 'text-pine-800' : 'text-ink-soft';
            let baseCls = monday ? 'bg-pine-100 border-pine-200' : 'bg-transparent border-transparent';
            const hasEv = Boolean(c.ev && c.ev.types.length);
            if (hasEv && c.ev) {
              const cols = c.ev.types.map((t) => wasteColor(t));
              style =
                cols.length > 1
                  ? {
                      background: `linear-gradient(150deg, ${cols[0]} 0 55%, ${cols[1]} 55% 100%)`,
                      color: wasteTextOn(c.ev.types[0]),
                      border: 'none',
                    }
                  : { background: cols[0], color: wasteTextOn(c.ev.types[0]), border: 'none' };
              textCls = '';
              baseCls = '';
            }
            const common = (
              <>
                <span className="text-[11px] sm:text-sm leading-none font-semibold">{c.day}</span>
                {c.ev?.note && (
                  <span className="absolute top-1 right-1.5 text-[10px] sm:text-xs font-bold opacity-80" title={c.ev.note}>*</span>
                )}
                {hasEv && c.ev && (
                  <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-wide leading-tight opacity-90 break-words">
                    {c.ev.types.map((t) => wasteShort(t)).join(' + ')}
                  </span>
                )}
              </>
            );
            const cls = `relative rounded-xl border px-1.5 py-1 sm:px-2 sm:py-1.5 min-h-[52px] sm:min-h-[78px] flex flex-col justify-between text-left transition-transform duration-150 ${
              baseCls
            } ${textCls} ${c.isPast ? 'opacity-40' : ''} ${
              c.isToday ? 'ring-2 ring-pine-950 ring-offset-2 ring-offset-card z-10' : ''
            } ${hasEv ? 'cursor-pointer hover:brightness-105 active:scale-[0.96]' : ''}`;

            if (hasEv && c.ev) {
              const ev = c.ev;
              return (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setModalEvent(ev)}
                  aria-label={`${c.str}: ${ev.types.map(wasteLabel).join(', ')}${ev.note ? ` (${ev.note})` : ''} — odpri podrobnosti`}
                  className={cls}
                  style={style}
                >
                  {common}
                </button>
              );
            }
            return (
              <div key={c.key} role="gridcell" aria-label={c.str} className={cls} style={style}>
                {common}
              </div>
            );
          })}
        </div>
        {/* namig za poteg na mobilnem */}
        <p className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] text-ink-faint">
          <span className="sm:hidden inline-flex items-center gap-1.5">
            <MoveHorizontal className="w-4 h-4" />
            Potegni levo ali desno za menjavo meseca
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Hand className="w-3.5 h-3.5" />
            Klikni obarvan dan za podrobnosti
          </span>
        </p>
      </div>

      {/* seznam odvozov v izbranem mesecu */}
      <div className="mt-6 rounded-3xl border border-paper-200 bg-card p-5 sm:p-7">
        <div className="flex items-center gap-2.5 mb-4">
          <CalendarDays className="w-5 h-5 text-lime-600" />
          <h4 className="font-display text-xl sm:text-2xl text-pine-950">
            Odvozi v mesecu {MONTHS_SL[month - 1]}
          </h4>
          <span className="ml-auto text-xs text-ink-soft">{eventsInMonth.length}×</span>
        </div>
        {eventsInMonth.length === 0 ? (
          <div className="flex items-start gap-3 text-ink-soft text-sm">
            <Trash2 className="w-4 h-4 mt-0.5 shrink-0" />
            Ta mesec ni podatkov o odvozu. Uvozi uradni PDF koledar v zaledju.
          </div>
        ) : (
          <ul className="space-y-2.5">
            {eventsInMonth.map((e) => {
              const diff = diffDaysStr(today, e.date);
              return (
                <li key={e.date}>
                <button
                  type="button"
                  onClick={() => setModalEvent(e)}
                  className={`w-full text-left rounded-2xl border p-4 flex flex-col gap-2 hover:border-pine-300 transition-colors ${
                    e.date === today
                      ? 'border-lime-500 bg-lime-100'
                      : diff > 0
                        ? 'border-paper-200 bg-card'
                        : 'border-paper-200 bg-paper-100/60 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-pine-950">{formatSlLong(e.date)}</span>
                    {e.date === today ? (
                      <span className="text-[11px] font-bold uppercase tracking-wider bg-lime-400 text-pine-950 rounded-full px-2.5 py-1">Danes</span>
                    ) : diff === 1 ? (
                      <span className="text-[11px] font-bold uppercase tracking-wider bg-amber-400 text-pine-950 rounded-full px-2.5 py-1">Jutri</span>
                    ) : diff > 1 && diff <= 7 ? (
                      <span className="text-[11px] uppercase tracking-wider text-pine-600">čez {diff} dni</span>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {e.types.map((t) => (
                      <span
                        key={t}
                        className="text-xs font-medium rounded-full px-2.5 py-1"
                        style={{ background: wasteColor(t), color: wasteTextOn(t) }}
                      >
                        {wasteLabel(t)}
                      </span>
                    ))}
                  </div>
                  {e.note && (
                    <div className="flex items-start gap-1.5 text-xs font-medium text-amber-700">
                      <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                      {e.note}
                    </div>
                  )}
                </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      <DayModal
        event={modalEvent}
        villageName={villageName}
        today={today}
        onClose={() => setModalEvent(null)}
      />
    </div>
  );
}
