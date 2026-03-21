"use client";

import type { LiveInputMonitorState } from "@/types";

interface PracticeModePanelProps {
  monitorState: LiveInputMonitorState;
  isListening: boolean;
  onStartListening: () => void;
  onStopListening: () => void;
}

export function PracticeModePanel({
  monitorState,
  isListening,
  onStartListening,
  onStopListening,
}: PracticeModePanelProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <h3 className="text-sm font-medium text-playable-muted">跟弹监听模式</h3>
      <p className="mt-1 text-xs text-gray-500">
        开启麦克风后，软件会识别你弹下的音并与当前应命中的音匹配，命中时键盘与方块会同步反馈。
      </p>
      <p className="mt-1 text-xs text-amber-500/90">
        建议让设备靠近钢琴，安静环境下效果更佳。第一版优先支持单音识别。
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        {!isListening ? (
          <button
            type="button"
            onClick={onStartListening}
            className="touch-target rounded-xl bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-500"
          >
            开启麦克风监听
          </button>
        ) : (
          <button
            type="button"
            onClick={onStopListening}
            className="touch-target rounded-xl bg-gray-600 px-4 py-2 text-sm font-medium text-white hover:bg-gray-500"
          >
            关闭监听
          </button>
        )}
        {isListening && (
          <span className="rounded-full bg-green-500/20 px-3 py-1 text-sm text-green-400">
            连续命中 {monitorState.streak}
          </span>
        )}
        {monitorState.state === "error" && (
          <span className="text-sm text-red-400">无法访问麦克风</span>
        )}
      </div>
    </div>
  );
}
