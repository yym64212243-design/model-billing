'use client';

import Link from 'next/link';
import { useT } from '@/lib/locale';

export default function HomeFooter() {
  const t = useT();
  const groups = [
    {
      title: t.footer.product,
      links: [
        { label: t.footer.modelList, href: '#models' },
        { label: t.footer.pricing, href: '#models' },
        { label: t.footer.apiKeys, href: '/openclaw/keys' },
      ],
    },
    {
      title: t.footer.developer,
      links: [
        { label: t.footer.quickstart, href: '#quickstart' },
        { label: t.footer.apiDocs, href: '#quickstart' },
        { label: t.footer.dashboard, href: '/openclaw' },
      ],
    },
    {
      title: t.footer.company,
      links: [
        { label: t.footer.about, href: '#' },
        { label: t.footer.terms, href: '#' },
        { label: t.footer.privacy, href: '#' },
      ],
    },
    {
      title: t.footer.contact,
      links: [
        { label: t.footer.github, href: '#' },
        { label: t.footer.email, href: '#' },
      ],
    },
  ];

  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 via-indigo-500 to-violet-500 text-xs font-bold text-white shadow-lg shadow-indigo-200/70">
                OC
              </div>
              <div>
                <span className="block text-[15px] font-semibold text-gray-900">OpenClaw</span>
                <span className="block text-xs text-slate-500">{t.footer.tagline}</span>
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-500">{t.footer.description}</p>
            <p className="mt-4 text-sm leading-relaxed text-slate-400">&copy; {new Date().getFullYear()} OpenClaw</p>
          </div>

          {groups.map((g) => (
            <div key={g.title}>
              <h3 className="text-[13px] font-semibold text-gray-900">{g.title}</h3>
              <ul className="mt-3 space-y-2.5">
                {g.links.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className="link-focus text-sm text-gray-500 transition-colors hover:text-gray-900">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </footer>
  );
}
