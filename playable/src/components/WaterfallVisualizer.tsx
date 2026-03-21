"use client";

import { useMemo } from "react";
import type { WaterfallData, WaterfallNote } from "@/types";
import { PianoKeyboard } from "./PianoKeyboard";

const HIT_LINE_OFFSET = 0; // 底部为判定线
const NOTE_HEIGHT_PX = 16;
const PIXELS_PER_SEC = 120;

interface WaterfallVisualizerProps {
  data: WaterfallData;
  currentTime: number;
  duration: number;
  speed: number;
  loopStart: number | null;
  loopEnd: number | null;
  /** 当前应命中的音（用于高亮键盘） */
  expectedPitches?: number[];
  /** 命中反馈的音 */
  hitPitches?: number[];
  /** 可见时间窗口（秒），从 currentTime 往前显示 */
  visibleWindowSec?: number;
  className?: string;
}

export function WaterfallVisualizer({
  data,
  currentTime,
  duration,
  speed,
  loopStart,
  loopEnd,
  expectedPitches = [],
  hitPitches = [],
  visibleWindowSec = 8,
  className = "",
}: WaterfallVisualizerProps) {
  const minPitch = data.minPitch ?? 21;
  const maxPitch = data.maxPitch ?? 108;
  const pitchRange = maxPitch - minPitch + 1;
  const laneWidthPx = 100 / pitchRange;
  const containerHeight = Math.max(320, visibleWindowSec * PIXELS_PER_SEC * speed);

  const notesInWindow = useMemo(() => {
    const windowStart = Math.max(0, currentTime - visibleWindowSec * 0.2);
    const windowEnd = currentTime + visibleWindowSec;
    return data.notes.filter(
      (n) => n.startTime + n.duration >= windowStart && n.startTime <= windowEnd
    );
  }, [data.notes, currentTime, visibleWindowSec]);

  return (
    <div className={`flex flex-col rounded-2xl border border-white/10 bg-playable-surface overflow-hidden ${className}`}>
      {/* 瀑布流区域：下落方块 */}
      <div
        className="relative overflow-hidden"
        style={{
          height: containerHeight,
          minHeight: 320,
        }}
      >
        {/* 判定线（底部高亮条） */}
        <div
          className="absolute left-0 right-0 z-20 h-1 bg-playable-accent opacity-90"
          style={{ bottom: HIT_LINE_OFFSET }}
        />

        {notesInWindow.map((note) => {
          const keyIdx = note.pitch - minPitch;
          const left = (keyIdx / pitchRange) * 100;
          const width = laneWidthPx * 0.85;
          const noteHeightSec = note.duration * speed;
          const noteHeightPx = noteHeightSec * PIXELS_PER_SEC;
          const distanceFromHit = (note.startTime + note.duration - currentTime) * speed * PIXELS_PER_SEC;
          const bottom = HIT_LINE_OFFSET + distanceFromHit;
          const isPast = currentTime >= note.startTime + note.duration;
          const isActive = currentTime >= note.startTime && currentTime < note.startTime + note.duration;

          return (
            <div
              key={note.id}
              className="absolute rounded left-0 transition-all duration-75"
              style={{
                left: `${left}%`,
                width: `${width}%`,
                height: Math.max(NOTE_HEIGHT_PX, noteHeightPx),
                bottom: `${bottom}px`,
                backgroundColor: note.hand === "right" ? "var(--waterfall-right)" : "var(--waterfall-left)",
                opacity: isPast ? 0.4 : 1,
                boxShadow: isActive ? "0 0 12px rgba(233,69,96,0.6)" : "none",
              }}
              data-note-id={note.id}
              data-pitch={note.pitch}
            />
          );
        })}
      </div>

      {/* 底部钢琴键 */}
      <div className="border-t border-white/10 p-2">
        <PianoKeyboard
          minPitch={minPitch}
          maxPitch={maxPitch}
          highlightedPitches={expectedPitches}
          hitPitches={hitPitches}
        />
      </div>
    </div>
  );
}
