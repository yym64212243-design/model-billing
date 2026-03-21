"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { LiveInputMonitorState, WaterfallNote } from "@/types";
import { estimatePitchFromAnalyser } from "./pitchDetection";

/** 判定窗口：当前时间前后多少秒内算命中 */
const HIT_WINDOW_SEC = 0.25;

export interface UseLiveInputMonitorOptions {
  /** 获取当前播放时间（秒），每次 tick 会调用以保持同步 */
  getCurrentTime: () => number;
  /** 当前应命中的音符（根据 time 与 waterfall 数据计算） */
  getExpectedNotes: (time: number) => WaterfallNote[];
  /** 命中回调 */
  onHit?: (note: WaterfallNote, offsetMs: number) => void;
  /** 未命中回调 */
  onMiss?: () => void;
}

export function useLiveInputMonitor(options: UseLiveInputMonitorOptions) {
  const [state, setState] = useState<LiveInputMonitorState>({
    state: "idle",
    detectedPitches: [],
    expectedPitches: [],
    isHit: false,
    hitTimeOffsetMs: null,
    streak: 0,
    lastHitAt: null,
  });

  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number>(0);
  const lastHitNoteIds = useRef<Set<string>>(new Set());
  const streakRef = useRef(0);

  const startListening = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const ctx = new AudioContext();
      audioContextRef.current = ctx;
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.8;
      src.connect(analyser);
      analyserRef.current = analyser;
      streakRef.current = 0;
      setState((s) => ({ ...s, state: "listening", detectedPitches: [], expectedPitches: [], isHit: false, hitTimeOffsetMs: null, streak: 0 }));
      lastHitNoteIds.current.clear();

      const tick = () => {
        const analyser = analyserRef.current;
        const ctx = audioContextRef.current;
        if (!analyser || !ctx) return;
        const time = options.getCurrentTime();
        const expected = options.getExpectedNotes(time);
        const expectedPitches = expected.map((n) => n.pitch);
        const detected = estimatePitchFromAnalyser(analyser, ctx.sampleRate);
        const detectedPitches = detected !== null ? [detected] : [];

        let isHit = false;
        let hitTimeOffsetMs: number | null = null;
        if (detected !== null && expected.length > 0) {
          for (const note of expected) {
            if (lastHitNoteIds.current.has(note.id)) continue;
            const inWindow = Math.abs(note.startTime - time) <= HIT_WINDOW_SEC;
            if (inWindow && Math.abs(note.pitch - detected) <= 1) {
              isHit = true;
              lastHitNoteIds.current.add(note.id);
              hitTimeOffsetMs = (time - note.startTime) * 1000;
              streakRef.current += 1;
              options.onHit?.(note, hitTimeOffsetMs);
              break;
            }
          }
          if (!isHit && expected.length > 0) {
            const anyInWindow = expected.some(
              (n) => Math.abs(n.startTime - time) <= HIT_WINDOW_SEC
            );
            if (anyInWindow) {
              streakRef.current = 0;
              options.onMiss?.();
            }
          }
        }

        setState((s) => ({
          ...s,
          state: "matching",
          detectedPitches,
          expectedPitches,
          isHit,
          hitTimeOffsetMs,
          streak: streakRef.current,
          lastHitAt: isHit ? Date.now() : s.lastHitAt,
        }));

        animationRef.current = requestAnimationFrame(tick);
      };
      animationRef.current = requestAnimationFrame(tick);
    } catch (err) {
      setState((s) => ({ ...s, state: "error" }));
    }
  }, [options.getExpectedNotes, options.onHit, options.onMiss]);

  const stopListening = useCallback(() => {
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    audioContextRef.current?.close();
    audioContextRef.current = null;
    analyserRef.current = null;
    setState((s) => ({ ...s, state: "idle", detectedPitches: [], expectedPitches: [], isHit: false }));
  }, []);

  useEffect(() => {
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      audioContextRef.current?.close();
    };
  }, []);

  return { state, startListening, stopListening };
}
