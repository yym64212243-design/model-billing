"use client";

import { SPEED_OPTIONS } from "@/lib/constants";

interface PlaybackControlsProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  speed: number;
  loopStart: number | null;
  loopEnd: number | null;
  onPlayPause: () => void;
  onSeek: (time: number) => void;
  onSpeedChange: (speed: number) => void;
  onLoopSet: (start: number | null, end: number | null) => void;
}

export function PlaybackControls({
  isPlaying,
  currentTime,
  duration,
  speed,
  loopStart,
  loopEnd,
  onPlayPause,
  onSeek,
  onSpeedChange,
  onLoopSet,
}: PlaybackControlsProps) {
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col gap-4 rounded-xl bg-white/5 p-4">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onPlayPause}
          className="touch-target flex h-12 w-12 items-center justify-center rounded-full bg-playable-accent text-white transition hover:opacity-90"
        >
          {isPlaying ? (
            <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
            </svg>
          ) : (
            <svg className="ml-0.5 h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>
        <span className="font-mono text-sm text-gray-400">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
        <div className="flex-1">
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={(e) => onSeek(Number(e.target.value))}
            className="h-2 w-full appearance-none rounded-full bg-white/20 accent-playable-accent"
          />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-xs text-gray-500">速度</span>
        {SPEED_OPTIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onSpeedChange(s)}
            className={`touch-target rounded-lg px-3 py-1.5 text-sm ${
              speed === s ? "bg-playable-accent text-white" : "bg-white/10 text-gray-400 hover:text-white"
            }`}
          >
            {s}x
          </button>
        ))}
        <button
          type="button"
          onClick={() =>
            onLoopSet(
              loopStart === null ? currentTime : null,
              loopEnd === null ? Math.min(currentTime + 8, duration) : null
            )
          }
          className="touch-target rounded-lg bg-white/10 px-3 py-1.5 text-sm text-gray-400 hover:text-white"
        >
          {loopStart !== null ? "取消循环" : "循环这一段"}
        </button>
      </div>
    </div>
  );
}
