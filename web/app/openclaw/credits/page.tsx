'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import DashboardPageHeader from '@/components/DashboardPageHeader';
import ErrorNotice from '@/components/ErrorNotice';
import PricingCard from '@/components/PricingCard';
import StatCard from '@/components/StatCard';
import { fetchJsonOrThrow, getErrorMessage } from '@/lib/client-api';
import type { PlanId, PlanItem } from '@/lib/constants';
import { useT } from '@/lib/locale';
import { sortPlansForDisplay } from '@/lib/planSort';
import ProviderLogo from '@/components/ProviderLogo';
import { getPurchaseProvider, PURCHASE_PROVIDERS, type PurchaseProviderId } from '@/lib/providers';

type LedgerItem = {
  id: string;
  type: string;
  changeAmount: number;
  balanceAfter: number;
  note: string | null;
  createdAt: string;
};

function statIcon(path: string) {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d={path} />
    </svg>
  );
}

function formatDelta(n: number) {
  const sign = n >= 0 ? '+' : '';
  return `${sign}${n.toLocaleString()}`;
}

function CreditsPageContent() {
  const t = useT();
  const sp = useSearchParams();
  const preferredProvider = getPurchaseProvider(sp.get('provider'));
  const [credits, setCredits] = useState(0);
  const [ledger, setLedger] = useState<LedgerItem[]>([]);
  const [plans, setPlans] = useState<PlanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<string[]>([]);
  const [purchaseBusy, setPurchaseBusy] = useState(false);

  const loadCreditsPage = useCallback(async () => {
    setLoading(true);

    const nextErrors: string[] = [];
    const [balanceResult, ledgerResult, plansResult] = await Promise.allSettled([
      fetchJsonOrThrow<{ credits?: number }>(
        '/api/user/balance',
        undefined,
        'Failed to load your current balance.'
      ),
      fetchJsonOrThrow<{ items?: LedgerItem[] }>(
        '/api/user/ledger?take=20',
        undefined,
        'Failed to load transaction history.'
      ),
      fetchJsonOrThrow<PlanItem[]>(
        '/api/plans',
        undefined,
        'Failed to load available top-up plans.'
      ),
    ]);

    if (balanceResult.status === 'fulfilled') {
      setCredits(balanceResult.value.credits ?? 0);
    } else {
      nextErrors.push(getErrorMessage(balanceResult.reason, 'Failed to load your current balance.'));
    }

    if (ledgerResult.status === 'fulfilled') {
      setLedger(ledgerResult.value.items ?? []);
    } else {
      nextErrors.push(getErrorMessage(ledgerResult.reason, 'Failed to load transaction history.'));
    }

    if (plansResult.status === 'fulfilled') {
      setPlans(sortPlansForDisplay(plansResult.value ?? []));
    } else {
      nextErrors.push(getErrorMessage(plansResult.reason, 'Failed to load available top-up plans.'));
    }

    setErrors(Array.from(new Set(nextErrors)));
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadCreditsPage();
  }, [loadCreditsPage]);

  const handleSelect = async (planId: PlanId, providerId: PurchaseProviderId) => {
    try {
      setPurchaseBusy(true);
      const res = await fetch('/api/checkout/zpay/submit-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, type: 'alipay' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to start ZPAY payment');
      if (typeof data.action === 'string' && data.action.length > 0) {
        window.location.href = data.action;
        return;
      }
      throw new Error('No ZPAY URL returned');
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to create order');
    } finally {
      setPurchaseBusy(false);
    }
  };

  const providerCount = PURCHASE_PROVIDERS.filter((provider) => provider.available).length;
  const latestLedger = ledger[0] ?? null;

  return (
    <div>
      <DashboardPageHeader
        eyebrow={t.creditsPage.eyebrow}
        title={t.creditsPage.title}
        description={t.creditsPage.subtitle}
      />

      {loading ? (
        <div className="py-12 text-center text-gray-400">{t.creditsPage.loading}</div>
      ) : (
        <>
          {errors.length > 0 && (
            <div className="mb-6">
              <ErrorNotice
                title={t.creditsPage.unavailableTitle}
                message={errors.join(' ')}
                action={
                  <button
                    type="button"
                    onClick={() => void loadCreditsPage()}
                    className="rounded-lg bg-amber-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-amber-950"
                  >
                    {t.creditsPage.retry}
                  </button>
                }
              />
            </div>
          )}

          <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title={t.creditsPage.currentBalance}
              value={credits}
              subtitle={t.creditsPage.balanceHint}
              tone="sky"
              icon={statIcon('M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z')}
            />
            <StatCard
              title={t.creditsPage.byProvider}
              value={providerCount}
              subtitle={t.creditsPage.providerHint}
              icon={statIcon('M12 6v12m6-6H6')}
            />
            <StatCard
              title={t.creditsPage.txHistory}
              value={ledger.length}
              subtitle={latestLedger ? new Date(latestLedger.createdAt).toLocaleString() : t.creditsPage.noTx}
              tone="amber"
              icon={statIcon('M8.25 6.75h7.5M8.25 10.5h7.5M8.25 14.25h4.5M6 3.75h12A2.25 2.25 0 0 1 20.25 6v12A2.25 2.25 0 0 1 18 20.25H6A2.25 2.25 0 0 1 3.75 18V6A2.25 2.25 0 0 1 6 3.75Z')}
            />
            <StatCard
              title={t.creditsPage.plansLabel}
              value={plans.length}
              subtitle={plans.length > 0 ? t.creditsPage.plansReady : t.creditsPage.noPlans}
              tone="emerald"
              icon={statIcon('M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z')}
            />
          </div>

          {/* Balance */}
          <div className="rounded-[28px] border border-gray-200 bg-gradient-to-br from-sky-600 via-indigo-700 to-slate-950 p-6 text-white shadow-xl shadow-indigo-200/50">
            <p className="text-sm font-medium text-indigo-200">{t.creditsPage.currentBalance}</p>
            <p className="mt-2 text-4xl font-bold tracking-tight">
              {credits.toLocaleString()}
              <span className="ml-2 text-lg font-normal text-indigo-200">{t.creditsPage.creditsWord}</span>
            </p>
            <p className="mt-2 text-xs text-indigo-300">{t.creditsPage.balanceHint}</p>
          </div>

          {/* Plans */}
          <div className="mt-8">
            <h2 className="mb-1 text-lg font-semibold text-gray-900">{t.creditsPage.byProvider}</h2>
            <p className="mb-4 text-sm text-gray-500">{t.creditsPage.providerHint}</p>
            {plans.length === 0 ? (
              <p className="text-sm text-gray-400">{t.creditsPage.noPlans}</p>
            ) : (
              <div className="space-y-6">
                {PURCHASE_PROVIDERS
                  .slice()
                  .sort((a, b) => {
                    if (preferredProvider?.id === a.id) return -1;
                    if (preferredProvider?.id === b.id) return 1;
                    return 0;
                  })
                  .map((provider) => (
                    <section
                      key={provider.id}
                      className={`overflow-hidden rounded-2xl border bg-white shadow-sm ${
                        preferredProvider?.id === provider.id ? 'border-primary-400 ring-2 ring-primary-200' : 'border-gray-200'
                      }`}
                    >
                      <div className={`bg-gradient-to-r ${provider.accentClass} px-5 py-4 text-white`}>
                        <div className="flex items-center gap-3">
                          <ProviderLogo provider={provider.logo} size={36} />
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/75">{provider.eyebrow}</p>
                            <h3 className="text-lg font-semibold">{provider.name}</h3>
                          </div>
                        </div>
                        <p className="mt-3 text-sm text-white/85">{provider.description}</p>
                      </div>
                      <div className="p-5">
                        {!provider.available && provider.disabledMessage && (
                          <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                            {provider.disabledMessage}
                          </div>
                        )}
                        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                          {plans.map((plan) => (
                            <PricingCard
                              key={`${provider.id}-${plan.id}`}
                              plan={plan}
                              onSelect={(planId) => void handleSelect(planId, provider.id)}
                              ctaLabel={`${provider.name} ${t.pricingCard.getCredits}`}
                              disabled={!provider.available || purchaseBusy}
                              disabledLabel={!provider.available ? provider.disabledMessage : '处理中…'}
                            />
                          ))}
                        </div>
                      </div>
                    </section>
                  ))}
              </div>
            )}
          </div>

          {/* Transaction history */}
          <div className="mt-8">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">{t.creditsPage.txHistory}</h2>
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
              {ledger.length === 0 ? (
                <div className="py-8 text-center text-sm text-gray-400">{t.creditsPage.noTx}</div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {ledger.map((x) => (
                    <div key={x.id} className="flex items-center justify-between px-5 py-3.5">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                            x.changeAmount >= 0
                              ? 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20'
                              : 'bg-red-50 text-red-600 ring-1 ring-inset ring-red-500/20'
                          }`}>
                            {x.type}
                          </span>
                          <span className={`text-sm font-semibold ${x.changeAmount >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                            {formatDelta(x.changeAmount)}
                          </span>
                        </div>
                        {x.note && <p className="mt-0.5 truncate text-xs text-gray-400">{x.note}</p>}
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-medium text-gray-700">{x.balanceAfter.toLocaleString()}</p>
                        <p className="text-[11px] text-gray-400">{new Date(x.createdAt).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function CreditsPage() {
  return (
    <Suspense fallback={<div className="py-12 text-center text-gray-400">Loading…</div>}>
      <CreditsPageContent />
    </Suspense>
  );
}
