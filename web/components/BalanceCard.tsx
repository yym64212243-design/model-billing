'use client';

import { useState, useEffect } from 'react';

export default function BalanceCard() {
  const [credits, setCredits] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/user/balance')
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data: { credits: number }) => {
        setCredits(data.credits);
      })
      .catch(() => setCredits(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-medium text-gray-500">Current Balance</p>
        <p className="mt-1 text-gray-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-gray-500">Current Balance</p>
      <p className="mt-1 text-2xl font-bold text-gray-900">
        {(credits ?? 0).toLocaleString()} Credits
      </p>
      <p className="mt-2 text-xs text-gray-400">
        Balance updates after successful payment.
      </p>
    </div>
  );
}
