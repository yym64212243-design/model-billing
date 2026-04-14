'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import DashboardPageHeader from '@/components/DashboardPageHeader';
import ErrorNotice from '@/components/ErrorNotice';
import StatCard from '@/components/StatCard';
import { fetchJsonOrThrow, getErrorMessage } from '@/lib/client-api';
import { useT } from '@/lib/locale';

type UsageLog = {
  ID: number;
  UserID: string;
  Model: string;
  PromptTokens: number;
  CompletionTokens: number;
  TotalTokens: number;
  CostCredits: number;
  CreatedAt: string;
};

type ModelSummary = {
  model: string;
  requests: number;
  tokens: number;
  cost: number;
};

function createIcon(path: string) {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d={path} />
    </svg>
  );
}

function formatDateTime(value?: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleString();
}

export default function ActivityPage() {
  const t = useT();
  const [logs, setLogs] = useState<UsageLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterModel, setFilterModel] = useState('');
  const [error, setError] = useState<string | null>(null);

  const loadUsage = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchJsonOrThrow<{ logs?: UsageLog[] }>(
        '/api/user/usage',
        undefined,
        'Failed to load usage data.'
      );
      setLogs(data.logs ?? []);
      setError(null);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load usage data.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadUsage();
  }, [loadUsage]);

  const sortedLogs = useMemo(
    () => [...logs].sort((a, b) => +new Date(b.CreatedAt) - +new Date(a.CreatedAt)),
    [logs]
  );

  const modelSummaries = useMemo(() => {
    const map = new Map<string, ModelSummary>();
    for (const item of sortedLogs) {
      const key = item.Model || 'unknown';
      const existing = map.get(key) ?? { model: key, requests: 0, tokens: 0, cost: 0 };
      existing.requests += 1;
      existing.tokens += item.TotalTokens;
      existing.cost += item.CostCredits;
      map.set(key, existing);
    }
    return Array.from(map.values()).sort((a, b) => b.cost - a.cost);
  }, [sortedLogs]);

  const models = useMemo(
    () => Array.from(new Set(sortedLogs.map((item) => item.Model || 'unknown'))),
    [sortedLogs]
  );

  const filteredLogs = useMemo(
    () =>
      filterModel
        ? sortedLogs.filter((item) => (item.Model || 'unknown') === filterModel)
        : sortedLogs,
    [filterModel, sortedLogs]
  );

  const totalRequests = filteredLogs.length;
  const totalTokens = filteredLogs.reduce((sum, item) => sum + item.TotalTokens, 0);
  const totalCost = filteredLogs.reduce((sum, item) => sum + item.CostCredits, 0);
  const averageCost = totalRequests > 0 ? Number((totalCost / totalRequests).toFixed(2)) : 0;
  const topModel = modelSummaries[0];
  const latestCall = filteredLogs[0] ?? sortedLogs[0] ?? null;
  const filteredShare = sortedLogs.length > 0 ? Math.round((filteredLogs.length / sortedLogs.length) * 100) : 0;
  const hasVisibleUsageData = !error || logs.length > 0;

  return (
    <div>
      <DashboardPageHeader
        eyebrow={t.dashboard.activity.eyebrow}
        title={t.dashboard.activity.title}
        description={t.dashboard.activity.subtitle}
        actions={
          <button
            type="button"
            onClick={() => void loadUsage()}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            {t.dashboard.retry}
          </button>
        }
      />

      {loading ? (
        <div className="py-16 text-center text-sm text-slate-500">{t.dashboard.loading}</div>
      ) : (
        <>
          {error ? (
            <div className="mb-6">
              <ErrorNotice
                title="Usage data is temporarily unavailable"
                message={logs.length > 0 ? `${error} Showing the last successful data load below.` : error}
                action={
                  <button
                    type="button"
                    onClick={() => void loadUsage()}
                    className="rounded-lg bg-amber-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-amber-950"
                  >
                    {t.dashboard.retry}
                  </button>
                }
              />
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title={t.dashboard.activity.requests}
              value={hasVisibleUsageData ? totalRequests : 'Unavailable'}
              subtitle={hasVisibleUsageData ? (filterModel || t.dashboard.activity.filterAll) : error ?? t.dashboard.activity.noUsageData}
              tone="sky"
              icon={createIcon('M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z')}
            />
            <StatCard
              title={t.dashboard.activity.tokens}
              value={hasVisibleUsageData ? totalTokens.toLocaleString() : 'Unavailable'}
              subtitle={hasVisibleUsageData ? t.dashboard.activity.promptCompletion : error ?? t.dashboard.activity.noUsageData}
              icon={createIcon('M7.5 8.25h9m-9 3.75h9m-9 3.75H12m-6-9.75h12A2.25 2.25 0 0 1 20.25 8.25v7.5A2.25 2.25 0 0 1 18 18H6A2.25 2.25 0 0 1 3.75 15.75v-7.5A2.25 2.25 0 0 1 6 6Z')}
            />
            <StatCard
              title={t.dashboard.activity.credits}
              value={hasVisibleUsageData ? totalCost.toLocaleString() : 'Unavailable'}
              subtitle={hasVisibleUsageData ? t.dashboard.activity.totalCost : error ?? t.dashboard.activity.noUsageData}
              tone="amber"
              icon={createIcon('M12 6v12m0 0 3.75-3.75M12 18l-3.75-3.75M3.75 8.25h16.5')}
            />
            <StatCard
              title={t.dashboard.activity.avgCost}
              value={hasVisibleUsageData ? averageCost.toLocaleString() : 'Unavailable'}
              subtitle={hasVisibleUsageData ? t.dashboard.activity.avgCostHint : error ?? t.dashboard.activity.noUsageData}
              tone="emerald"
              icon={createIcon('M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z')}
            />
          </div>

          <div className="mt-8 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <section className="rounded-[26px] border border-slate-200 bg-white/90 p-6 shadow-lg shadow-slate-200/40">
              <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-950">{t.dashboard.activity.byModel}</h2>
                  <p className="mt-1 text-sm text-slate-500">{t.dashboard.activity.byModelHint}</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <select
                    value={filterModel}
                    onChange={(event) => setFilterModel(event.target.value)}
                    className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                  >
                    <option value="">{t.dashboard.activity.filterAll}</option>
                    {models.map((model) => (
                      <option key={model} value={model}>
                        {model}
                      </option>
                    ))}
                  </select>
                  {filterModel ? (
                    <button
                      type="button"
                      onClick={() => setFilterModel('')}
                      className="text-sm font-medium text-slate-500 transition hover:text-slate-900"
                    >
                      {t.dashboard.activity.clearFilter}
                    </button>
                  ) : null}
                </div>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {modelSummaries.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-400 md:col-span-2">
                    {t.dashboard.activity.noUsageData}
                  </div>
                ) : (
                  modelSummaries.map((summary) => {
                    const selected = filterModel === summary.model;
                    return (
                      <button
                        key={summary.model}
                        type="button"
                        onClick={() => setFilterModel(selected ? '' : summary.model)}
                        className={`rounded-2xl border p-4 text-left transition ${
                          selected
                            ? 'border-sky-200 bg-sky-50/70 shadow-sm shadow-sky-100'
                            : 'border-slate-200 bg-slate-50/60 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <p className="text-sm font-semibold text-slate-950">{summary.model}</p>
                        <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
                          <span>{summary.requests} req</span>
                          <span>{summary.tokens.toLocaleString()} tok</span>
                          <span className="font-semibold text-slate-700">{summary.cost.toLocaleString()} credits</span>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </section>

            <section className="rounded-[26px] border border-slate-200 bg-white/90 p-6 shadow-lg shadow-slate-200/40">
              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                    {t.dashboard.activity.topModel}
                  </p>
                  <p className="mt-3 text-lg font-semibold text-slate-950">
                    {topModel?.model || t.dashboard.activity.noUsageData}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {topModel
                      ? `${topModel.requests.toLocaleString()} req · ${topModel.cost.toLocaleString()} credits`
                      : t.dashboard.activity.noUsageData}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                    {t.dashboard.activity.latestCall}
                  </p>
                  <p className="mt-3 text-sm font-semibold text-slate-950">
                    {latestCall?.Model || t.dashboard.activity.noUsageData}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">{formatDateTime(latestCall?.CreatedAt)}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                    {t.dashboard.activity.filteredShare}
                  </p>
                  <p className="mt-3 text-lg font-semibold text-slate-950">{filteredShare}%</p>
                  <p className="mt-2 text-sm text-slate-500">
                    {filterModel || t.dashboard.activity.filterAll}
                  </p>
                </div>
              </div>
            </section>
          </div>

          <section className="mt-8 rounded-[26px] border border-slate-200 bg-white/90 p-6 shadow-lg shadow-slate-200/40">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">{t.dashboard.activity.tableTitle}</h2>
                <p className="mt-1 text-sm text-slate-500">{t.dashboard.activity.tableHint}</p>
              </div>
            </div>

            <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50/80">
                    <tr>
                      <th className="px-4 py-3 font-medium text-slate-500">{t.dashboard.activity.time}</th>
                      <th className="px-4 py-3 font-medium text-slate-500">{t.dashboard.activity.model}</th>
                      <th className="px-4 py-3 text-right font-medium text-slate-500">{t.dashboard.activity.input}</th>
                      <th className="px-4 py-3 text-right font-medium text-slate-500">{t.dashboard.activity.output}</th>
                      <th className="px-4 py-3 text-right font-medium text-slate-500">{t.dashboard.activity.total}</th>
                      <th className="px-4 py-3 text-right font-medium text-slate-500">{t.dashboard.activity.cost}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {filteredLogs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                          {error
                            ? t.dashboard.activity.noUsageData
                            : filterModel
                              ? t.dashboard.activity.noFilteredUsage
                              : t.dashboard.activity.noUsageData}
                        </td>
                      </tr>
                    ) : (
                      filteredLogs.map((item) => (
                        <tr key={item.ID} className="hover:bg-slate-50/60">
                          <td className="whitespace-nowrap px-4 py-3 text-slate-500">
                            {formatDateTime(item.CreatedAt)}
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                              {item.Model || 'unknown'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right text-slate-600">{item.PromptTokens.toLocaleString()}</td>
                          <td className="px-4 py-3 text-right text-slate-600">{item.CompletionTokens.toLocaleString()}</td>
                          <td className="px-4 py-3 text-right text-slate-600">{item.TotalTokens.toLocaleString()}</td>
                          <td className="px-4 py-3 text-right font-semibold text-slate-950">{item.CostCredits.toLocaleString()}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
