"use client";

import { REFINE_ACTIONS } from "@/lib/constants";
import type { RefineAction } from "@/types";

interface RefineControlsProps {
  onRefine: (action: RefineAction) => void;
  isRefining?: boolean;
}

export function RefineControls({ onRefine, isRefining = false }: RefineControlsProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <h3 className="text-sm font-medium text-playable-muted">二次调整</h3>
      <p className="mt-1 text-xs text-gray-500">
        点击后将根据选择重新生成当前钢琴编配。
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {REFINE_ACTIONS.map(({ action, label }) => (
          <button
            key={action}
            type="button"
            disabled={isRefining}
            onClick={() => onRefine(action)}
            className="touch-target rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white hover:bg-white/10 disabled:opacity-50"
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
