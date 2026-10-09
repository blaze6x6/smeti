'use client';

import { useEffect, useRef, useState } from 'react';
import { BellRing, Check, Loader2, MailOpen, MapPin, Send, Share, Smartphone } from 'lucide-react';
import { useVillage } from '@/components/village-context';
import { VILLAGES } from '@/lib/villages';

/* ---------- PWA: service worker + namestitev na začetni zaslon ---------- */

export function PwaInstall() {
  const deferred = useRef<Event | null>(null);
  const [canInstall, setCanInstall] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showIosHint, setShowIosHint] = useState(false);

  useEffect(() => {
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const standalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as unknown as { standalone?: boolean }).standalone;
    setIsIos(Boolean(ios && !standalone));
    const onPrompt = (e: Event) => {
      e.preventDefault();
      deferred.current = e;
      setCanInstall(true);
    };
    window.addEventListener('beforeinstallprompt', onPrompt as EventListener);
    return () => window.removeEventListener('beforeinstallprompt', onPrompt as EventListener);
  }, []);

  const install = async () => {
    if (deferred.current) {
      const p = deferred.current as unknown as { prompt: () => Promise<void> };
      await p.prompt();
      deferred.current = null;
      setCanInstall(false);
    } else if (isIos) {
      setShowIosHint((v) => !v);
    }
  };

  if (!canInstall && !isIos) return null;
  return (
    <div className="relative">
      <button
        onClick={install}
        className="inline-flex items-center gap-2 rounded-full border border-paper-300 bg-card px-4 py-2 text-sm font-medium text-ink-soft hover:text-ink hover:border-lime-500 transition-colors"
      >
        <Smartphone className="w-4 h-4" />
        Dodaj na začetni zaslon
      </button>
      {showIosHint && isIos && (
        <div className="absolute right-0 top-full mt-2 w-72 rounded-2xl border border-paper-200 bg-card p-4 text-sm text-ink shadow-xl z-50">
          <p className="font-semibold text-pine-950 mb-2">iPhone / iPad:</p>
          <ol className="list-decimal ml-4 space-y-1.5 text-ink-soft">
            <li>Odpri stran v brskalniku <strong>Safari</strong></li>
            <li>Dotakni se gumba <Share className="inline w-4 h-4 -mt-0.5" /> <strong>Deli</strong></li>
            <li>Izberi <strong>»Dodaj na domači zaslon«</strong></li>
          </ol>
        </div>
      )}
    </div>
  );
}

/* ---------- obrazec za prijavo na e-poštna obvestila ---------- */

export function SubscribeForm() {
  const { villageId, setVillageId } = useVillage();
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'ok' | 'err'>('idle');
  const [msg, setMsg] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState('sending');
    setMsg('');
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, village: villageId }),
      });
      const data = (await res.json()) as { ok: boolean; pending?: boolean; villageName?: string; error?: string };
      if (data.ok) {
        setState('ok');
        setMsg(
          `Na ${email || 'tvoj naslov'} smo poslali potrditveno sporočilo za kraj ${data.villageName ?? ''}. ` +
            'Klikni povezavo v njem — brez potrditve obvestil ne bo (preveri tudi mapo z neželeno pošto).',
        );
        setEmail('');
      } else {
        setState('err');
        setMsg(data.error || 'Prijava ni uspela.');
      }
    } catch {
      setState('err');
      setMsg('Napaka povezave. Poskusi znova.');
    }
  };

  return (
    <form onSubmit={submit} className="w-full">
      <label className="block mb-3">
        <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-pine-800 mb-1.5">
          <MapPin className="w-3.5 h-3.5" /> Kraj obveščanja
        </span>
        <select
          value={villageId}
          onChange={(e) => setVillageId(e.target.value)}
          aria-label="Kraj za obveščanje"
          className="w-full sm:max-w-xs rounded-full border border-paper-300 bg-white px-4 py-3 text-base font-semibold text-ink focus:outline-none focus:border-lime-600 min-h-[52px]"
        >
          {VILLAGES.map((v) => (
            <option key={v.id} value={v.id}>{v.name}{v.detail ? ` (${v.detail})` : ''}</option>
          ))}
        </select>
      </label>
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <MailOpen className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-faint pointer-events-none" />
          <input
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tvoj.epostni@naslov.si"
            aria-label="E-poštni naslov"
            className="w-full rounded-full border border-paper-300 bg-white pl-12 pr-4 py-4 text-base text-ink placeholder:text-ink-faint focus:outline-none focus:border-lime-600 focus:ring-2 focus:ring-lime-400/50 shadow-sm min-h-[56px]"
          />
        </div>
        <button
          type="submit"
          disabled={state === 'sending'}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-pine-950 text-white px-7 py-4 font-semibold hover:bg-pine-900 active:scale-[0.98] transition-all disabled:opacity-60 min-h-[56px] text-base shadow"
        >
          {state === 'sending' ? <Loader2 className="w-5 h-5 animate-spin" /> : <BellRing className="w-5 h-5" />}
          Obveščaj me
        </button>
      </div>
      {msg && (
        <p className={`mt-3 flex items-start gap-2 text-sm font-medium ${state === 'ok' ? 'text-pine-800' : 'text-coral-700'}`} role="status">
          {state === 'ok' ? <Check className="w-4 h-4 mt-0.5 shrink-0" /> : <Send className="w-4 h-4 mt-0.5 shrink-0" />}
          {msg}
        </p>
      )}
    </form>
  );
}
