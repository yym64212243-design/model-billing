import type { ReactNode } from 'react';

interface ErrorNoticeProps {
  title?: string;
  message: string;
  action?: ReactNode;
}

export default function ErrorNotice({
  title = 'Action required',
  message,
  action,
}: ErrorNoticeProps) {
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="font-semibold">{title}</p>
          <p className="mt-1 text-amber-800">{message}</p>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </div>
  );
}
