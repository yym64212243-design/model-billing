'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { useState, useMemo } from 'react';
import { useT } from '@/lib/locale';
import LanguageToggle from '@/components/LanguageToggle';

export default function DashboardSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const t = useT();

  const navItems = useMemo(
    () => [
      {
        label: t.sidebar.overview,
        href: '/openclaw',
        icon: (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25a2.25 2.25 0 0 1-2.25-2.25v-2.25Z" />
          </svg>
        ),
      },
      {
        label: t.sidebar.apiKeys,
        href: '/openclaw/keys',
        icon: (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z" />
          </svg>
        ),
      },
      {
        label: t.sidebar.activity,
        href: '/openclaw/activity',
        icon: (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
          </svg>
        ),
      },
      {
        label: t.sidebar.credits,
        href: '/openclaw/credits',
        icon: (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" />
          </svg>
        ),
      },
    ],
    [t]
  );

  const isActive = (href: string) => {
    if (href === '/openclaw') return pathname === '/openclaw';
    return pathname.startsWith(href);
  };

  const sidebar = (
    <div className="flex h-full flex-col border-r border-slate-200/70 bg-white/90 text-slate-900 backdrop-blur-xl">
      <div className="px-5 pb-5 pt-6">
        <div className="flex items-center justify-between gap-2">
          <Link href="/openclaw" className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 via-indigo-500 to-violet-500 text-sm font-bold text-white shadow-lg shadow-indigo-200/70">
              OC
            </div>
            <div className="min-w-0">
              <span className="block truncate text-lg font-semibold tracking-tight">OpenClaw</span>
              <span className="block truncate text-xs text-slate-500">{t.sidebar.workspaceHint}</span>
            </div>
          </Link>
          <LanguageToggle variant="dark" className="shrink-0 scale-90" />
        </div>
        <div className="mt-5 rounded-2xl border border-sky-100 bg-gradient-to-br from-sky-50 via-white to-indigo-50 p-4 shadow-sm shadow-sky-100/70">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-700">
            {t.sidebar.workspaceLabel}
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-600">{t.sidebar.workspaceHint}</p>
          <Link
            href="/openclaw/credits"
            className="mt-4 inline-flex items-center rounded-xl bg-slate-950 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
          >
            {t.sidebar.topUpAction}
          </Link>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-2">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition ${
              isActive(item.href)
                ? 'bg-slate-950 text-white shadow-lg shadow-slate-200/70'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
            }`}
          >
            {item.icon}
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="border-t border-slate-200 px-4 py-4">
        {session?.user?.email && (
          <p className="mb-3 truncate text-xs text-slate-500">{session.user.email}</p>
        )}
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: '/' })}
          className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
          </svg>
          {t.sidebar.signOut}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <div className="fixed left-0 right-0 top-0 z-40 flex h-14 items-center border-b border-slate-200 bg-white/90 px-4 backdrop-blur lg:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="rounded-xl p-2 text-slate-600 hover:bg-slate-100"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </button>
        <span className="ml-3 text-sm font-semibold text-slate-950">{t.sidebar.mobileTitle}</span>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="relative h-full w-72 max-w-[85vw]">{sidebar}</div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="fixed inset-y-0 left-0 z-30 hidden w-72 lg:block">{sidebar}</div>
    </>
  );
}
