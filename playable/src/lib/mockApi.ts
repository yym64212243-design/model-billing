/**
 * Mock 转谱与编配 API
 * 与 UI 解耦，后续可替换为真实后端 / 第三方服务
 */

import type {
  AudioInput,
  TranscribeResult,
  PianoArrangement,
  DifficultyLevel,
  RefineAction,
} from "@/types";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** 模拟从音频生成转录结果 */
export async function mockTranscribe(audio: AudioInput): Promise<TranscribeResult> {
  await delay(1500);
  const id = `tr-${Date.now()}`;
  const duration = audio.durationSeconds;
  const tempo = 90 + Math.floor(Math.random() * 40);
  const keys = ["C", "G", "Am", "F", "Dm", "Em"];
  const key = keys[Math.floor(Math.random() * keys.length)];

  const melody: TranscribeResult["melody"] = [];
  const step = 0.25;
  for (let t = 0; t < duration; t += step) {
    melody.push({
      time: t,
      pitch: 60 + Math.floor(Math.random() * 12),
      duration: step,
      velocity: 0.8,
    });
  }

  const chords: TranscribeResult["chords"] = [];
  for (let t = 0; t < duration; t += 1) {
    chords.push({
      time: t,
      duration: 1,
      symbol: key,
      pitches: [60, 64, 67],
    });
  }

  const sections: TranscribeResult["sections"] = [
    { name: "intro", startTime: 0, endTime: Math.min(4, duration) },
    { name: "verse", startTime: 4, endTime: duration * 0.6 },
    { name: "chorus", startTime: duration * 0.6, endTime: duration },
  ];

  return {
    id,
    audioInputId: audio.id,
    tempo,
    key,
    timeSignature: "4/4",
    melody,
    chords,
    sections,
    durationSeconds: duration,
  };
}

/** 根据难度生成左手/右手音符数量 */
function noteCountForDifficulty(level: DifficultyLevel, duration: number): { left: number; right: number } {
  const base = Math.max(10, Math.floor(duration * 2));
  switch (level) {
    case "beginner":
      return { left: Math.floor(base * 0.3), right: Math.floor(base * 0.8) };
    case "intermediate":
      return { left: Math.floor(base * 0.6), right: Math.floor(base * 1.2) };
    case "advanced":
      return { left: Math.floor(base * 1), right: Math.floor(base * 1.5) };
  }
}

/** 模拟从转录结果生成钢琴编配 */
export async function mockArrange(
  transcribe: TranscribeResult,
  difficulty: DifficultyLevel,
  refineAction?: RefineAction
): Promise<PianoArrangement> {
  await delay(1200);
  const { left: nLeft, right: nRight } = noteCountForDifficulty(
    difficulty,
    transcribe.durationSeconds
  );
  const leftHand: PianoArrangement["leftHand"] = [];
  const rightHand: PianoArrangement["rightHand"] = [];

  const bassPitches = [36, 38, 41, 43, 45, 48, 50];
  const rightPitches = [60, 62, 64, 65, 67, 69, 71, 72];

  let t = 0;
  const beat = 60 / transcribe.tempo;
  while (t < transcribe.durationSeconds && leftHand.length < nLeft) {
    leftHand.push({
      pitch: bassPitches[Math.floor(Math.random() * bassPitches.length)],
      startTime: t,
      duration: beat * 2,
      velocity: 0.7,
      hand: "left",
    });
    t += beat * 2;
  }

  t = 0;
  while (t < transcribe.durationSeconds && rightHand.length < nRight) {
    const dur = beat * (0.5 + Math.random());
    rightHand.push({
      pitch: rightPitches[Math.floor(Math.random() * rightPitches.length)],
      startTime: t,
      duration: dur,
      velocity: 0.8,
      hand: "right",
    });
    t += dur;
  }

  const id = `arr-${Date.now()}`;
  return {
    id,
    transcribeId: transcribe.id,
    difficulty,
    leftHand,
    rightHand,
    measures: [],
    key: transcribe.key,
    tempo: transcribe.tempo,
    durationSeconds: transcribe.durationSeconds,
  };
}
