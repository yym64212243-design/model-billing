'use client';

import Link from 'next/link';
import { useT } from '@/lib/locale';
import HomeFooter from '@/components/HomeFooter';
import FloatingBrands from '@/components/FloatingBrands';
import BrandCarousel from '@/components/BrandCarousel';
import ProviderLogo from '@/components/ProviderLogo';

const FEATURED_MODELS = [
  { name: 'Claude 4 Opus', logo: 'claude' as const, providerLabel: 'anthropic', tokens: '1.0T', trend: -13.15 },
  { name: 'GPT-4o', logo: 'openai' as const, providerLabel: 'openai', tokens: '351.3B', trend: 2.84 },
  { name: 'Gemini 2.5 Pro', logo: 'google' as const, providerLabel: 'google', tokens: '301.9B', trend: -6.5 },
];

const FEATURE_LINK_HREFS = ['#models', '#quickstart', '#models', '#quickstart'] as const;

function featureVisuals(perfBars: { w: string; label: string }[]) {
  return [
    <div key="v0" className="mb-4 grid grid-cols-4 gap-2">
      {['openai', 'anthropic', 'google', 'meta', 'mistral', 'gemini', 'claude', 'perplexity'].map((p, i) => (
        <div key={i} className="flex h-9 w-9 items-center justify-center">
          <ProviderLogo provider={p} size={32} className="logo-hover cursor-pointer" />
        </div>
      ))}
    </div>,
    <div key="v1" className="mb-4 flex items-end gap-1.5">
      {[40, 65, 50, 80, 70, 90, 85, 95].map((h, i) => (
        <div key={i} className="w-5 rounded-t bg-gradient-to-t from-gray-200 to-gray-100" style={{ height: `${h}px` }} />
      ))}
    </div>,
    <div key="v2" className="mb-4 space-y-2">
      {perfBars.map((b) => (
        <div key={b.label}>
          <div className="mb-1 flex justify-between text-[11px] text-gray-400">
            <span>{b.label}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
            <div className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-purple-400" style={{ width: b.w }} />
          </div>
        </div>
      ))}
    </div>,
    <div key="v3" className="mb-4 flex items-center justify-center gap-3">
      <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-gray-200 text-gray-300">
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
          />
        </svg>
      </div>
      <svg className="h-4 w-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
          clipRule="evenodd"
        />
      </svg>
      <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-gray-200 text-gray-300">
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"
          />
        </svg>
      </div>
    </div>,
  ];
}

const stepIcons = [
  <svg key="i1" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
    />
  </svg>,
  <svg key="i2" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z"
    />
  </svg>,
  <svg key="i3" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5" />
  </svg>,
];

