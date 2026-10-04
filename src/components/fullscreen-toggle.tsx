'use client';

import { useEffect, useState } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';

/**
 * Celozaslonski način znotraj brskalnika (Android Chrome / namizni brskalniki).
 * iOS Safari tega za celotne strani ne podpira — tam se gumb samodejno skrije;
 * namestitev na domači zaslon tam reši *Deli → Dodaj na domači zaslon*.
 */
export default function FullscreenToggle() {
  const [show, setShow] = useState(false);
  const [isFs, setIsFs] = useState(false);

  useEffect(() => {
    const el = document.documentElement as HTMLElement & { requestFullscreen?: () => Promise<void> };
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true;
    // v nameščeni aplikaciji je celozaslonski način odveč
    setShow(typeof el.requestFullscreen === 'function' && !standalone);
    const onChange = () => setIsFs(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onChange);
    onChange();
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  if (!show) return null;

  const toggle = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await (document.documentElement as HTMLElement).requestFullscreen();
      }
    } catch {
      /* brskalnik ali uporabnik je zavrnil */
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isFs ? 'Izklopi celozaslonski način' : 'Celozaslonski način'}
      title={isFs ? 'Izklopi celozaslonski način' : 'Celozaslonski način'}
      className="grid place-items-center w-10 h-10 rounded-full border border-paper-300 bg-card text-ink-soft hover:text-ink hover:border-lime-500 transition-colors"
    >
      {isFs ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
    </button>
  );
}
