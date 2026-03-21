/**
 * 将钢琴编配结果转换为瀑布流可视化数据
 * 独立模块，便于后续增强动画或轨道分组
 */

import type { PianoArrangement, ArrangementNote, WaterfallNote, WaterfallData } from "@/types";

const MIDI_MIN = 21; // A0
const MIDI_MAX = 108; // C8

export function arrangementToWaterfall(arrangement: PianoArrangement): WaterfallData {
  const allNotes: ArrangementNote[] = [
    ...arrangement.leftHand.map((n) => ({ ...n, hand: "left" as const })),
    ...arrangement.rightHand.map((n) => ({ ...n, hand: "right" as const })),
  ].sort((a, b) => a.startTime - b.startTime);

  const notes: WaterfallNote[] = allNotes.map((n, i) => ({
    id: `wn-${i}-${n.pitch}-${n.startTime}`,
    pitch: n.pitch,
    startTime: n.startTime,
    duration: n.duration,
    keyIndex: n.pitch - MIDI_MIN,
    colorGroup: n.hand === "right" ? 1 : 0,
    hand: n.hand,
    velocity: n.velocity,
  }));

  const pitches = notes.map((n) => n.pitch);
  const minPitch = pitches.length ? Math.min(...pitches) : MIDI_MIN;
  const maxPitch = pitches.length ? Math.max(...pitches) : MIDI_MAX;

  return {
    notes,
    durationSeconds: arrangement.durationSeconds,
    tempo: arrangement.tempo,
    minPitch: Math.min(minPitch, MIDI_MIN),
    maxPitch: Math.max(maxPitch, MIDI_MAX),
  };
}

export function getKeyCount(): number {
  return MIDI_MAX - MIDI_MIN + 1;
}

export function pitchToKeyIndex(pitch: number): number {
  return Math.max(0, Math.min(getKeyCount() - 1, pitch - MIDI_MIN));
}
