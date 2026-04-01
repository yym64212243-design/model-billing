/**
 * Billing 套餐与常量
 * 套餐通过 GET /api/plans 对外提供，可按需改为从 API/CMS 拉取。
 */

export type PlanId = 'plan_test' | 'plan_5' | 'plan_10' | 'plan_20';

export interface PlanItem {
  id: PlanId;
  name: string;
  price: number;
  currency: string;
  credits: number;
  description: string;
  popular?: boolean;
}

export const PLANS: readonly PlanItem[] = [
  {
    id: 'plan_test',
    name: 'Test',
    price: 0.01,
    currency: 'CNY',
    credits: 10,
    description: '10 Credits（测试用）',
  },
  {
    id: 'plan_5',
    name: 'Starter',
    price: 5,
    currency: 'CNY',
    credits: 500,
    description: '500 Credits',
  },
  {
    id: 'plan_10',
    name: 'Growth',
    price: 10,
    currency: 'CNY',
    credits: 1100,
    description: '1,100 Credits',
    popular: true,
  },
  {
    id: 'plan_20',
    name: 'Pro',
    price: 20,
    currency: 'CNY',
    credits: 2300,
    description: '2,300 Credits',
  },
];

/** 可选：在 .env 中设置 STRIPE_PRICE_5 / STRIPE_PRICE_10 / STRIPE_PRICE_20 使用已有 Stripe Price ID，否则使用动态 price_data */
export const STRIPE_PRICE_IDS: Record<PlanId, string> = {
  plan_test: 'price_xxx_test',
  plan_5: 'price_xxx_5',
  plan_10: 'price_xxx_10',
  plan_20: 'price_xxx_20',
};
