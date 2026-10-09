'use client';

import { useMemo } from 'react';
import { AlarmClock, ArrowDown, BellRing, CalendarDays, ChevronDown, Loader2, MapPin, Truck } from 'lucide-react';
import CalendarExplorer from '@/components/calendar-explorer';
import { useVillage } from '@/components/village-context';
import { wasteColor, wasteLabel, wasteTextOn } from '@/lib/waste';
import { VILLAGES, villageSummary, type Village } from '@/lib/villages';
import { diffDaysStr, formatSlLong } from '@/lib/dates';

/** Izbirnik kraja + kartica naslednjega odvoza. */
export function VillagePicker() {
  const { villageId, setVillageId, data, loading } = useVillage();
  const village: Village = VILLAGES.find((v) => v.id === data.village) ?? VILLAGES[0];
  const next = data.upcoming[0] ?? null;
  const nextDiff = next ? diffDaysStr(data.today, next.date) : null;

  return (
    <div className="grid md:grid-cols-[1.2fr_1fr] gap-4">
      <div className="rounded-3xl border border-paper-200 bg-card shadow-[0_18px_50px_-24px_rgba(18,58,39,0.25)] p-6 sm:p-8">
        <label className="block mb-5">
          <span className="flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-pine-600 mb-2">
            <MapPin className="w-4 h-4" /> Izberi svoj kraj
          </span>
          <span className="relative block">
            <select
              value={villageId}
              onChange={(e) => setVillageId(e.target.value)}
              aria-label="Kraj odvoza"
              className="w-full appearance-none rounded-2xl border-2 border-pine-200 bg-pine-100 px-4 py-3.5 pr-11 text-lg font-semibold text-pine-950 focus:outline-none focus:border-lime-500 min-h-[56px] cursor-pointer"
            >
              {VILLAGES.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                  {v.detail ? ` (${v.detail})` : ''}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-pine-700" />
          </span>
          <span className="block text-xs text-ink-soft mt-2">{villageSummary(village)}</span>
        </label>

        <div className="flex items-center gap-2 text-pine-600 text-xs uppercase tracking-[0.25em] mb-3">
          <Truck className="w-4 h-4" /> Naslednji odvoz
          {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
        </div>
        {next ? (
          <>
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
              <span className="font-display text-2xl sm:text-4xl text-pine-950">{formatSlLong(next.date)}</span>
              {nextDiff === 0 ? (
                <span className="rounded-full bg-lime-400 text-pine-950 text-xs font-bold uppercase tracking-wider px-3 py-1.5 dot-live">Danes!</span>
              ) : nextDiff === 1 ? (
                <span className="rounded-full bg-amber-400 text-pine-950 text-xs font-bold uppercase tracking-wider px-3 py-1.5">Jutri</span>
              ) : (
                <span className="rounded-full border border-pine-200 bg-pine-100 text-pine-700 text-xs uppercase tracking-wider px-3 py-1.5">čez {nextDiff} dni</span>
              )}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {next.types.map((t) => (
                <span
                  key={t}
                  className="rounded-full px-3.5 py-1.5 text-sm font-semibold"
                  style={{ background: wasteColor(t), color: wasteTextOn(t) }}
                >
                  {wasteLabel(t)}
                </span>
              ))}
            </div>
            {next.note && <p className="mt-3 text-sm font-medium text-amber-600">Opomba: {next.note}</p>}
            <p className="mt-4 flex items-center gap-2 text-sm text-ink-soft">
              <AlarmClock className="w-4 h-4 shrink-0" />
              Zabojnike postavite ob mejo zemljišča prejšnji večer oziroma najkasneje do 6. ure zjutraj.
            </p>
          </>
        ) : (
          <p className="text-ink-soft">Za ta kraj ni podatkov v urniku — uvozi uradni PDF koledar v zaledju.</p>
        )}
      </div>

      <div className="rounded-3xl border border-lime-500/40 bg-gradient-to-br from-lime-300 via-lime-400 to-amber-400 p-6 sm:p-8 flex flex-col justify-between gap-5 text-pine-950 shadow-[0_18px_50px_-24px_rgba(111,154,15,0.5)]">
        <div>
          <div className="flex items-center gap-2 text-pine-800 text-xs uppercase tracking-[0.25em] mb-3">
            <BellRing className="w-4 h-4" /> E-poštna obvestila
          </div>
          <p className="text-lg font-semibold leading-snug">
            Dan pred vsakim odvozom v kraju <strong>{village.name}</strong> ob <strong>18:00</strong> dobiš e-pošto.
            Brez prijave v aplikacijo, brez navlake.
          </p>
        </div>
        <a
          href="#obvestila"
          className="inline-flex items-center justify-center gap-2 rounded-full bg-pine-950 text-white font-semibold px-6 py-3.5 hover:bg-pine-900 active:scale-[0.98] transition-all min-h-[52px]"
        >
          Nastavi obvestila <ArrowDown className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
}

/** Koledar za izbrani kraj. */
export function VillageCalendar() {
  const { data } = useVillage();
  const village: Village = VILLAGES.find((v) => v.id === data.village) ?? VILLAGES[0];
  const eventsByYear = useMemo(
    () => (data.eventsByYear && Object.keys(data.eventsByYear).length ? data.eventsByYear : { [data.year]: data.events }),
    [data.eventsByYear, data.year, data.events],
  );

  return (
    <>
      <div className="flex items-center gap-3 mb-2">
        <CalendarDays className="w-5 h-5 text-lime-600" />
        <h2 className="text-xs uppercase tracking-[0.3em] text-pine-600">Mesečni koledar · {village.name}</h2>
      </div>
      <p className="text-ink-soft text-sm sm:text-base mb-8 max-w-2xl">
        Med meseci se premikaš s puščicama — na telefonu pa kar s potegom prsta levo-desno.
        Obarvani dnevi so odvozi: <span style={{ color: wasteColor('mesani') }} className="font-bold">zelena</span> za mešane odpadke in{' '}
        <span style={{ color: wasteColor('embalaza') }} className="font-bold">rumena</span> za embalažo.
      </p>
      <CalendarExplorer
        key={data.village}
        years={data.years.length ? data.years : [data.year]}
        eventsByYear={eventsByYear}
        today={data.today}
        villageName={village.name}
      />
    </>
  );
}