export default function HomePageMain() {
  const t = useT();
  const visuals = featureVisuals([...t.home.perfBars]);

  const codeSample = `from openai import OpenAI

client = OpenAI(
    base_url="https://your-domain.com/v1",
    api_key="gk_your_api_key"
)

response = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "${t.home.codeComment}"}]
)`;

  return (
    <>
      <section
        className="hero-with-float relative overflow-hidden pb-16 pt-28 sm:pb-20 sm:pt-36 lg:min-h-[560px]"
        style={{ position: 'relative', overflow: 'hidden' }}
      >
        <FloatingBrands />

        <div className="relative z-10 mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
          <h1 className="text-[38px] font-semibold leading-[1.06] tracking-[-0.02em] text-gray-950 sm:text-[52px] sm:leading-[1.08] lg:text-[64px] lg:tracking-[-0.03em]">
            The Unified Interface
            <br />
            For LLMs
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-gray-500 sm:mt-8 sm:text-lg">
            {t.home.heroBeforePrice}
            <a
              href="#models"
              className="link-focus text-indigo-600 underline decoration-indigo-200 underline-offset-[3px] transition-colors hover:text-indigo-700 hover:decoration-indigo-400"
            >
              {t.home.heroPriceWord}
            </a>
            {t.home.heroBetween}
            <a
              href="#features"
              className="link-focus text-indigo-600 underline decoration-indigo-200 underline-offset-[3px] transition-colors hover:text-indigo-700 hover:decoration-indigo-400"
            >
              {t.home.heroAvailWord}
            </a>
            {t.home.heroAfter}
          </p>
          <div className="mt-8 flex max-w-md flex-col items-stretch justify-center gap-3 sm:mx-auto sm:mt-10 sm:max-w-none sm:flex-row sm:items-center sm:justify-center">
            <Link
              href="/openclaw/keys"
              className="btn-primary inline-flex h-11 w-full items-center justify-center rounded-lg bg-gray-900 px-8 text-[15px] font-medium text-white shadow-sm sm:w-auto sm:min-w-[10.5rem]"
            >
              {t.home.ctaKey}
            </Link>
            <a
              href="#models"
              className="btn-secondary group inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-8 text-[15px] font-medium text-gray-700 shadow-sm sm:w-auto"
            >
              {t.home.ctaModels}
              <BrandCarousel />
            </a>
          </div>
        </div>
      </section>

      <section className="pb-16 sm:pb-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-6 rounded-2xl border border-gray-200 bg-gray-50/70 p-6 sm:grid-cols-4 sm:p-8">
            {t.home.stats.map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">{s.value}</p>
                <p className="mt-1 text-xs font-medium text-gray-500">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="border-t border-gray-100 bg-gray-50/60 py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center md:mb-16">
            <h2 className="text-2xl font-semibold tracking-[-0.02em] text-gray-900 sm:text-3xl">{t.home.featuresTitle}</h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-gray-500 sm:text-base">{t.home.featuresSubtitle}</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {t.home.features.map((f, i) => (
              <div
                key={f.title}
                className="card-hover flex h-full flex-col justify-between rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8"
              >
                <div>
                  {visuals[i]}
                  <h3 className="text-base font-semibold tracking-tight text-gray-900">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-500">{f.desc}</p>
                </div>
                <a
                  href={FEATURE_LINK_HREFS[i]}
                  className="link-focus arrow-hover mt-5 inline-flex w-fit items-center gap-1 rounded-md text-sm font-medium text-indigo-600 hover:text-indigo-700"
                >
                  {f.link}
                  <svg className="arrow-icon h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                  </svg>
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="models" className="py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-xl font-semibold tracking-[-0.02em] text-gray-900 sm:text-2xl">
                {t.home.featuredModelsTitle}
                <svg className="h-4 w-4 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                </svg>
              </h2>
              <p className="mt-2 text-sm text-gray-500 sm:mt-1">{t.home.modelsSubtitle}</p>
            </div>
            <a
              href="#models"
              className="link-focus arrow-hover inline-flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-gray-900 sm:self-auto"
            >
              {t.home.viewAll} <span aria-hidden="true" className="arrow-icon inline-block">&rarr;</span>
            </a>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:mt-12 lg:grid-cols-3">
            {FEATURED_MODELS.map((m) => (
              <div key={m.name} className="card-hover group rounded-xl border border-gray-200 bg-white p-5 sm:p-6">
                <div className="flex items-center gap-3">
                  <ProviderLogo provider={m.logo} size={40} className="logo-hover" />
                  <div className="min-w-0">
                    <h3 className="truncate text-[15px] font-semibold text-gray-900">{m.name}</h3>
                    <p className="text-xs text-gray-400">by {m.providerLabel}</p>
                  </div>
                </div>
                <div className="mt-5 border-t border-gray-100 pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-medium text-gray-400">{t.home.tokensLabel}</p>
                      <p className="text-lg font-semibold text-gray-900">{m.tokens}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] font-medium text-gray-400">{t.home.trendLabel}</p>
                      <p className={`text-lg font-semibold ${m.trend >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                        {m.trend >= 0 ? '+' : ''}
                        {m.trend}%
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="quickstart" className="border-t border-gray-100 bg-gray-50/60 py-16 md:py-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-2xl font-semibold tracking-[-0.02em] text-gray-900 sm:text-3xl">{t.home.quickstartTitle}</h2>
            <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-gray-500">{t.home.quickstartSubtitle}</p>
          </div>

          <div className="mt-10 grid gap-6 sm:mt-12 sm:grid-cols-3">
            {t.home.steps.map((s, i) => (
              <div key={s.title} className="card-hover rounded-xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">{stepIcons[i]}</div>
                <div className="mt-4 flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-900 text-xs font-bold text-white">
                    {i + 1}
                  </span>
                  <h3 className="text-[15px] font-semibold text-gray-900">{s.title}</h3>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-gray-500">{s.desc}</p>
              </div>
            ))}
          </div>

          <div className="mx-auto mt-12 max-w-3xl overflow-hidden rounded-xl border border-gray-200 bg-gray-900 shadow-lg sm:mt-14">
            <div className="flex items-center gap-2 border-b border-gray-800 px-4 py-3 sm:px-5">
              <span className="h-3 w-3 rounded-full bg-[#FF5F57]" />
              <span className="h-3 w-3 rounded-full bg-[#FEBC2E]" />
              <span className="h-3 w-3 rounded-full bg-[#28C840]" />
              <span className="ml-3 text-xs text-gray-500">quickstart.py</span>
            </div>
            <pre className="overflow-x-auto p-5 text-[13px] leading-relaxed sm:p-6">
              <code className="text-gray-300">{codeSample}</code>
            </pre>
          </div>

          <div className="mt-10 text-center sm:mt-12">
            <Link
              href="/register"
              className="btn-primary arrow-hover inline-flex h-11 items-center gap-2 rounded-lg bg-gray-900 px-8 text-sm font-medium text-white shadow-sm"
            >
              {t.home.registerCta}
              <svg className="arrow-icon h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      <HomeFooter />
    </>
  );
}
