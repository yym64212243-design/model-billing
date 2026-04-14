'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import AuthShell from '@/components/AuthShell';
import { useT } from '@/lib/locale';

function ForgotForm() {
  const t = useT();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') ?? '/openclaw';
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [devResetUrl, setDevResetUrl] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setDevResetUrl(null);
    setMessage(null);
    setLoading(true);
    try {
      const response = await fetch('/api/account/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(typeof data.error === 'string' ? data.error : t.auth.requestFailed);
        setLoading(false);
        return;
      }
      setDone(true);
      if (typeof data.devResetUrl === 'string') {
        setDevResetUrl(data.devResetUrl);
      }
      if (typeof data.message === 'string') {
        setMessage(data.message);
      }
    } catch {
      setError(t.auth.genericError);
    }
    setLoading(false);
  };

  if (done) {
    return (
      <AuthShell
        mode="login"
        title={t.auth.checkEmailTitle}
        subtitle={message ?? t.auth.checkEmailSubtitle}
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
          <h2 className="text-2xl font-semibold tracking-tight text-slate-950">{t.auth.checkEmailTitle}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            {message ?? t.auth.checkEmailSubtitle}
          </p>
        </div>
        {devResetUrl ? (
          <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-900">
            <p className="font-semibold">{t.auth.developmentMode}</p>
            <p className="mt-2 break-all">
              <a href={devResetUrl} className="font-medium underline">
                {t.auth.openResetLink}
              </a>
            </p>
          </div>
        ) : null}
      </AuthShell>
    );
  }

  return (
    <AuthShell
      mode="login"
      title={t.auth.forgotTitle}
      subtitle={t.auth.forgotSubtitle}
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
        <h2 className="text-2xl font-semibold tracking-tight text-slate-950">{t.auth.forgotTitle}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">{t.auth.forgotSubtitle}</p>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-700">
            {t.auth.email}
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
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
          {loading ? t.auth.forgotSubmitting : t.auth.forgotSubmit}
        </button>
      </form>
    </AuthShell>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-slate-500">Loading...</div>}>
      <ForgotForm />
    </Suspense>
  );
}
