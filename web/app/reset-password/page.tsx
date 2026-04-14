'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import AuthShell from '@/components/AuthShell';
import { useT } from '@/lib/locale';

function ResetForm() {
  const t = useT();
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') ?? '/openclaw';
  const tokenFromUrl = searchParams.get('token') ?? '';
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (tokenFromUrl) setToken(tokenFromUrl);
  }, [tokenFromUrl]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await fetch('/api/account/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(typeof data.error === 'string' ? data.error : t.auth.resetFailed);
        setLoading(false);
        return;
      }
      router.push(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
      router.refresh();
    } catch {
      setError(t.auth.genericError);
      setLoading(false);
    }
  };

  return (
    <AuthShell
      mode="register"
      title={t.auth.resetTitle}
      subtitle={t.auth.resetSubtitle}
      footer={
        <p className="text-center text-sm text-slate-500">
          <Link
            href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`}
            className="font-semibold text-sky-700 transition hover:text-sky-800"
          >
            {t.auth.backToLogin}
          </Link>
        </p>
      }
    >
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-slate-950">{t.auth.resetTitle}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">{t.auth.resetSubtitle}</p>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <div>
          <label htmlFor="token" className="block text-sm font-medium text-slate-700">
            {t.auth.resetToken}
          </label>
          <input
            id="token"
            type="text"
            value={token}
            onChange={(event) => setToken(event.target.value)}
            required
            autoComplete="off"
            placeholder={t.auth.resetTokenPlaceholder}
            className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 font-mono text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-slate-700">
            {t.auth.newPassword}
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            minLength={6}
            className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
          />
        </div>
        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-2xl bg-slate-950 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
        >
          {loading ? t.auth.resetSubmitting : t.auth.resetSubmit}
        </button>
      </form>
    </AuthShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-slate-500">Loading...</div>}>
      <ResetForm />
    </Suspense>
  );
}
