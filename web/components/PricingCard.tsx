'use client';

import type { PlanId, PlanItem } from '@/lib/constants';

interface PricingCardProps {
  plan: PlanItem;
  onSelect: (planId: PlanId) => void;
}

export default function PricingCard({ plan, onSelect }: PricingCardProps) {
  return (
    <div
      className={`
        relative rounded-2xl border bg-white p-6 shadow-lg transition hover:shadow-xl
        ${plan.popular ? 'border-primary-500 ring-2 ring-primary-500/30' : 'border-gray-200'}
      `}
    >
      {plan.popular && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary-600 px-3 py-0.5 text-xs font-medium text-white">
          Popular
        </span>
      )}
      <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
      <p className="mt-1 text-sm text-gray-500">{plan.description}</p>
      <div className="mt-4 flex items-baseline">
        <span className="text-2xl font-bold text-gray-900">{plan.price}</span>
        <span className="ml-1 text-gray-500">{plan.currency}</span>
      </div>
      <button
        type="button"
        onClick={() => onSelect(plan.id)}
        className={`
          mt-6 w-full rounded-xl py-3 text-sm font-semibold transition
          ${plan.popular ? 'bg-primary-600 text-white hover:bg-primary-700' : 'bg-gray-100 text-gray-900 hover:bg-gray-200'}
        `}
      >
        Get Credits
      </button>
    </div>
  );
}
