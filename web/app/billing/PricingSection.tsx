'use client';

import { useState, useEffect } from 'react';
import PricingCard from '@/components/PricingCard';
import type { PlanId, PlanItem } from '@/lib/constants';

interface PricingSectionProps {
  returnUrl?: string | null;
}

export default function PricingSection({ returnUrl }: PricingSectionProps) {
  const [plans, setPlans] = useState<PlanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/plans')
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('Failed to load plans'))))
      .then((data: PlanItem[]) => {
        setPlans(data);
        setError(null);
      })
      .catch(() => setError('Could not load plans'))
      .finally(() => setLoading(false));
  }, []);

  const handleSelect = async (planId: PlanId) => {
    try {
      const res = await fetch('/api/checkout/alipay/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId,
          returnUrl: returnUrl ?? undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to create Alipay order');
      if (typeof data.payUrl === 'string' && data.payUrl.length > 0) {
        window.location.href = data.payUrl;
        return;
      }
      throw new Error('No Alipay pay url');
    } catch (e) {
      console.error(e);
      alert(e instanceof Error ? e.message : 'Failed to create Alipay order');
    }
  };

  if (loading) {
    return <div className="mt-6 text-center text-gray-500">Loading plans...</div>;
  }
  if (error || plans.length === 0) {
    return (
      <div className="mt-6 text-center text-red-600">
        {error ?? 'No plans available'}
      </div>
    );
  }

  return (
    <div className="mt-6 grid gap-6 sm:grid-cols-3">
      {plans.map((plan) => (
        <PricingCard key={plan.id} plan={plan} onSelect={handleSelect} />
      ))}
    </div>
  );
}
