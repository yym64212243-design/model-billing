"use client";

const MIN_MIDI = 21;
const MAX_MIDI = 108;
const KEY_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

function isBlack(keyIndex: number): boolean {
  const mod = keyIndex % 12;
  return [1, 3, 6, 8, 10].includes(mod);
}

interface PianoKeyboardProps {
  /** 高亮的 MIDI 音高（当前应弹或命中的键） */
  highlightedPitches?: number[];
  /** 命中反馈的 MIDI 音高（绿色/成功） */
  hitPitches?: number[];
  /** 显示键数范围，默认 88 */
  minPitch?: number;
  maxPitch?: number;
  /** 紧凑模式：只显示有音符的键范围 */
  compact?: boolean;
  className?: string;
}

export function PianoKeyboard({
  highlightedPitches = [],
  hitPitches = [],
  minPitch = MIN_MIDI,
  maxPitch = MAX_MIDI,
  compact = false,
  className = "",
}: PianoKeyboardProps) {
  const range = maxPitch - minPitch + 1;
  const highlightSet = new Set(highlightedPitches);
  const hitSet = new Set(hitPitches);

  const keyWidthPercent = 100 / range;

  return (
    <div
      className={`relative flex h-20 overflow-x-auto rounded-xl border border-white/10 bg-[#0a0a0a] ${className}`}
      style={{ minHeight: "5rem" }}
    >
      {Array.from({ length: range }, (_, i) => {
        const pitch = minPitch + i;
        const keyIndex = pitch % 12;
        const black = isBlack(keyIndex);
        const isHighlighted = highlightSet.has(pitch);
        const isHit = hitSet.has(pitch);
        const name = KEY_NAMES[keyIndex];

        return (
          <div
            key={pitch}
            className="flex shrink-0 items-end justify-center border-r border-gray-700/50"
            style={{
              width: `${keyWidthPercent}%`,
              height: black ? "60%" : "100%",
              marginTop: black ? "0" : "0",
              backgroundColor: black ? "#1a1a1a" : "#e5e5e5",
              zIndex: black ? 1 : 0,
            }}
            data-pitch={pitch}
            title={`${name} (${pitch})`}
          >
            {(isHit || isHighlighted) && (
              <div
                className={`h-full w-full rounded-sm ${isHit ? "bg-green-500" : "bg-playable-accent"}`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
