'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, KeyRound, Loader2, Lock } from 'lucide-react';

export const dynamic = 'force-dynamic';

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const back = params.get('nazaj') || '/admin';
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (data.ok) {
        router.replace(back.startsWith('/') ? back : '/admin');
        router.refresh();
      } else {
        setError(data.error || 'Prijava ni uspela.');
        setPassword('');
      }
    } catch {
      setError('Napaka povezave. Poskusi znova.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="w-full max-w-sm">
      <div className="rounded-3xl border border-paper-200 bg-card p-7 sm:p-9 shadow-[0_24px_60px_-30px_rgba(18,58,39,0.35)]">
        <span className="grid place-items-center w-14 h-14 rounded-2xl bg-lime-400 text-pine-950 mb-5">
          <Lock className="w-7 h-7" />
        </span>
        <h1 className="font-display text-3xl text-pine-950 mb-1">Zaledje</h1>
        <p className="text-sm text-ink-soft mb-6">Za urejanje koledarja in obvestil vnesi geslo.</p>

        <label className="block">
          <span className="block text-xs uppercase tracking-wider text-ink-soft mb-1.5">Geslo</span>
          <div className="relative">
            <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-faint pointer-events-none" />
            <input
              type="password"
              autoFocus
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-2xl border border-paper-300 bg-white pl-12 pr-4 py-3.5 text-base text-ink focus:outline-none focus:border-lime-600 focus:ring-2 focus:ring-lime-400/40 min-h-[54px]"
              placeholder="••••••••"
            />
          </div>
        </label>

        {error && (
          <p className="mt-3 text-sm font-medium text-coral-700" role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy || !password}
          className="mt-5 w-full inline-flex items-center justify-center gap-2 rounded-full bg-pine-950 text-white px-6 py-3.5 font-semibold hover:bg-pine-900 active:scale-[0.98] transition-all disabled:opacity-50 min-h-[52px]"
        >
          {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <Lock className="w-5 h-5" />}
          Prijava
        </button>
      </div>

      <Link
        href="/"
        className="mt-5 inline-flex items-center gap-2 text-sm text-ink-soft hover:text-ink transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Nazaj na koledar
      </Link>
    </form>
  );
}

export default function AdminLoginPage() {
  return (
    <main className="min-h-screen grid place-items-center safe-x py-12">
      <Suspense fallback={<Loader2 className="w-6 h-6 animate-spin text-pine-600" />}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
