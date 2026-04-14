'use client';

import { Suspense, useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import AuthShell from '@/components/AuthShell';
import { useT } from '@/lib/locale';

function LoginForm() {
  const t = useT();
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') ?? '/openclaw';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });
      if (result?.error) {
        setError(t.auth.invalidCredentials);
        setLoading(false);
        return;
      }
      router.push(callbackUrl);
      router.refresh();
    } catch {
      setError(t.auth.genericError);
      setLoading(false);
    }
  };

  return (
    <AuthShell
      mode="login"
      title={t.auth.loginTitle}
      subtitle={t.auth.loginSubtitle}
      footer={
        <p className="text-center text-sm text-slate-500">
          {t.auth.noAccount}{' '}
          <Link
            href={`/register?callbackUrl=${encodeURIComponent(callbackUrl)}`}
            className="font-semibold text-sky-700 transition hover:text-sky-800"
          >
            {t.auth.signUp}
          </Link>
        </p>
      }
    >
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-slate-950">{t.auth.loginTitle}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">{t.auth.loginSubtitle}</p>
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
        <div>
          <div className="flex items-center justify-between gap-3">
            <label htmlFor="password" className="block text-sm font-medium text-slate-700">
              {t.auth.password}
            </label>
            <Link
              href={`/forgot-password?callbackUrl=${encodeURIComponent(callbackUrl)}`}
              className="text-sm font-medium text-sky-700 transition hover:text-sky-800"
            >
              {t.auth.forgotPassword}
            </Link>
          </div>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
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
          {loading ? t.auth.loginSubmitting : t.auth.loginSubmit}
        </button>
      </form>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-slate-500">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
