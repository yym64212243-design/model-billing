'use client';

import type { PlanId, PlanItem } from '@/lib/constants';

export type PaymentToggles = {
  zpay: boolean;
  alipayPage: boolean;
  alipayScan: boolean;
};

interface PricingCardProps {
  plan: PlanItem;
  payments: PaymentToggles;
  onZpayRedirect: (planId: PlanId) => void;
  onZpayQr: (planId: PlanId) => void;
  onAlipayPage: (planId: PlanId) => void;
  onAlipayScan: (planId: PlanId) => void;
  busy?: boolean;
}

export default function PricingCard({
  plan,
  payments,
  onZpayRedirect,
  onZpayQr,
  onAlipayPage,
  onAlipayScan,
  busy,
}: PricingCardProps) {
  const { zpay, alipayPage, alipayScan } = payments;
  const primary = plan.popular;

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
      <div className="mt-6 flex flex-col gap-3">
        {!zpay && !alipayPage && !alipayScan && (
          <p className="text-sm text-gray-500">当前未启用在线支付</p>
        )}
        {zpay && (
          <div className="flex flex-col gap-2">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">ZPAY</p>
            <button
              type="button"
              disabled={busy}
              onClick={() => onZpayRedirect(plan.id)}
              className={`
                w-full rounded-xl py-3 text-sm font-semibold transition disabled:opacity-50
                ${primary ? 'bg-primary-600 text-white hover:bg-primary-700' : 'bg-gray-100 text-gray-900 hover:bg-gray-200'}
              `}
            >
              ZPAY 跳转支付
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => onZpayQr(plan.id)}
              className="w-full rounded-xl border border-primary-200 bg-white py-3 text-sm font-semibold text-primary-700 transition hover:bg-primary-50 disabled:opacity-50"
            >
              ZPAY 扫码
            </button>
          </div>
        )}

        {(alipayPage || alipayScan) && (
          <div className="flex flex-col gap-2">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">支付宝直连</p>
            {alipayPage && (
              <button
                type="button"
                disabled={busy}
                onClick={() => onAlipayPage(plan.id)}
                className={`
                  w-full rounded-xl py-3 text-sm font-semibold transition disabled:opacity-50
                  ${!zpay && primary ? 'bg-primary-600 text-white hover:bg-primary-700' : 'bg-gray-100 text-gray-900 hover:bg-gray-200'}
                `}
              >
                支付宝网页支付
              </button>
            )}
            {alipayScan && (
              <button
                type="button"
                disabled={busy}
                onClick={() => onAlipayScan(plan.id)}
                className="w-full rounded-xl border border-primary-200 bg-white py-3 text-sm font-semibold text-primary-700 transition hover:bg-primary-50 disabled:opacity-50"
              >
                支付宝扫码（当面付）
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
