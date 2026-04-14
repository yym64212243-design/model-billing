'use client';

import type { PlanId, PlanItem } from '@/lib/constants';
import { useT } from '@/lib/locale';

export interface PaymentToggles {
  zpay: boolean;
  alipayPage: boolean;
  alipayScan: boolean;
}

interface PricingCardProps {
  plan: PlanItem & { id: string };
  onSelect?: (planId: PlanId) => void;
  ctaLabel?: string;
  disabled?: boolean;
  disabledLabel?: string;
  payments?: PaymentToggles;
  busy?: boolean;
  onZpayRedirect?: (planId: PlanId) => void;
  onZpayQr?: (planId: PlanId) => void;
  onAlipayPage?: (planId: PlanId) => void;
  onAlipayScan?: (planId: PlanId) => void;
}

function formatAud(price: number) {
  if (price < 1) return price.toFixed(2);
  if (Number.isInteger(price)) return String(price);
  return price.toFixed(2);
}

export default function PricingCard({
  plan,
  onSelect,
  ctaLabel,
  disabled = false,
  disabledLabel,
  payments,
  busy = false,
  onZpayRedirect,
  onZpayQr,
  onAlipayPage,
  onAlipayScan,
}: PricingCardProps) {
  const t = useT();
  const isTest = Boolean(plan.testOnly || plan.id === 'plan_test_1c');
  const paymentActions = [
    payments?.alipayPage && onAlipayPage
      ? { label: '支付宝跳转', action: onAlipayPage, style: 'bg-slate-950 text-white hover:bg-slate-800' }
      : null,
    payments?.alipayScan && onAlipayScan
      ? { label: '支付宝扫码', action: onAlipayScan, style: 'bg-amber-50 text-amber-900 hover:bg-amber-100' }
      : null,
    payments?.zpay && onZpayRedirect
      ? { label: 'ZPAY 跳转', action: onZpayRedirect, style: 'bg-sky-50 text-sky-900 hover:bg-sky-100' }
      : null,
    payments?.zpay && onZpayQr
      ? { label: 'ZPAY 扫码', action: onZpayQr, style: 'bg-emerald-50 text-emerald-900 hover:bg-emerald-100' }
      : null,
  ].filter(Boolean) as Array<{ label: string; action: (planId: PlanId) => void; style: string }>;

  return (
    <div
      className={`
        relative rounded-2xl border bg-white p-6 shadow-lg transition hover:shadow-xl
        ${plan.popular ? 'border-primary-500 ring-2 ring-primary-500/30' : 'border-gray-200'}
        ${isTest ? 'border-dashed border-amber-400/80 ring-1 ring-amber-200/50' : ''}
      `}
    >
      {plan.popular && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary-600 px-3 py-0.5 text-xs font-medium text-white">
          {t.pricingCard.popular}
        </span>
      )}
      {isTest && (
        <span className="absolute -top-3 right-3 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800 ring-1 ring-amber-200">
          {t.pricingCard.testBadge}
        </span>
      )}
      <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
      <p className="mt-1 text-sm text-gray-500">{plan.description}</p>
      <div className="mt-4 flex items-baseline">
        <span className="text-2xl font-bold text-gray-900">${formatAud(plan.priceAUD)}</span>
        <span className="ml-1 text-gray-500">{t.pricingCard.aud}</span>
      </div>
      {paymentActions.length > 0 ? (
        <div className="mt-6 grid gap-2">
          {paymentActions.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => item.action(plan.id as PlanId)}
              disabled={disabled || busy}
              className={`w-full rounded-xl py-3 text-sm font-semibold transition ${
                disabled || busy ? 'cursor-not-allowed bg-gray-100 text-gray-400' : item.style
              }`}
            >
              {busy ? '处理中…' : item.label}
            </button>
          ))}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => onSelect?.(plan.id as PlanId)}
          disabled={disabled || !onSelect}
          className={`
            mt-6 w-full rounded-xl py-3 text-sm font-semibold transition
            ${disabled || !onSelect
              ? 'cursor-not-allowed bg-gray-100 text-gray-400'
              : plan.popular
                ? 'bg-primary-600 text-white hover:bg-primary-700'
                : 'bg-gray-100 text-gray-900 hover:bg-gray-200'}
          `}
        >
          {disabled || !onSelect ? (disabledLabel ?? t.pricingCard.comingSoon) : (ctaLabel ?? t.pricingCard.getCredits)}
        </button>
      )}
    </div>
  );
}
