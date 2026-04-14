'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import DashboardPageHeader from '@/components/DashboardPageHeader';
import ErrorNotice from '@/components/ErrorNotice';
import StatCard from '@/components/StatCard';
import { fetchJsonOrThrow, getErrorMessage } from '@/lib/client-api';
import { useT } from '@/lib/locale';

type KeyItem = {
  id: string;
  label: string;
  prefix: string;
  created_at: string;
  expires_at: string | null;
  revoked_at: string | null;
};

function formatDate(value: string | null | undefined) {
  if (!value) return '—';
  return new Date(value).toLocaleString();
}

function metricIcon(path: string) {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d={path} />
    </svg>
  );
}

export default function KeysPage() {
  const t = useT();
  const [keys, setKeys] = useState<KeyItem[]>([]);
  const [label, setLabel] = useState('');
  const [newToken, setNewToken] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const loadKeys = useCallback(async () => {
    try {
      const data = await fetchJsonOrThrow<{ keys?: KeyItem[] }>(
        '/api/user/keys',
        undefined,
        'Failed to load API keys.'
      );
      setKeys(data.keys ?? []);
      setListError(null);
    } catch (error) {
      setListError(getErrorMessage(error, 'Failed to load API keys.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadKeys();
  }, [loadKeys]);

  const onCreate = async () => {
    setBusy(true);
    setActionError(null);
    setNewToken(null);
    setCopied(false);
    try {
      const data = await fetchJsonOrThrow<{ token: string }>(
        '/api/user/keys',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ label }),
        },
        'Failed to create API key.'
      );
      setNewToken(data.token);
      setLabel('');
      await loadKeys();
    } catch (error) {
      setActionError(getErrorMessage(error, 'Failed to create API key.'));
    } finally {
      setBusy(false);
    }
  };

  const onRevoke = async (id: string) => {
    if (!confirm(t.dashboard.keys.confirmRevoke)) return;
    setActionError(null);
    setRevokingId(id);
    try {
      await fetchJsonOrThrow<{ ok: boolean }>(
        '/api/user/keys',
        {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id }),
        },
        'Failed to revoke API key.'
      );
      await loadKeys();
    } catch (error) {
      setActionError(getErrorMessage(error, 'Failed to revoke API key.'));
    } finally {
      setRevokingId(null);
    }
  };

  const activeKeys = useMemo(() => keys.filter((item) => !item.revoked_at), [keys]);
  const revokedKeys = useMemo(() => keys.filter((item) => Boolean(item.revoked_at)), [keys]);
  const latestCreated = useMemo(
    () =>
      [...keys].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at))[0] ?? null,
    [keys]
  );
  const remainingSlots = Math.max(0, 5 - activeKeys.length);

  const copyToken = async () => {
    if (!newToken) return;
    await navigator.clipboard.writeText(newToken);
    setCopied(true);
  };

  return (
    <div>
      <DashboardPageHeader
        eyebrow={t.dashboard.keys.eyebrow}
        title={t.dashboard.keys.title}
        description={t.dashboard.keys.subtitle}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title={t.dashboard.keys.activeKeys}
          value={loading ? '—' : activeKeys.length}
          subtitle={t.dashboard.keys.maxFiveKeys}
          tone="sky"
          icon={metricIcon('M15.75 5.25a3 3 0 1 1 4.243 4.243L9 20.485l-4.5 1.5 1.5-4.5L15.75 5.25Z')}
        />
        <StatCard
          title={t.dashboard.keys.revokedKeys}
          value={loading ? '—' : revokedKeys.length}
          subtitle={t.dashboard.keys.auditTrail}
          tone="amber"
          icon={metricIcon('M9.75 9.75 14.25 14.25m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z')}
        />
        <StatCard
          title={t.dashboard.keys.keySlotsLeft}
          value={loading ? '—' : remainingSlots}
          subtitle={t.dashboard.keys.maxFiveKeys}
          tone="emerald"
          icon={metricIcon('M12 4.5v15m7.5-7.5h-15')}
        />
        <StatCard
          title={t.dashboard.keys.lastCreated}
          value={latestCreated ? formatDate(latestCreated.created_at) : '—'}
          subtitle={latestCreated?.label || t.dashboard.keys.auditTrailHint}
          icon={metricIcon('M8.25 6.75h7.5M8.25 10.5h7.5M8.25 14.25h4.5M6 3.75h12A2.25 2.25 0 0 1 20.25 6v12A2.25 2.25 0 0 1 18 20.25H6A2.25 2.25 0 0 1 3.75 18V6A2.25 2.25 0 0 1 6 3.75Z')}
        />
      </div>

      {listError && (
        <div className="mt-6">
          <ErrorNotice
            title={keys.length > 0 ? 'Could not refresh API keys' : 'API keys are unavailable'}
            message={keys.length > 0 ? `${listError} Showing the last successful list below.` : listError}
            action={
              <button
                type="button"
                onClick={() => {
                  setLoading(true);
                  void loadKeys();
                }}
                className="rounded-lg bg-amber-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-amber-950"
              >
                {t.dashboard.retry}
              </button>
            }
          />
        </div>
      )}

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.25fr_0.85fr]">
        <section className="rounded-[26px] border border-slate-200 bg-white/90 p-6 shadow-lg shadow-slate-200/40">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                {t.dashboard.keys.createTitle}
              </p>
              <h2 className="mt-3 text-xl font-semibold text-slate-950">{t.dashboard.keys.createTitle}</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{t.dashboard.keys.createHint}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-600">
              {t.dashboard.keys.maxFiveKeys}
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-600">{t.dashboard.keys.label}</label>
              <input
                type="text"
                value={label}
                onChange={(event) => setLabel(event.target.value)}
                placeholder={t.dashboard.keys.placeholder}
                className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
              />
            </div>
            <button
              type="button"
              onClick={() => void onCreate()}
              disabled={busy || activeKeys.length >= 5}
              className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? t.dashboard.keys.creating : t.dashboard.keys.create}
            </button>
          </div>

          {actionError ? <p className="mt-3 text-sm text-rose-600">{actionError}</p> : null}

          {newToken ? (
            <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4">
              <p className="text-sm font-semibold text-emerald-900">{t.dashboard.keys.createdTitle}</p>
              <p className="mt-1 text-sm text-emerald-800">{t.dashboard.keys.createdHint}</p>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <code className="block flex-1 break-all rounded-2xl bg-white px-4 py-3 text-xs font-mono text-emerald-950 ring-1 ring-emerald-200">
                  {newToken}
                </code>
                <button
                  type="button"
                  onClick={() => void copyToken()}
                  className="rounded-2xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800"
                >
                  {copied ? t.dashboard.keys.copied : t.dashboard.keys.copy}
                </button>
              </div>
            </div>
          ) : null}
        </section>

        <section className="rounded-[26px] border border-slate-200 bg-white/90 p-6 shadow-lg shadow-slate-200/40">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
            {t.dashboard.keys.safetyTitle}
          </p>
          <div className="mt-4 space-y-3">
            {t.dashboard.keys.safetyItems.map((item, index) => (
              <div
                key={item}
                className="flex gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-4"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-sm font-semibold text-slate-600 shadow-sm shadow-slate-200/70">
                  {index + 1}
                </span>
                <p className="text-sm leading-6 text-slate-600">{item}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
            <p className="text-sm font-semibold text-slate-950">{t.dashboard.keys.auditTrail}</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">{t.dashboard.keys.auditTrailHint}</p>
          </div>
        </section>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <section className="rounded-[26px] border border-slate-200 bg-white/90 p-6 shadow-lg shadow-slate-200/40">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">{t.dashboard.keys.activeTitle}</h2>
              <p className="mt-1 text-sm text-slate-500">{t.dashboard.keys.maxFiveKeys}</p>
            </div>
            <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
              {activeKeys.length}
            </span>
          </div>

          {loading ? (
            <div className="py-10 text-center text-sm text-slate-500">{t.dashboard.loading}</div>
          ) : listError && activeKeys.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-amber-300 px-4 py-8 text-center text-sm text-amber-800">
              API keys could not be loaded right now.
            </div>
          ) : activeKeys.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-400">
              {t.dashboard.keys.noActiveKeys}
            </div>
          ) : (
            <div className="space-y-3">
              {activeKeys.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="font-mono text-xs text-slate-700">gk_{item.prefix}...</p>
                    <p className="mt-2 text-sm font-semibold text-slate-950">
                      {item.label || <span className="text-slate-400">—</span>}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">{formatDate(item.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                      {t.dashboard.keys.activeStatus}
                    </span>
                    <button
                      type="button"
                      onClick={() => void onRevoke(item.id)}
                      disabled={revokingId === item.id}
                      className="rounded-xl px-3 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-50 disabled:opacity-50"
                    >
                      {revokingId === item.id ? t.dashboard.keys.revoking : t.dashboard.keys.revoke}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-[26px] border border-slate-200 bg-white/90 p-6 shadow-lg shadow-slate-200/40">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">{t.dashboard.keys.revokedTitle}</h2>
              <p className="mt-1 text-sm text-slate-500">{t.dashboard.keys.auditTrail}</p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              {revokedKeys.length}
            </span>
          </div>

          {revokedKeys.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-400">
              {t.dashboard.keys.noRevokedKeys}
            </div>
          ) : (
            <div className="space-y-3">
              {revokedKeys.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="font-mono text-xs text-slate-500">gk_{item.prefix}...</p>
                    <p className="mt-2 text-sm font-semibold text-slate-700">{item.label || '—'}</p>
                    <p className="mt-1 text-xs text-slate-500">{formatDate(item.revoked_at || item.created_at)}</p>
                  </div>
                  <span className="inline-flex w-fit items-center rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 ring-1 ring-rose-200">
                    {t.dashboard.keys.revokedStatus}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
