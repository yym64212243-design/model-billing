'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import DashboardPageHeader from '@/components/DashboardPageHeader';
import ErrorNotice from '@/components/ErrorNotice';
import StatCard from '@/components/StatCard';
import { fetchJsonOrThrow, getErrorMessage } from '@/lib/client-api';
import { useT } from '@/lib/locale';

type LedgerItem = {
  id: string;
  type: string;
  changeAmount: number;
  balanceAfter: number;
  note: string | null;
  createdAt: string;
};

type UsageLog = {
  ID: number;
  Model: string;
  PromptTokens: number;
  CompletionTokens: number;
  TotalTokens: number;
  CostCredits: number;
  CreatedAt: string;
};

type OverviewErrors = {
  balance?: string;
  ledger?: string;
  usage?: string;
};

function formatDelta(n: number) {
  const sign = n >= 0 ? '+' : '';
  return `${sign}${n.toLocaleString()}`;
}

function formatDateTime(value?: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleString();
}

function createMetricIcon(path: string) {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d={path} />
    </svg>
  );
}

export default function OverviewPage() {
  const t = useT();
  const [credits, setCredits] = useState(0);
  const [ledger, setLedger] = useState<LedgerItem[]>([]);
  const [logs, setLogs] = useState<UsageLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<OverviewErrors>({});

  const loadOverview = useCallback(async () => {
    setLoading(true);

    const nextErrors: OverviewErrors = {};
    const [balanceResult, ledgerResult, usageResult] = await Promise.allSettled([
      fetchJsonOrThrow<{ credits?: number }>(
        '/api/user/balance',
        undefined,
        'Failed to load your current balance.'
      ),
      fetchJsonOrThrow<{ items?: LedgerItem[] }>(
        '/api/user/ledger?take=8',
        undefined,
        'Failed to load recent account activity.'
      ),
      fetchJsonOrThrow<{ logs?: UsageLog[] }>(
        '/api/user/usage',
        undefined,
        'Failed to load recent API usage.'
      ),
    ]);

    if (balanceResult.status === 'fulfilled') {
      setCredits(balanceResult.value.credits ?? 0);
    } else {
      nextErrors.balance = getErrorMessage(
        balanceResult.reason,
        'Failed to load your current balance.'
      );
    }

    if (ledgerResult.status === 'fulfilled') {
      setLedger(ledgerResult.value.items ?? []);
    } else {
      nextErrors.ledger = getErrorMessage(
        ledgerResult.reason,
        'Failed to load recent account activity.'
      );
    }

    if (usageResult.status === 'fulfilled') {
      setLogs(usageResult.value.logs ?? []);
    } else {
      nextErrors.usage = getErrorMessage(
        usageResult.reason,
        'Failed to load recent API usage.'
      );
    }

    setErrors(nextErrors);
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadOverview();
  }, [loadOverview]);

  const sortedLedger = useMemo(
    () => [...ledger].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)),
    [ledger]
  );
  const sortedLogs = useMemo(
    () => [...logs].sort((a, b) => +new Date(b.CreatedAt) - +new Date(a.CreatedAt)),
    [logs]
  );

  const totalRequests = sortedLogs.length;
  const totalTokens = sortedLogs.reduce((sum, item) => sum + item.TotalTokens, 0);
  const totalCost = sortedLogs.reduce((sum, item) => sum + item.CostCredits, 0);
  const averageTokens = totalRequests > 0 ? Math.round(totalTokens / totalRequests) : 0;
  const latestUsage = sortedLogs[0];
  const latestLedger = sortedLedger[0];
  const topModelEntry = Object.entries(
    sortedLogs.reduce<Record<string, number>>((acc, item) => {
      const key = item.Model || 'unknown';
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {})
  ).sort((a, b) => b[1] - a[1])[0];
  const topModel = topModelEntry?.[0] ?? null;
  const topModelRequests = topModelEntry?.[1] ?? 0;

  const hasAnyError = Object.values(errors).some(Boolean);
  const statusReady = !errors.balance && !errors.usage;
  const errorMessages = Array.from(
    new Set(Object.values(errors).filter((message): message is string => Boolean(message)))
  );

  const quickLinks = [
    { href: '/openclaw/keys', label: t.dashboard.overview.createKey },
    { href: '/openclaw/activity', label: t.dashboard.overview.reviewUsage },
    { href: '/openclaw/credits', label: t.dashboard.overview.topUp },
  ];

  return (
    <div>
      <DashboardPageHeader
        eyebrow={t.dashboard.overview.eyebrow}
        title={t.dashboard.overview.title}
        description={t.dashboard.overview.subtitle}
        actions={
          <>
            <Link
              href="/openclaw/keys"
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              {t.dashboard.overview.createKey}
            </Link>
            <Link
              href="/openclaw/credits"
              className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-slate-200 transition hover:bg-slate-800"
            >
              {t.dashboard.overview.topUp}
            </Link>
          </>
        }
      />

      {loading ? (
        <div className="py-16 text-center text-sm text-slate-500">{t.dashboard.loading}</div>
      ) : (
        <>
          {errorMessages.length > 0 && (
            <div className="mb-6">
              <ErrorNotice
                title="Some account data is unavailable"
                message={errorMessages.join(' ')}
                action={
                  <button
                    type="button"
                    onClick={() => void loadOverview()}
                    className="rounded-lg bg-amber-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-amber-950"
                  >
                    {t.dashboard.retry}
                  </button>
                }
              />
            </div>
          )}

          <section className="overflow-hidden rounded-[28px] border border-slate-200/70 bg-white/85 shadow-xl shadow-slate-200/60 backdrop-blur">
            <div className="grid gap-0 lg:grid-cols-[1.35fr_0.95fr]">
              <div className="bg-[radial-gradient(circle_at_top_left,_rgba(125,211,252,0.28),_transparent_40%),linear-gradient(135deg,#082f49_0%,#0f172a_58%,#172554_100%)] px-6 py-7 text-white sm:px-8">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-200">
                  {t.dashboard.overview.heroTitle}
                </p>
                <div className="mt-4 flex flex-wrap items-end justify-between gap-5">
                  <div>
                    <p className="text-sm text-sky-100/85">{t.dashboard.overview.availableCredits}</p>
                    <p className="mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">
                      {errors.balance ? '—' : credits.toLocaleString()}
                    </p>
                    <p className="mt-3 max-w-md text-sm leading-6 text-sky-100/80">
                      {t.dashboard.overview.heroSubtitle}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur">
                    <p className="text-xs uppercase tracking-[0.2em] text-sky-100/70">
                      {statusReady ? t.dashboard.overview.accountReady : t.dashboard.overview.accountAttention}
                    </p>
                    <p className="mt-2 text-sm font-medium text-white">
                      {statusReady ? t.dashboard.overview.activeNow : errorMessages[0] ?? t.dashboard.overview.spendUnavailable}
                    </p>
                  </div>
                </div>

                <div className="mt-8 grid gap-4 sm:grid-cols-3">
                  <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                    <p className="text-xs text-sky-100/75">{t.dashboard.overview.requests}</p>
                    <p className="mt-2 text-2xl font-semibold">{errors.usage ? '—' : totalRequests.toLocaleString()}</p>
                    <p className="mt-1 text-xs text-sky-100/70">{t.dashboard.overview.allTimeUsage}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                    <p className="text-xs text-sky-100/75">{t.dashboard.overview.spend}</p>
                    <p className="mt-2 text-2xl font-semibold">{errors.usage ? '—' : totalCost.toLocaleString()}</p>
                    <p className="mt-1 text-xs text-sky-100/70">{t.dashboard.overview.allTimeSpend}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                    <p className="text-xs text-sky-100/75">{t.dashboard.overview.avgTokens}</p>
                    <p className="mt-2 text-2xl font-semibold">{errors.usage ? '—' : averageTokens.toLocaleString()}</p>
                    <p className="mt-1 text-xs text-sky-100/70">{t.dashboard.overview.perRequest}</p>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 bg-white px-6 py-7 sm:px-8">
                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                    {t.dashboard.overview.topModel}
                  </p>
                  <p className="mt-3 text-lg font-semibold text-slate-950">
                    {topModel ?? t.dashboard.overview.noUsageYet}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {topModel
                      ? `${topModelRequests.toLocaleString()} ${t.dashboard.overview.callCountLabel.toLowerCase()}`
                      : t.dashboard.overview.noCalls}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-100/80">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                    {t.dashboard.overview.latestUsage}
                  </p>
                  <p className="mt-3 text-sm font-semibold text-slate-950">
                    {latestUsage?.Model || t.dashboard.overview.noUsageYet}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">{formatDateTime(latestUsage?.CreatedAt)}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-100/80">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                    {t.dashboard.overview.latestLedger}
                  </p>
                  <p className="mt-3 text-sm font-semibold text-slate-950">
                    {latestLedger ? `${latestLedger.type} ${formatDelta(latestLedger.changeAmount)}` : t.dashboard.overview.noActivityYet}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">{formatDateTime(latestLedger?.createdAt)}</p>
                </div>
              </div>
            </div>
          </section>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title={t.dashboard.overview.availableCredits}
              value={errors.balance ? t.dashboard.overview.balanceUnavailable : `${credits.toLocaleString()}`}
              subtitle={errors.balance ? t.dashboard.overview.balanceUnavailable : t.dashboard.overview.availableToSpend}
              tone="sky"
              icon={createMetricIcon('M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z')}
            />
            <StatCard
              title={t.dashboard.overview.requests}
              value={errors.usage ? t.dashboard.overview.requestsUnavailable : totalRequests}
              subtitle={errors.usage ? t.dashboard.overview.requestsUnavailable : t.dashboard.overview.allTimeUsage}
              tone="default"
              icon={createMetricIcon('M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z')}
            />
            <StatCard
              title={t.dashboard.overview.spend}
              value={errors.usage ? t.dashboard.overview.spendUnavailable : totalCost}
              subtitle={errors.usage ? t.dashboard.overview.spendUnavailable : `${totalTokens.toLocaleString()} ${t.dashboard.overview.tokenCountLabel.toLowerCase()}`}
              tone="amber"
              icon={createMetricIcon('M12 6v12m0 0 3.75-3.75M12 18l-3.75-3.75M3.75 8.25h16.5')}
            />
            <StatCard
              title={t.dashboard.overview.avgTokens}
              value={errors.usage ? t.dashboard.overview.spendUnavailable : averageTokens}
              subtitle={errors.usage ? t.dashboard.overview.spendUnavailable : t.dashboard.overview.perRequest}
              tone="emerald"
              icon={createMetricIcon('M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z')}
            />
          </div>

          <div className="mt-8 grid gap-6 xl:grid-cols-[1.3fr_1fr]">
            <div className="space-y-6">
              <section className="rounded-[26px] border border-slate-200 bg-white/90 p-6 shadow-lg shadow-slate-200/40">
                <div className="mb-5 flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-950">{t.dashboard.overview.recentActivity}</h2>
                    <p className="mt-1 text-sm text-slate-500">{t.dashboard.overview.recentActivityHint}</p>
                  </div>
                  <Link href="/openclaw/activity" className="text-sm font-medium text-sky-700 hover:text-sky-800">
                    {t.dashboard.overview.viewAll}
                  </Link>
                </div>
                <div className="space-y-3">
                  {errors.ledger ? (
                    <p className="rounded-2xl bg-amber-50 px-4 py-5 text-sm text-amber-800">{errors.ledger}</p>
                  ) : sortedLedger.length === 0 ? (
                    <p className="rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-400">
                      {t.dashboard.overview.noActivity}
                    </p>
                  ) : (
                    sortedLedger.slice(0, 5).map((item) => (
                      <div
                        key={item.id}
                        className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/60 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 ring-1 ring-slate-200">
                              {item.type}
                            </span>
                            <span className={`text-sm font-semibold ${item.changeAmount >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {formatDelta(item.changeAmount)}
                            </span>
                          </div>
                          <p className="mt-2 truncate text-sm text-slate-600">{item.note || '—'}</p>
                        </div>
                        <div className="shrink-0 text-sm text-slate-500 sm:text-right">
                          <p className="font-semibold text-slate-950">{item.balanceAfter.toLocaleString()}</p>
                          <p className="mt-1 text-xs">{formatDateTime(item.createdAt)}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>

              <section className="rounded-[26px] border border-slate-200 bg-white/90 p-6 shadow-lg shadow-slate-200/40">
                <div className="mb-5 flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-950">{t.dashboard.overview.recentCalls}</h2>
                    <p className="mt-1 text-sm text-slate-500">{t.dashboard.overview.recentCallsHint}</p>
                  </div>
                  <Link href="/openclaw/activity" className="text-sm font-medium text-sky-700 hover:text-sky-800">
                    {t.dashboard.overview.viewAll}
                  </Link>
                </div>
                <div className="space-y-3">
                  {errors.usage ? (
                    <p className="rounded-2xl bg-amber-50 px-4 py-5 text-sm text-amber-800">{errors.usage}</p>
                  ) : sortedLogs.length === 0 ? (
                    <p className="rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-400">
                      {t.dashboard.overview.noCalls}
                    </p>
                  ) : (
                    sortedLogs.slice(0, 5).map((item) => (
                      <div
                        key={item.ID}
                        className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/60 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-950">{item.Model || 'unknown'}</p>
                          <p className="mt-2 text-sm text-slate-600">
                            {item.TotalTokens.toLocaleString()} tokens
                          </p>
                        </div>
                        <div className="shrink-0 text-sm text-slate-500 sm:text-right">
                          <p className="font-semibold text-slate-950">{item.CostCredits.toLocaleString()} credits</p>
                          <p className="mt-1 text-xs">{formatDateTime(item.CreatedAt)}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>
            </div>

            <section className="rounded-[26px] border border-slate-200 bg-white/90 p-6 shadow-lg shadow-slate-200/40">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
                {t.dashboard.overview.workspaceGuide}
              </p>
              <p className="mt-3 text-sm leading-6 text-slate-600">{t.dashboard.overview.workspaceGuideHint}</p>
              <div className="mt-6 space-y-3">
                {quickLinks.map((item, index) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-4 transition hover:border-sky-200 hover:bg-sky-50/60"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-sm font-semibold text-slate-600 shadow-sm shadow-slate-200/70">
                        {index + 1}
                      </span>
                      <span className="text-sm font-medium text-slate-900">{item.label}</span>
                    </div>
                    <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m9 5 7 7-7 7" />
                    </svg>
                  </Link>
                ))}
              </div>

              <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                  {hasAnyError ? t.dashboard.overview.accountAttention : t.dashboard.overview.accountReady}
                </p>
                <p className="mt-3 text-sm font-semibold text-slate-950">
                  {statusReady
                    ? `${credits.toLocaleString()} credits ${t.dashboard.overview.activeNow.toLowerCase()}`
                    : errorMessages[0] ?? t.dashboard.overview.spendUnavailable}
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  {topModel
                    ? `${t.dashboard.overview.topModel}: ${topModel}`
                    : t.dashboard.overview.noUsageYet}
                </p>
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  );
}
