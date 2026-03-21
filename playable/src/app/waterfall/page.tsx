"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { WaterfallVisualizer } from "@/components/WaterfallVisualizer";
import { PlaybackControls } from "@/components/PlaybackControls";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { PracticeModePanel } from "@/components/PracticeModePanel";
import { loadResult } from "@/lib/resultStore";
import { useLiveInputMonitor } from "@/modules/liveInputMonitor/useLiveInputMonitor";
import { resumePianoContext, playPianoNote } from "@/lib/pianoSynth";
import type { WaterfallNote } from "@/types";

const HIT_WINDOW = 0.3;

function getExpectedNotes(notes: WaterfallNote[], time: number): WaterfallNote[] {
  return notes.filter(
    (n) => time >= n.startTime - HIT_WINDOW && time <= n.startTime + n.duration + HIT_WINDOW
  );
}

function WaterfallContent() {
  const searchParams = useSearchParams();
  const practiceMode = searchParams.get("practice") === "1";

  const [data, setData] = useState<ReturnType<typeof loadResult>>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [loopStart, setLoopStart] = useState<number | null>(null);
  const [loopEnd, setLoopEnd] = useState<number | null>(null);
  const [hitPitches, setHitPitches] = useState<number[]>([]);
  const rafRef = useRef<number>(0);
  const loopStartRef = useRef<number | null>(null);
  const loopEndRef = useRef<number | null>(null);
  const playedNoteIdsRef = useRef<Set<string>>(new Set());
  loopStartRef.current = loopStart;
  loopEndRef.current = loopEnd;

  useEffect(() => {
    setData(loadResult());
  }, []);

  const getCurrentTime = useCallback(() => currentTime, [currentTime]);
  const getExpectedNotesForTime = useCallback(
    (time: number) => (data?.waterfallData.notes ? getExpectedNotes(data.waterfallData.notes, time) : []),
    [data]
  );

  const { state: monitorState, startListening, stopListening } = useLiveInputMonitor({
    getCurrentTime,
    getExpectedNotes: getExpectedNotesForTime,
    onHit: (note, _offsetMs) => {
      setHitPitches((p) => [...p, note.pitch]);
      setTimeout(() => setHitPitches((p) => p.filter((x) => x !== note.pitch)), 200);
    },
  });

  // 播放时：用 RAF 驱动进度，并根据编配触发钢琴合成音（不再播放原声）
  useEffect(() => {
    if (!data || !isPlaying) return;
    const duration = data.waterfallData.durationSeconds;
    const notes = data.waterfallData.notes;
    const state = { startWall: performance.now() / 1000, baseTime: currentTime };

    const tick = () => {
      const elapsed = (performance.now() / 1000 - state.startWall) * speed;
      let next = state.baseTime + elapsed;
      if (loopStart !== null && loopEnd !== null && next >= loopEnd) {
        next = loopStart;
        state.baseTime = loopStart;
        state.startWall = performance.now() / 1000;
        for (const note of notes) {
          if (note.startTime >= loopStart && note.startTime < loopEnd)
            playedNoteIdsRef.current.delete(note.id);
        }
      } else if (next >= duration) {
        next = loopStart ?? 0;
        state.baseTime = next;
        state.startWall = performance.now() / 1000;
        if (loopStart === null) setIsPlaying(false);
      }
      setCurrentTime(Math.max(0, Math.min(next, duration)));

      // 触发当前时间点应响的钢琴音
      const ctx = (window as unknown as { __playablePianoCtx?: AudioContext }).__playablePianoCtx;
      if (ctx && ctx.state === "running") {
        for (const note of notes) {
          if (note.startTime <= next && !playedNoteIdsRef.current.has(note.id)) {
            playedNoteIdsRef.current.add(note.id);
            playPianoNote(ctx, note.pitch, note.duration, note.velocity ?? 0.8);
          }
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [isPlaying, data, speed, loopStart, loopEnd]); // currentTime 仅用于首次进入时的 baseTime，不放入 deps

  if (!data) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400">未找到编配数据</p>
          <Link href="/input" className="mt-4 inline-block text-playable-accent hover:underline">
            去生成
          </Link>
        </div>
      </main>
    );
  }

  const { arrangement, waterfallData } = data;
  const expectedNotes = getExpectedNotes(waterfallData.notes, currentTime);
  const expectedPitches = expectedNotes.map((n) => n.pitch);

  return (
    <main className="min-h-screen flex flex-col">
      <header className="flex shrink-0 items-center justify-between border-b border-white/10 px-4 py-3">
        <Link href="/result" className="text-lg font-bold text-white">
          ← 返回结果
        </Link>
        <ThemeSwitcher />
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4 lg:flex-row lg:items-start">
        <div className="flex flex-1 flex-col gap-4 overflow-hidden">
          <WaterfallVisualizer
            data={waterfallData}
            currentTime={currentTime}
            duration={waterfallData.durationSeconds}
            speed={speed}
            loopStart={loopStart}
            loopEnd={loopEnd}
            expectedPitches={expectedPitches}
            hitPitches={hitPitches}
            visibleWindowSec={10}
            className="min-h-[360px] lg:min-h-[420px]"
          />
          <PlaybackControls
            isPlaying={isPlaying}
            currentTime={currentTime}
            duration={waterfallData.durationSeconds}
            speed={speed}
            loopStart={loopStart}
            loopEnd={loopEnd}
            onPlayPause={async () => {
              const willPlay = !isPlaying;
              if (willPlay) {
                await resumePianoContext();
                playedNoteIdsRef.current = new Set(
                  data.waterfallData.notes.filter((n) => n.startTime <= currentTime).map((n) => n.id)
                );
              }
              setIsPlaying((p) => !p);
            }}
            onSeek={(time) => {
              setCurrentTime(time);
              playedNoteIdsRef.current = new Set(
                data.waterfallData.notes.filter((n) => n.startTime <= time).map((n) => n.id)
              );
            }}
            onSpeedChange={setSpeed}
            onLoopSet={(s, e) => {
              setLoopStart(s);
              setLoopEnd(e);
            }}
          />
        </div>

        {practiceMode && (
          <aside className="w-full shrink-0 lg:w-80">
            <PracticeModePanel
              monitorState={monitorState}
              isListening={monitorState.state === "listening" || monitorState.state === "matching"}
              onStartListening={startListening}
              onStopListening={stopListening}
            />
          </aside>
        )}
      </div>

      <p className="px-4 pb-4 text-xs text-playable-muted">
        瀑布流视图：播放为钢琴合成音，方块下落到底部时对应键盘高亮。支持速度与循环调节。iPad 横屏可获得更好体验。
      </p>
    </main>
  );
}

export default function WaterfallPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-gray-400">加载中…</div>}>
      <WaterfallContent />
    </Suspense>
  );
}
