'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useT } from '@/lib/locale';
import LanguageToggle from '@/components/LanguageToggle';

export default function HomeNav() {
  const [open, setOpen] = useState(false);
  const t = useT();
  const navLinks = [
    { label: t.nav.models, href: '#models' },
    { label: t.nav.features, href: '#features' },
    { label: t.nav.pricing, href: '#models' },
    { label: t.nav.docs, href: '#quickstart' },
  ];

  return (
    <nav className="fixed top-0 z-50 w-full border-b border-slate-200/80 bg-white/78 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="link-focus flex shrink-0 items-center gap-3 rounded-md"
        >
          <div className="nav-logo-mark flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 via-indigo-500 to-violet-500 text-sm font-bold text-white shadow-lg shadow-indigo-200/70">
            MB
          </div>
          <div className="min-w-0">
            <span className="block text-[17px] font-semibold tracking-tight text-gray-900">
              ModelBilling
            </span>
            <span className="hidden text-xs text-slate-500 lg:block">{t.nav.status}</span>
          </div>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {navLinks.map((l) => (
            <a
              key={l.label}
              href={l.href}
              className="link-focus rounded-md px-1 py-1 text-[14px] font-medium text-gray-500 transition-colors hover:text-gray-900"
            >
              {l.label}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/openclaw"
            className="rounded-full border border-slate-200 bg-slate-50/80 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600 transition hover:bg-white hover:text-slate-900"
          >
            {t.nav.dashboard}
          </Link>
          <LanguageToggle className="mr-1" />
          <Link
            href="/login"
            className="link-focus rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
          >
            {t.nav.login}
          </Link>
          <Link
            href="/register"
            className="btn-primary inline-flex h-10 items-center rounded-xl bg-gray-900 px-4 text-sm font-medium text-white shadow-sm"
          >
            {t.nav.register}
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="link-focus inline-flex items-center justify-center rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 md:hidden"
          aria-label="Toggle menu"
        >
          {open ? (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {open && (
        <div className="border-t border-gray-100 bg-white px-4 pb-4 pt-2 md:hidden">
          <div className="mb-3 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-center text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">
            {t.nav.status}
          </div>
          {navLinks.map((l) => (
            <a
              key={l.label}
              href={l.href}
              onClick={() => setOpen(false)}
              className="link-focus block rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            >
              {l.label}
            </a>
          ))}
          <div className="mt-3 flex flex-col gap-2 border-t border-gray-100 pt-3">
            <div className="flex justify-center px-3 py-2">
              <LanguageToggle />
            </div>
            <Link
              href="/openclaw"
              className="link-focus rounded-lg px-3 py-2.5 text-center text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              {t.nav.dashboard}
            </Link>
            <Link
              href="/login"
              className="link-focus rounded-lg px-3 py-2.5 text-center text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              {t.nav.login}
            </Link>
            <Link
              href="/register"
              className="btn-primary flex items-center justify-center rounded-lg bg-gray-900 px-3 py-2.5 text-center text-sm font-medium text-white"
            >
              {t.nav.register}
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
