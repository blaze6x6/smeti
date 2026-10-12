'use client';

import { useCallback, useEffect, useState } from 'react';
import { BellRing, BellOff, Send } from 'lucide-react';
import { useVillage } from '@/components/village-context';
import { urlBase64ToUint8Array } from '@/lib/push-core';
import { villageName } from '@/lib/villages';

const LS_VILLAGE = 'odvoz.push.kraj';

type Status = 'loading' | 'unsupported' | 'ios-install' | 'denied' | 'off' | 'on';

function lsGet(k: string): string | null {
  try { return localStorage.getItem(k); } catch { return null; }
}
function lsSet(k: string, v: string | null) {
  try { if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch { /* ignore */ }
}

async function getReg(): Promise<ServiceWorkerRegistration> {
  const existing = await navigator.serviceWorker.getRegistration();
  return existing ?? (await navigator.serviceWorker.ready);
}

export function PushNotify() {
  const { villageId } = useVillage();
  const [status, setStatus] = useState<Status>('loading');
  const [subVillage, setSubVillage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  const post = useCallback(async (sub: PushSubscription, village: string) => {
    const res = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ subscription: sub.toJSON(), village }),
    });
    const data = (await res.json()) as { ok: boolean; error?: string };
    if (!data.ok) throw new Error(data.error || 'Naročnina ni uspela.');
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const ua = navigator.userAgent;
      const isIos = /iPhone|iPad|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      const standalone =
        window.matchMedia?.('(display-mode: standalone)').matches ||
        (navigator as unknown as { standalone?: boolean }).standalone === true;
      const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
      if (!supported) {
        if (!cancelled) setStatus(isIos && !standalone ? 'ios-install' : 'unsupported');
        return;
      }
      if (Notification.permission === 'denied') {
        if (!cancelled) setStatus('denied');
        return;
      }
      try {
        const reg = await getReg();
        const sub = await reg.pushManager.getSubscription();
        if (cancelled) return;
        if (sub && Notification.permission === 'granted') {
          const v = lsGet(LS_VILLAGE) || villageId;
          setSubVillage(v);
          setStatus('on');
          // tiho osveži zapis na strežniku (npr. po selitvi baze ali zamenjavi ključev)
          post(sub, v).catch(() => undefined);
        } else {
          setStatus('off');
        }
      } catch {
        if (!cancelled) setStatus('unsupported');
      }
    })();
    return () => { cancelled = true; };
    // samo ob nalaganju
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const subscribe = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') {
        setStatus(perm === 'denied' ? 'denied' : 'off');
        return;
      }
      const keyRes = await fetch('/api/push/key');
      const key = (await keyRes.json()) as { ok: boolean; publicKey?: string };
      if (!key.ok || !key.publicKey) throw new Error('Strežnik nima nastavljenih ključev za push.');
      const reg = await getReg();
      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(key.publicKey) as BufferSource,
        });
      }
      await post(sub, villageId);
      lsSet(LS_VILLAGE, villageId);
      setSubVillage(villageId);
      setStatus('on');
      setMsg({ kind: 'ok', text: `Obvestila so vklopljena za kraj ${villageName(villageId)}. Pritisni »Preizkusi«, da preveriš.` });
    } catch (e) {
      setMsg({ kind: 'err', text: e instanceof Error ? e.message : 'Vklop ni uspel.' });
    } finally {
      setBusy(false);
    }
  };

  const switchVillage = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const reg = await getReg();
      const sub = await reg.pushManager.getSubscription();
      if (!sub) throw new Error('Naročnine ni več — vklopi obvestila znova.');
      await post(sub, villageId);
      lsSet(LS_VILLAGE, villageId);
      setSubVillage(villageId);
      setMsg({ kind: 'ok', text: `Kraj preklopljen na ${villageName(villageId)}.` });
    } catch (e) {
      setMsg({ kind: 'err', text: e instanceof Error ? e.message : 'Preklop ni uspel.' });
    } finally {
      setBusy(false);
    }
  };

  const unsubscribe = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const reg = await getReg();
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch('/api/push/subscribe', {
          method: 'DELETE',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        }).catch(() => undefined);
        await sub.unsubscribe();
      }
      lsSet(LS_VILLAGE, null);
      setSubVillage(null);
      setStatus('off');
      setMsg({ kind: 'ok', text: 'Obvestila na tej napravi so izklopljena.' });
    } catch (e) {
      setMsg({ kind: 'err', text: e instanceof Error ? e.message : 'Izklop ni uspel.' });
    } finally {
      setBusy(false);
    }
  };

  const test = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const reg = await getReg();
      const sub = await reg.pushManager.getSubscription();
      if (!sub) throw new Error('Naprava nima naročnine — vklopi obvestila znova.');
      const res = await fetch('/api/push/test', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ endpoint: sub.endpoint }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string; unsubscribed?: boolean };
      if (data.ok) {
        setMsg({ kind: 'ok', text: 'Preizkusno obvestilo je poslano — v nekaj sekundah bi moralo prispeti.' });
      } else {
        if (data.unsubscribed) {
          await sub.unsubscribe().catch(() => undefined);
          setStatus('off');
          setSubVillage(null);
        }
        setMsg({ kind: 'err', text: data.error || 'Preizkus ni uspel.' });
      }
    } catch (e) {
      setMsg({ kind: 'err', text: e instanceof Error ? e.message : 'Preizkus ni uspel.' });
    } finally {
      setBusy(false);
    }
  };

  const btn =
    'inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-bold min-h-[48px] disabled:opacity-60 transition-opacity';
  const solid = `${btn} bg-on-accent text-white`;
  const outline = `${btn} border-2 border-on-accent text-on-accent`;

  if (status === 'loading') return null;

  return (
    <div className="mt-6 pt-6 border-t border-on-accent/25">
      <div className="flex items-center gap-2 text-on-accent text-xs uppercase tracking-[0.25em] mb-3">
        <BellRing className="w-4 h-4" /> Obvestila na telefonu (push)
      </div>

      {status === 'unsupported' && (
        <p className="text-sm font-medium">Ta brskalnik ne podpira push obvestil. Poskusi s Chromom ali Firefoxom.</p>
      )}

      {status === 'ios-install' && (
        <p className="text-sm font-medium">
          Na iPhonu push deluje le, če aplikacijo najprej namestiš: v Safariju pritisni{' '}
          <strong>Deli → Dodaj na domači zaslon</strong>, odpri jo z ikone in tu vklopi obvestila (iOS 16.4 ali novejši).
        </p>
      )}

      {status === 'denied' && (
        <p className="text-sm font-medium">
          Obvestila so v brskalniku blokirana. Dovoli jih v nastavitvah strani (ikona ključavnice ob naslovu) in osveži stran.
        </p>
      )}

      {status === 'off' && (
        <>
          <p className="text-sm font-medium mb-3">
            Brez e-pošte: opomnik <strong>dan pred odvozom</strong> kar na zaslon telefona. Velja za kraj{' '}
            <strong>{villageName(villageId)}</strong>.
          </p>
          <button type="button" onClick={subscribe} disabled={busy} className={solid}>
            <BellRing className="w-4 h-4" /> {busy ? 'Vklapljam …' : 'Vklopi obvestila na tej napravi'}
          </button>
        </>
      )}

      {status === 'on' && (
        <>
          <p className="text-sm font-medium mb-3">
            Obvestila so vklopljena za kraj <strong>{villageName(subVillage ?? villageId)}</strong>.
          </p>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={test} disabled={busy} className={solid}>
              <Send className="w-4 h-4" /> Preizkusi
            </button>
            {subVillage && subVillage !== villageId && (
              <button type="button" onClick={switchVillage} disabled={busy} className={outline}>
                Preklopi na {villageName(villageId)}
              </button>
            )}
            <button type="button" onClick={unsubscribe} disabled={busy} className={outline}>
              <BellOff className="w-4 h-4" /> Izklopi
            </button>
          </div>
        </>
      )}

      {msg && (
        <p role="status" className={`mt-3 text-sm font-semibold ${msg.kind === 'err' ? 'underline decoration-wavy' : ''}`}>
          {msg.text}
        </p>
      )}
    </div>
  );
}
