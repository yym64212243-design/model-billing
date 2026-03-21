"use client";

interface ProcessingIndicatorProps {
  message?: string;
}

export function ProcessingIndicator({ message = "正在生成钢琴编配…" }: ProcessingIndicatorProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-6 py-16">
      <div className="relative h-16 w-16">
        <div className="absolute inset-0 rounded-full border-2 border-playable-accent/30" />
        <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-playable-accent" />
      </div>
      <p className="text-gray-400">{message}</p>
      <p className="text-sm text-playable-muted">请稍候，首次生成约需几秒</p>
    </div>
  );
}
