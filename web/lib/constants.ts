/**
 * Billing 套餐与常量
 * 套餐通过 GET /api/plans 对外提供，可按需改为从 API/CMS 拉取。
 */

export type PlanId = 'plan_5' | 'plan_10' | 'plan_20' | 'plan_test_1c';

export interface PlanItem {
  id: PlanId;
  name: string;
  priceAUD: number;
  credits: number;
  description: string;
  popular?: boolean;
  /** Shown last; dashed card + test badge in UI */
  testOnly?: boolean;
}

export const PLANS: readonly PlanItem[] = [
  {
    id: 'plan_5',
    name: 'Starter',
    priceAUD: 5,
    credits: 500,
    description: '500 积分',
  },
  {
    id: 'plan_10',
    name: 'Growth',
    priceAUD: 10,
    credits: 1100,
    description: '1,100 积分',
    popular: true,
  },
  {
    id: 'plan_20',
    name: 'Pro',
    priceAUD: 20,
    credits: 2300,
    description: '2,300 积分',
  },
  {
    id: 'plan_test_1c',
    name: '测试 · 1 分 (CNY)',
    priceAUD: 0.01,
    credits: 1,
    description: '仅用于支付联调：0.01 元，非正式套餐',
    testOnly: true,
  },
];

/** 可选：在 .env 中设置 STRIPE_PRICE_5 / STRIPE_PRICE_10 / STRIPE_PRICE_20 使用已有 Stripe Price ID，否则使用动态 price_data */
export const STRIPE_PRICE_IDS: Record<PlanId, string> = {
  plan_5: 'price_xxx_5',
  plan_10: 'price_xxx_10',
  plan_20: 'price_xxx_20',
  plan_test_1c: 'price_xxx_test_1c',
};
