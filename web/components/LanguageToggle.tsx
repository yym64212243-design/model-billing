'use client';

import { useLocaleContext, type Locale } from '@/lib/locale';

type Props = { variant?: 'light' | 'dark'; className?: string };

export default function LanguageToggle({ variant = 'light', className = '' }: Props) {
  const { locale, setLocale } = useLocaleContext();
  const isDark = variant === 'dark';
  const base =
    'rounded-md px-2 py-1 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500';
  const inactive = isDark
    ? 'text-gray-400 hover:text-white'
    : 'text-gray-500 hover:text-gray-900';
  const active = isDark ? 'bg-gray-800 text-white' : 'bg-gray-900 text-white';

  const seg = (l: Locale, label: string) => (
    <button
      type="button"
      onClick={() => setLocale(l)}
      className={`${base} ${locale === l ? active : inactive}`}
      aria-pressed={locale === l}
    >
      {label}
    </button>
  );

  return (
    <div
      className={`inline-flex gap-0.5 rounded-lg border p-0.5 ${
        isDark ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-white'
      } ${className}`}
      role="group"
      aria-label="Language"
    >
      {seg('zh', '中文')}
      {seg('en', 'EN')}
    </div>
  );
}
