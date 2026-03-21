"use client";

import type { PianoArrangement } from "@/types";

interface ScorePreviewProps {
  arrangement: PianoArrangement;
}

/**
 * 传统乐谱预览区。MVP 为可信的预览结构，预留 PDF / MusicXML / MIDI 导出。
 */
export function ScorePreview({ arrangement }: ScorePreviewProps) {
  const rightNotes = arrangement.rightHand.slice(0, 24);
  const leftNotes = arrangement.leftHand.slice(0, 16);

  return (
    <div className="rounded-2xl border border-white/10 bg-[#1a1a1a] p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-medium text-white">乐谱预览</h3>
        <span className="text-xs text-playable-muted">PDF / MusicXML / MIDI 导出预留</span>
      </div>
      <div className="min-h-[280px] rounded-lg bg-[#252525] p-4 font-mono text-sm">
        <div className="text-gray-500">右手（旋律）</div>
        <div className="mt-2 flex flex-wrap gap-1">
          {rightNotes.map((n, i) => (
            <span
              key={`r-${i}`}
              className="rounded bg-blue-500/20 px-1.5 py-0.5 text-blue-300"
            >
              {midiToNoteName(n.pitch)} {n.startTime.toFixed(1)}s
            </span>
          ))}
        </div>
        <div className="mt-4 text-gray-500">左手（伴奏）</div>
        <div className="mt-2 flex flex-wrap gap-1">
          {leftNotes.map((n, i) => (
            <span
              key={`l-${i}`}
              className="rounded bg-amber-500/20 px-1.5 py-0.5 text-amber-300"
            >
              {midiToNoteName(n.pitch)} {n.startTime.toFixed(1)}s
            </span>
          ))}
        </div>
        <p className="mt-4 text-xs text-playable-muted">
          此为简化预览。接入真实转谱后此处可渲染五线谱或嵌入第三方乐谱组件。
        </p>
      </div>
    </div>
  );
}

function midiToNoteName(midi: number): string {
  const names = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  const oct = Math.floor(midi / 12) - 1;
  const name = names[midi % 12];
  return `${name}${oct}`;
}
