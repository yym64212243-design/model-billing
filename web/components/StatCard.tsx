import type { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  eyebrow?: string;
  tone?: 'default' | 'sky' | 'emerald' | 'amber';
}

const toneStyles: Record<NonNullable<StatCardProps['tone']>, string> = {
  default: 'border-slate-200 bg-white',
  sky: 'border-sky-200/80 bg-sky-50/70',
  emerald: 'border-emerald-200/80 bg-emerald-50/70',
  amber: 'border-amber-200/80 bg-amber-50/70',
};

const iconStyles: Record<NonNullable<StatCardProps['tone']>, string> = {
  default: 'bg-slate-100 text-slate-600',
  sky: 'bg-sky-100 text-sky-700',
  emerald: 'bg-emerald-100 text-emerald-700',
  amber: 'bg-amber-100 text-amber-700',
};

export default function StatCard({
  title,
  value,
  subtitle,
  icon,
  eyebrow,
  tone = 'default',
}: StatCardProps) {
  return (
    <div className={`rounded-2xl border p-5 shadow-sm shadow-slate-200/40 ${toneStyles[tone]}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          {eyebrow ? (
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
              {eyebrow}
            </p>
          ) : null}
          <p className="text-sm font-medium text-slate-500">{title}</p>
        </div>
        {icon ? (
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconStyles[tone]}`}>
            {icon}
          </div>
        ) : null}
      </div>
      <p className="mt-4 text-2xl font-bold tracking-tight text-slate-950">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>
      {subtitle && <p className="mt-2 text-xs leading-5 text-slate-500">{subtitle}</p>}
    </div>
  );
}
