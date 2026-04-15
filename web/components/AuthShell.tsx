'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { useT } from '@/lib/locale';

interface AuthShellProps {
  mode: 'login' | 'register';
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}

export default function AuthShell({
  mode,
  title,
  subtitle,
  children,
  footer,
}: AuthShellProps) {
  const t = useT();
  const primaryList =
    mode === 'login' ? t.auth.highlights : t.auth.afterLoginItems;

  return (
    <div className="relative min-h-screen overflow-hidden bg-[linear-gradient(180deg,#f8fbff_0%,#eff6ff_48%,#f8fafc_100%)]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-5rem] top-[-4rem] h-72 w-72 rounded-full bg-sky-200/40 blur-3xl" />
        <div className="absolute right-[-6rem] top-24 h-80 w-80 rounded-full bg-indigo-200/30 blur-3xl" />
        <div className="absolute bottom-[-8rem] left-1/3 h-80 w-80 rounded-full bg-emerald-100/50 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-4 pb-10 pt-6 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="inline-flex items-center gap-3 rounded-xl px-2 py-2 text-slate-900">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 via-indigo-500 to-violet-500 text-sm font-bold text-white shadow-lg shadow-indigo-200/70">
              MB
            </div>
            <div>
              <p className="text-base font-semibold tracking-tight">ModelBilling</p>
              <p className="text-xs text-slate-500">{t.nav.status}</p>
            </div>
          </Link>
          <Link
            href="/"
            className="rounded-xl border border-slate-200 bg-white/80 px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-white hover:text-slate-900"
          >
            {t.auth.homeLink}
          </Link>
        </div>

        <div className="mt-10 grid flex-1 gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <section className="max-w-2xl py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.26em] text-sky-700">
              {t.auth.trustLabel}
            </p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
              {title}
            </h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-slate-600">
              {subtitle}
            </p>

            <div className="mt-8 grid gap-3">
              {primaryList.map((item, index) => (
                <div
                  key={item}
                  className="flex items-start gap-3 rounded-2xl border border-white/70 bg-white/75 px-4 py-4 shadow-sm shadow-slate-200/50 backdrop-blur"
                >
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-sm font-semibold text-white">
                    {index + 1}
                  </span>
                  <p className="text-sm leading-6 text-slate-600">{item}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 rounded-[28px] border border-slate-200/80 bg-slate-950 p-6 text-white shadow-xl shadow-slate-200/70">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-200">
                {t.auth.highlightsTitle}
              </p>
              <div className="mt-4 space-y-3">
                {t.auth.highlights.map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <span className="mt-1 h-2.5 w-2.5 rounded-full bg-sky-300" />
                    <p className="text-sm leading-6 text-slate-200">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="lg:justify-self-end lg:w-full lg:max-w-[30rem]">
            <div className="rounded-[30px] border border-white/80 bg-white/92 p-6 shadow-2xl shadow-slate-200/70 backdrop-blur sm:p-8">
              {children}
              <div className="mt-6 border-t border-slate-200 pt-5">{footer}</div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
