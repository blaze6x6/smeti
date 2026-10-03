'use client';

import { useState } from 'react';
import { Check, ChevronDown, X } from 'lucide-react';
import { WASTE_GROUP_LABEL, WASTE_TYPES, type WasteGroup, type WasteType } from '@/lib/waste';
import { WasteIcon } from '@/components/waste-icons';

/**
 * Zložljive kartice s klasifikacijo odpadkov — vsebina se odpre ob kliku
 * oziroma pritisku na kartico (na telefonu).
 */
export default function WasteClassification() {
  const types = Object.values(WASTE_TYPES);
  // ob obisku strani so vse kartice zaprte
  const [open, setOpen] = useState<string | null>(null);
  const [filter, setFilter] = useState<WasteGroup | 'vse'>('vse');

  const groups: (WasteGroup | 'vse')[] = ['vse', 'dom', 'otok', 'center'];
  const shown = filter === 'vse' ? types : types.filter((t) => t.group === filter);

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-5">
        {groups.map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => { setFilter(g); setOpen(null); }}
            className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wider border transition-colors min-h-[40px] ${
              filter === g
                ? 'bg-pine-950 text-white border-pine-950'
                : 'bg-card text-ink-soft border-paper-200 hover:border-pine-300'
            }`}
          >
            {g === 'vse' ? `Vse frakcije (${types.length})` : WASTE_GROUP_LABEL[g]}
          </button>
        ))}
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
        {shown.map((w) => (
          <Card key={w.id} w={w} open={open === w.id} onToggle={() => setOpen(open === w.id ? null : w.id)} />
        ))}
      </div>
    </div>
  );
}

function Card({ w, open, onToggle }: { w: WasteType; open: boolean; onToggle: () => void }) {
  const panelId = `frakcija-${w.id}`;
  return (
    <article
      className={`rounded-3xl border bg-card transition-all duration-300 overflow-hidden ${
        open
          ? 'border-transparent shadow-[0_20px_50px_-28px_rgba(18,58,39,0.4)]'
          : 'border-paper-200 hover:border-paper-300 hover:shadow-[0_14px_36px_-28px_rgba(18,58,39,0.35)]'
      }`}
      style={open ? { borderColor: `${w.color}66` } : undefined}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={panelId}
        className="w-full text-left p-5 sm:p-6 flex items-start gap-4 min-h-[76px] cursor-pointer"
      >
        <span
          className="w-12 h-12 rounded-2xl grid place-items-center shrink-0 transition-transform duration-300"
          style={{
            background: `${w.color}22`,
            color: w.deep,
            transform: open ? 'scale(1.06) rotate(-3deg)' : undefined,
          }}
        >
          <WasteIcon id={w.id} className="w-7 h-7" />
        </span>

        <span className="flex-1 min-w-0">
          <span className="flex items-center gap-2 flex-wrap">
            <span className="font-display text-lg sm:text-xl text-pine-950 leading-tight">{w.label}</span>
            <span
              className={`text-[10px] font-bold uppercase tracking-wider rounded-full px-2 py-0.5 border ${
                w.group === 'dom'
                  ? 'bg-pine-100 text-pine-700 border-pine-200'
                  : w.group === 'otok'
                    ? 'bg-lime-100 text-lime-600 border-lime-400/40'
                    : 'bg-paper-100 border-paper-200 text-ink-soft'
              }`}
            >
              {WASTE_GROUP_LABEL[w.group]}
            </span>
          </span>
          <span className="block text-xs text-ink-soft mt-1">{w.bin}</span>
        </span>

        <ChevronDown
          className={`w-5 h-5 shrink-0 mt-1 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
          style={{ color: open ? w.deep : undefined }}
          aria-hidden="true"
        />
      </button>

      {/* zložljiva vsebina (mehko odpiranje brez skokov) */}
      <div
        id={panelId}
        className="grid transition-all duration-300 ease-out"
        style={{ gridTemplateRows: open ? '1fr' : '0fr' }}
      >
        <div className="overflow-hidden">
          <div className="px-5 sm:px-6 pb-5 sm:pb-6 pt-0">
            <div className="h-px w-full mb-4" style={{ background: `${w.color}33` }} />
            <p className="text-sm text-ink mb-4">{w.desc}</p>
            <p className="text-[11px] font-bold uppercase tracking-wider text-ink-faint mb-2">Sem sodi</p>
            <ul className="flex flex-wrap gap-1.5">
              {w.examples.map((ex) => (
                <li
                  key={ex}
                  className="inline-flex items-center gap-1 text-[11px] rounded-full px-2.5 py-1 border"
                  style={{ background: `${w.color}14`, borderColor: `${w.color}33`, color: w.deep }}
                >
                  <Check className="w-3 h-3 shrink-0" />
                  {ex}
                </li>
              ))}
            </ul>
            {w.notExamples?.length ? (
              <>
                <p className="text-[11px] font-bold uppercase tracking-wider text-ink-faint mt-4 mb-2">Ne sodi sem</p>
                <ul className="flex flex-wrap gap-1.5">
                  {w.notExamples.map((ex) => (
                    <li
                      key={ex}
                      className="inline-flex items-center gap-1 text-[11px] rounded-full px-2.5 py-1 border border-coral-500/30 bg-coral-100/60 text-coral-700"
                    >
                      <X className="w-3 h-3 shrink-0" />
                      {ex}
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}
