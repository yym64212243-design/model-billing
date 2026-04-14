export type PurchaseProviderId = 'openai' | 'gemini' | 'claude';

export type PurchaseProvider = {
  id: PurchaseProviderId;
  name: string;
  logo: string;
  eyebrow: string;
  description: string;
  accentClass: string;
  available: boolean;
  disabledMessage?: string;
};

export const PURCHASE_PROVIDERS: readonly PurchaseProvider[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    logo: 'openai',
    eyebrow: 'OpenAI models',
    description: '适合 GPT 系列调用，前端先按 OpenAI 套餐入口展示。',
    accentClass: 'from-slate-900 to-slate-700',
    available: true,
  },
  {
    id: 'gemini',
    name: 'Gemini',
    logo: 'gemini',
    eyebrow: 'Gemini models',
    description: '适合 Gemini 系列调用，和现有网关配置保持一致。',
    accentClass: 'from-violet-700 to-fuchsia-600',
    available: true,
  },
  {
    id: 'claude',
    name: 'Claude',
    logo: 'claude',
    eyebrow: 'Claude models',
    description: 'Claude token 后续接入，前端入口先保留。',
    accentClass: 'from-orange-600 to-amber-500',
    available: false,
    disabledMessage: 'Claude 即将开放',
  },
] as const;

export function getPurchaseProvider(id: string | null | undefined): PurchaseProvider | null {
  if (!id) return null;
  return PURCHASE_PROVIDERS.find((provider) => provider.id === id) ?? null;
}
