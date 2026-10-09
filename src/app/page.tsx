import { cookies } from 'next/headers';
import Image from 'next/image';
import Link from 'next/link';
import { BellRing, Leaf, MapPin, Settings, Trash2 } from 'lucide-react';
import { VillageProvider } from '@/components/village-context';
import { VillageCalendar, VillagePicker } from '@/components/schedule-board';
import { PwaInstall, SubscribeForm } from '@/components/home-extras';
import WasteClassification from '@/components/waste-classification';
import PlacesSection from '@/components/places-section';
import CollapsibleSection from '@/components/collapsible-section';
import { getEventsByYear, getUpcomingEvents } from '@/lib/data';
import { DEFAULT_VILLAGE, VILLAGES } from '@/lib/villages';
import { MONTHS_SL, todayStr } from '@/lib/dates';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const today = todayStr();
  // zadnji izbrani kraj (piškotek) — strežnik takoj izriše pravi kraj
  const saved = (await cookies()).get('odvoz.kraj')?.value;
  const village = VILLAGES.some((v) => v.id === saved) ? (saved as string) : DEFAULT_VILLAGE;
  const [eventsByYear, upcoming] = await Promise.all([getEventsByYear(village), getUpcomingEvents(6, village)]);
  const years = Object.keys(eventsByYear).map(Number).sort((a, b) => a - b);
  const thisYear = new Date(`${today}T00:00:00Z`).getUTCFullYear();
  const currentYear = years.includes(thisYear) ? thisYear : (years[years.length - 1] ?? thisYear);
  const events = eventsByYear[currentYear] ?? [];

  return (
    <VillageProvider initial={{ village, year: currentYear, years, events, eventsByYear, upcoming, today }}>
      <main className="min-h-screen overflow-x-clip">
        {/* ---------- glava ---------- */}
        <header className="fixed top-0 inset-x-0 z-40 bg-paper-50/85 backdrop-blur-md border-b border-paper-200">
          <div className="safe-x mx-auto max-w-6xl flex items-center gap-3 h-16">
            <Link href="/" className="flex items-center gap-2.5 min-w-0">
              <span className="grid place-items-center w-9 h-9 rounded-xl bg-lime-400 text-pine-950 shrink-0 shadow-sm">
                <Leaf className="w-5 h-5" />
              </span>
              <span className="min-w-0">
                <span className="block font-display text-lg leading-none text-pine-950 truncate">Koledar odvoza</span>
                <span className="block text-[10px] uppercase tracking-[0.18em] text-ink-soft">občina Žirovnica</span>
              </span>
            </Link>
            <nav className="ml-auto hidden md:flex items-center gap-6 text-sm text-ink-soft">
              <a href="#koledar" className="hover:text-ink transition-colors">Koledar</a>
              <a href="#vrste" className="hover:text-ink transition-colors">Vrste odpadkov</a>
              <a href="#zbirna-mesta" className="hover:text-ink transition-colors">Zbirna mesta</a>
              <a href="#obvestila" className="hover:text-ink transition-colors">Obvestila</a>
            </nav>
            <div className="ml-auto md:ml-4 flex items-center gap-2">
              <PwaInstall />
              <Link
                href="/admin"
                aria-label="Zaledje"
                className="grid place-items-center w-10 h-10 rounded-full border border-paper-300 bg-card text-ink-soft hover:text-ink hover:border-lime-500 transition-colors"
              >
                <Settings className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </header>

        {/* ---------- hero ---------- */}
        <section className="relative pt-16">
          <div className="relative h-[42vh] min-h-[310px] w-full overflow-hidden">
            <Image
              src="/images/hero-smokuc.jpg"
              alt="Vasi pod Karavankami — občina Žirovnica"
              fill
              priority
              sizes="100vw"
              className="object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-pine-950/60 via-pine-950/30 to-paper-50" />
            <div className="absolute inset-x-0 bottom-0">
              <div className="safe-x mx-auto max-w-6xl pb-6 sm:pb-10">
                <p className="anim-rise text-[11px] sm:text-xs uppercase tracking-[0.35em] text-lime-300 mb-3 drop-shadow">
                  Občina Žirovnica · vse vasi · podatki JEKO
                </p>
                <h1 className="anim-rise anim-rise-1 font-display text-[13vw] sm:text-7xl lg:text-8xl leading-[0.95] text-white drop-shadow-lg">
                  Koledar<br />odvoza
                </h1>
              </div>
            </div>
          </div>

          {/* izbira kraja + naslednji odvoz */}
          <div id="naslednji-odvoz" className="safe-x mx-auto max-w-6xl mt-2 scroll-mt-24 anim-rise anim-rise-2">
            <VillagePicker />
          </div>
        </section>

        {/* ---------- koledar ---------- */}
        <section id="koledar" className="safe-x mx-auto max-w-6xl pt-14 sm:pt-20 scroll-mt-20">
          <VillageCalendar />
        </section>

        {/* ---------- zložljiva razdelka: odpadki in zbirna mesta ---------- */}
        <div className="safe-x mx-auto max-w-6xl pt-14 sm:pt-20 space-y-4">
          <section id="vrste">
            <CollapsibleSection
              anchorId="vrste"
              icon={<Trash2 className="w-6 h-6" />}
              eyebrow="Kam s čim"
              title="Klasifikacija odpadkov"
              subtitle="Kaj sodi kam — po klasifikaciji JEKO. Dve frakciji se odvažata od vrat do vrat, ostale oddaš na ekološkem otoku ali v zbirnem centru."
              hint="14 frakcij"
            >
              <p className="text-ink-soft text-sm mb-5">
                Klikni oziroma pritisni na frakcijo, da se izpišejo podrobnosti — kaj vanjo sodi in česa ne.
              </p>
              <WasteClassification />
            </CollapsibleSection>
          </section>

          <section id="zbirna-mesta">
            <CollapsibleSection
              anchorId="zbirna-mesta"
              icon={<MapPin className="w-6 h-6" />}
              eyebrow="Kam odnesti"
              title="Zbirna mesta"
              subtitle="Zbirna centra Žirovnica in Jesenice, ekološki otoki in zabojniki za tekstil — kam odnesti vse, kar se ne pobira na domu."
              hint="2 centra + otoki"
            >
              <PlacesSection />
            </CollapsibleSection>
          </section>
        </div>

        {/* ---------- obvestila ---------- */}
        <section id="obvestila" className="safe-x mx-auto max-w-6xl pt-14 sm:pt-20 scroll-mt-20">
          <div className="rounded-3xl border border-lime-500/40 bg-gradient-to-br from-lime-300 via-lime-400 to-amber-400 p-6 sm:p-10 text-pine-950">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 text-pine-800 text-xs uppercase tracking-[0.25em] mb-3">
                <BellRing className="w-4 h-4" /> Obvestila po e-pošti
              </div>
              <h2 className="font-display text-3xl sm:text-4xl mb-3">Nikoli več pozabljen zabojnik</h2>
              <p className="text-sm sm:text-base mb-6 font-medium">
                Izberi svoj kraj in vpiši e-poštni naslov — <strong>dan pred vsakim odvozom ob 18:00</strong> prejmeš
                opomnik s seznamom frakcij. Odjava je na en klik v vsakem sporočilu. Brez računov in gesel.
              </p>
              <SubscribeForm />
            </div>
          </div>
        </section>

        {/* ---------- noga ---------- */}
        <footer className="safe-x safe-b mx-auto max-w-6xl pt-16 pb-8 mt-10 border-t border-paper-200">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-xs text-ink-soft">
            <div className="flex items-center gap-2">
              <span className="grid place-items-center w-7 h-7 rounded-lg bg-lime-400 text-pine-950"><Leaf className="w-4 h-4" /></span>
              <span>Koledar odvoza odpadkov · občina Žirovnica</span>
            </div>
            <div className="sm:ml-auto flex items-center gap-5">
              <span>Podatki: JEKO d.o.o. Jesenice (uradni koledar)</span>
              <Link href="/admin" className="underline decoration-lime-500 underline-offset-4 hover:text-ink transition-colors">Zaledje</Link>
            </div>
          </div>
          <p className="mt-4 text-[11px] text-ink-faint">
            {MONTHS_SL[new Date(`${today}T00:00:00Z`).getUTCMonth()]} {new Date(`${today}T00:00:00Z`).getUTCFullYear()} ·
            odvoz po relacijah (ponedeljek, torek, sreda) · obvestilo prispe dan prej ob 18:00
          </p>
        </footer>
      </main>
    </VillageProvider>
  );
}
