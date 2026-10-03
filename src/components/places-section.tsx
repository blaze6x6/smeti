import { Clock, ExternalLink, Info, Mail, MapPin, Phone, Recycle, Shirt } from 'lucide-react';
import { CENTRES, ECO_ISLANDS, JEKO_CONTACT, TEXTILE_POINTS } from '@/lib/places';
import { WASTE_TYPES, type WasteTypeId } from '@/lib/waste';
import { WasteIcon } from '@/components/waste-icons';

function FractionPills({ ids }: { ids: string[] }) {
  return (
    <ul className="flex flex-wrap gap-1.5">
      {ids.map((id) => {
        const w = WASTE_TYPES[id as WasteTypeId];
        if (!w) return null;
        return (
          <li
            key={id}
            className="inline-flex items-center gap-1.5 text-[11px] font-medium rounded-full px-2.5 py-1 border"
            style={{ background: `${w.color}14`, borderColor: `${w.color}33`, color: w.deep }}
          >
            <WasteIcon id={id} className="w-3.5 h-3.5" />
            {w.short}
          </li>
        );
      })}
    </ul>
  );
}

export default function PlacesSection() {
  return (
    <div className="space-y-4">
      {/* zbirna centra */}
      <div className="grid lg:grid-cols-2 gap-4">
        {CENTRES.map((c) => (
          <article key={c.id} className="rounded-3xl border border-paper-200 bg-card p-6 sm:p-7">
            <div className="flex items-start gap-4 mb-4">
              <span className="grid place-items-center w-12 h-12 rounded-2xl bg-pine-100 text-pine-700 shrink-0">
                <Recycle className="w-6 h-6" />
              </span>
              <div className="min-w-0">
                <h3 className="font-display text-xl text-pine-950 leading-tight">{c.name}</h3>
                <p className="text-sm text-ink-soft mt-0.5">{c.address}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-ink-faint mb-2">
              <Clock className="w-3.5 h-3.5" /> Delovni čas
            </div>
            <ul className="grid grid-cols-2 gap-2 mb-4">
              {c.opening.map((o) => (
                <li
                  key={o.days}
                  className={`rounded-xl px-3 py-2 border ${
                    o.closed
                      ? 'bg-coral-100 border-coral-500/40'
                      : 'bg-pine-100 border-pine-200'
                  }`}
                >
                  <div className={`text-[11px] uppercase tracking-wider font-bold ${o.closed ? 'text-coral-700' : 'text-pine-700'}`}>
                    {o.days}
                  </div>
                  <div className={`text-sm font-semibold ${o.closed ? 'text-coral-700 uppercase' : 'text-pine-800'}`}>
                    {o.hours}
                  </div>
                </li>
              ))}
            </ul>

            {c.note && (
              <p className={`flex items-start gap-2 text-sm font-medium mb-4 ${c.id === 'zc-zirovnica' ? 'text-coral-700' : 'text-ink-soft'}`}>
                <Info className="w-4 h-4 mt-0.5 shrink-0" />
                {c.note}
              </p>
            )}

            <div className="text-[11px] font-bold uppercase tracking-wider text-ink-faint mb-2">Brezplačno sprejemajo</div>
            <FractionPills ids={c.accepts} />

            <div className="mt-5 flex flex-wrap items-center gap-3 text-sm">
              {c.phone && (
                <a href={`tel:${c.phone.replace(/\s/g, '')}`} className="inline-flex items-center gap-1.5 text-pine-700 hover:text-pine-950 transition-colors">
                  <Phone className="w-4 h-4" /> {c.phone}
                </a>
              )}
              {c.email && (
                <a href={`mailto:${c.email}`} className="inline-flex items-center gap-1.5 text-pine-700 hover:text-pine-950 transition-colors break-all">
                  <Mail className="w-4 h-4 shrink-0" /> {c.email}
                </a>
              )}
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(c.mapQuery)}`}
                target="_blank"
                rel="noreferrer"
                className="ml-auto inline-flex items-center justify-center gap-1.5 rounded-full border border-pine-300 text-pine-700 px-5 py-2.5 font-medium hover:bg-pine-100 transition-colors min-h-[44px]"
              >
                <MapPin className="w-4 h-4" /> Pot
              </a>
            </div>
          </article>
        ))}
      </div>

      {/* ekološki otoki */}
      <div className="grid lg:grid-cols-2 gap-4">
        <article className="rounded-3xl border border-lime-400/40 bg-lime-100/70 p-6 sm:p-7">
          <div className="flex items-start gap-4 mb-3">
            <span className="grid place-items-center w-12 h-12 rounded-2xl bg-lime-400 text-pine-950 shrink-0">
              <Recycle className="w-6 h-6" />
            </span>
            <div>
              <h3 className="font-display text-xl text-pine-950">{ECO_ISLANDS.title}</h3>
              <p className="text-xs text-lime-600 font-bold uppercase tracking-wider mt-0.5">dostopni ves čas</p>
            </div>
          </div>
          <p className="text-sm text-ink mb-4">{ECO_ISLANDS.desc}</p>
          <FractionPills ids={ECO_ISLANDS.accepts} />
          <ul className="mt-4 space-y-1.5">
            {ECO_ISLANDS.rules.map((r) => (
              <li key={r} className="flex items-start gap-2 text-sm text-ink-soft">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-lime-500 shrink-0" />
                {r}
              </li>
            ))}
          </ul>
        </article>

        {/* tekstilni zabojniki */}
        <article className="rounded-3xl border border-paper-200 bg-card p-6 sm:p-7">
          <div className="flex items-start gap-4 mb-3">
            <span className="grid place-items-center w-12 h-12 rounded-2xl shrink-0" style={{ background: '#d67ab122', color: '#a8578a' }}>
              <Shirt className="w-6 h-6" />
            </span>
            <div>
              <h3 className="font-display text-xl text-pine-950">Zabojniki za uporaben tekstil</h3>
              <p className="text-xs text-ink-soft mt-0.5">JEKO v sodelovanju s Tekstilko d.o.o.</p>
            </div>
          </div>
          <ul className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
            {TEXTILE_POINTS.map((p) => (
              <li key={p} className="flex items-start gap-2 text-sm text-ink-soft">
                <MapPin className="w-3.5 h-3.5 mt-1 shrink-0 text-ink-faint" />
                {p}
              </li>
            ))}
          </ul>
        </article>
      </div>

      {/* kontakt JEKO */}
      <div className="rounded-3xl border border-paper-200 bg-paper-100 p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1">
          <h3 className="font-display text-lg text-pine-950">{JEKO_CONTACT.company}</h3>
          <p className="text-sm text-ink-soft mt-1">
            {JEKO_CONTACT.wasteInfo.name}: <a href={`tel:${JEKO_CONTACT.wasteInfo.phone.replace(/\s/g, '')}`} className="text-pine-700 hover:text-pine-950">{JEKO_CONTACT.wasteInfo.phone}</a>
            {' · '}
            <a href={`mailto:${JEKO_CONTACT.wasteInfo.email}`} className="text-pine-700 hover:text-pine-950 break-all">{JEKO_CONTACT.wasteInfo.email}</a>
          </p>
          <p className="text-sm text-ink-soft mt-1">{JEKO_CONTACT.bulky}</p>
        </div>
        <a
          href={JEKO_CONTACT.url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded-full bg-pine-950 text-white px-6 py-3 text-sm font-semibold hover:bg-pine-900 transition-colors min-h-[48px] shrink-0"
        >
          jeko.si/odpadki <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
}
