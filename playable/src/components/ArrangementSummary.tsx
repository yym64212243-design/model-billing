"use client";

import type { PianoArrangement } from "@/types";
import { DIFFICULTY_OPTIONS } from "@/lib/constants";

interface ArrangementSummaryProps {
  arrangement: PianoArrangement;
}

const difficultyLabel = (v: PianoArrangement["difficulty"]) =>
  DIFFICULTY_OPTIONS.find((o) => o.value === v)?.label ?? v;

export function ArrangementSummary({ arrangement }: ArrangementSummaryProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-6">
      <h3 className="text-sm font-medium text-playable-muted">歌曲摘要</h3>
      <dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div>
          <dt className="text-xs text-gray-500">曲速</dt>
          <dd className="font-mono text-white">{arrangement.tempo} BPM</dd>
        </div>
        <div>
          <dt className="text-xs text-gray-500">调性</dt>
          <dd className="font-mono text-white">{arrangement.key}</dd>
        </div>
        <div>
          <dt className="text-xs text-gray-500">难度</dt>
          <dd className="text-white">{difficultyLabel(arrangement.difficulty)}</dd>
        </div>
        <div>
          <dt className="text-xs text-gray-500">时长</dt>
          <dd className="font-mono text-white">
            {Math.floor(arrangement.durationSeconds / 60)}:
            {Math.floor(arrangement.durationSeconds % 60)
              .toString()
              .padStart(2, "0")}
          </dd>
        </div>
      </dl>
    </div>
  );
}
