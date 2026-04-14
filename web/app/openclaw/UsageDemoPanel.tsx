'use client';

import { useEffect, useMemo, useState } from 'react';

type LedgerItem = {
  id: string;
  type: string;
  changeAmount: number;
  balanceAfter: number;
  note: string | null;
  createdAt: string;
};

function formatDelta(n: number) {
  const sign = n >= 0 ? '+' : '';
  return `${sign}${n.toLocaleString()}`;
}

export default function UsageDemoPanel() {
  const [credits, setCredits] = useState<number | null>(null);
  const [ledger, setLedger] = useState<LedgerItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    const [bRes, lRes] = await Promise.all([fetch('/api/user/balance'), fetch('/api/user/ledger?take=8')]);
    if (bRes.ok) {
      const b = (await bRes.json()) as { credits: number };
      setCredits(b.credits);
    }
    if (lRes.ok) {
      const l = (await lRes.json()) as { items: LedgerItem[] };
      setLedger(l.items);
    }
  };

  useEffect(() => {
    refresh().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const idempotencyKey = useMemo(() => {
    // Stable key per click; regenerated after success.
    return typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? (crypto as any).randomUUID()
      : `sim-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }, [credits]); // changes after we refresh credits on success

  const onSimulate = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/user/deduct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: 10,
          idempotencyKey,
          reason: 'SIMULATED_USAGE',
          metadata: { source: 'openclaw-demo', amount: 10 },
        }),
      });
      const data = (await res.json()) as any;
      if (!res.ok) throw new Error(data?.error ?? 'Failed to deduct');
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to deduct');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-10 grid gap-6 md:grid-cols-2">
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-medium text-gray-500">Current Balance</p>
        <p className="mt-1 text-2xl font-bold text-gray-900">
          {(credits ?? 0).toLocaleString()} Credits
        </p>
        <p className="mt-2 text-xs text-gray-400">Balance updates after payments or usage deductions.</p>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onSimulate}
            disabled={busy}
            className="inline-flex items-center justify-center rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-black disabled:opacity-50"
          >
            {busy ? 'Deducting…' : 'Simulate usage (−10 credits)'}
          </button>
          <span className="text-xs text-gray-500">reason: SIMULATED_USAGE</span>
        </div>
        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-medium text-gray-500">Recent ledger</p>
        <div className="mt-3 divide-y divide-gray-100">
          {ledger.length === 0 ? (
            <p className="py-4 text-sm text-gray-500">No records yet.</p>
          ) : (
            ledger.map((x) => (
              <div key={x.id} className="flex items-start justify-between gap-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900">
                    {x.type} · {formatDelta(x.changeAmount)}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-gray-500">{x.note ?? ''}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-xs font-semibold text-gray-700">{x.balanceAfter.toLocaleString()}</p>
                  <p className="mt-0.5 text-[11px] text-gray-400">
                    {new Date(x.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

