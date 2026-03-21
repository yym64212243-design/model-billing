import { NextRequest, NextResponse } from "next/server";
import { writeFile, unlink, mkdir } from "fs/promises";
import { spawn } from "child_process";
import path from "path";
import os from "os";
import type { TranscribeResult, PianoArrangement, DifficultyLevel } from "@/types";

const PYTHON = process.env.PLAYABLE_PYTHON || "python3";
const SCRIPT_PATH = path.join(process.cwd(), "scripts", "transcribe_audio.py");

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || process.env.PLAYABLE_AI_API_KEY;
const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";

type RawNotes = { durationSeconds: number; tempo: number; key: string; notes: Array<{ startTime: number; duration: number; pitch: number; velocity: number }> };

/** 可选：用 AI 优化音符序列（需配置 OPENAI_API_KEY） */
async function optimizeWithAi(raw: RawNotes, difficulty: DifficultyLevel): Promise<RawNotes> {
  if (!OPENAI_API_KEY) return raw;
  try {
    const res = await fetch(`${OPENAI_BASE_URL.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "你是钢琴编配助手。只输出合法 JSON，不要其他文字。输出格式必须为: {\"notes\": [{\"startTime\": number, \"duration\": number, \"pitch\": number, \"velocity\": number}, ...]}。pitch 为 MIDI 音高(21-108)，startTime/duration 单位秒，velocity 0-1。",
          },
          {
            role: "user",
            content: `根据难度「${difficulty}」优化以下钢琴音符，保持时长与整体结构，只输出上述 JSON。\n${JSON.stringify({ notes: raw.notes.slice(0, 200) })}`,
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
      }),
    });
    if (!res.ok) return raw;
    const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const text = data.choices?.[0]?.message?.content;
    if (!text) return raw;
    const parsed = JSON.parse(text) as { notes?: RawNotes["notes"] };
    if (Array.isArray(parsed.notes) && parsed.notes.length > 0) {
      return { ...raw, notes: parsed.notes };
    }
  } catch {
    // ignore, use original raw
  }
  return raw;
}

/** 将真实转谱的 notes 转为 TranscribeResult + PianoArrangement */
function buildResult(
  raw: { durationSeconds: number; tempo: number; key: string; notes: Array<{ startTime: number; duration: number; pitch: number; velocity: number }> },
  difficulty: DifficultyLevel,
  audioInputId: string
): { transcribe: TranscribeResult; arrangement: PianoArrangement } {
  const id = `tr-${Date.now()}`;
  const arrId = `arr-${Date.now()}`;
  const notes = raw.notes;

  const melody = notes.map((n) => ({
    time: n.startTime,
    pitch: n.pitch,
    duration: n.duration,
    velocity: n.velocity,
  }));

  const transcribe: TranscribeResult = {
    id,
    audioInputId,
    tempo: raw.tempo,
    key: raw.key,
    timeSignature: "4/4",
    melody,
    chords: [],
    sections: [{ name: "full", startTime: 0, endTime: raw.durationSeconds }],
    durationSeconds: raw.durationSeconds,
  };

  const splitNote = (n: (typeof notes)[0]) => ({
    pitch: n.pitch,
    startTime: n.startTime,
    duration: n.duration,
    velocity: n.velocity,
    hand: n.pitch < 60 ? ("left" as const) : ("right" as const),
  });

  let leftNotes = notes.filter((n) => n.pitch < 60).map(splitNote);
  let rightNotes = notes.filter((n) => n.pitch >= 60).map(splitNote);

  if (difficulty === "beginner") {
    rightNotes = rightNotes.filter((_, i) => i % 2 === 0);
    leftNotes = leftNotes.length > 20 ? leftNotes.filter((_, i) => i % 2 === 0) : leftNotes;
  } else if (difficulty === "intermediate") {
    rightNotes = rightNotes.filter((_, i) => i % 2 === 0 || rightNotes[i]?.duration > 0.2);
  }

  const arrangement: PianoArrangement = {
    id: arrId,
    transcribeId: id,
    difficulty,
    leftHand: leftNotes,
    rightHand: rightNotes,
    measures: [],
    key: raw.key,
    tempo: raw.tempo,
    durationSeconds: raw.durationSeconds,
  };

  return { transcribe, arrangement };
}

export async function POST(request: NextRequest) {
  let tmpPath: string | null = null;
  try {
    const formData = await request.formData();
    const audio = formData.get("audio") as File | null;
    const difficulty = (formData.get("difficulty") as DifficultyLevel) || "intermediate";
    if (!audio || !(audio instanceof Blob)) {
      return NextResponse.json({ error: "Missing audio file" }, { status: 400 });
    }

    const buf = Buffer.from(await audio.arrayBuffer());
    const ext = path.extname(audio.name || "") || ".wav";
    const tmpDir = path.join(os.tmpdir(), "playable");
    await mkdir(tmpDir, { recursive: true });
    tmpPath = path.join(tmpDir, `audio-${Date.now()}${ext}`);
    await writeFile(tmpPath, buf);

    const py = spawn(PYTHON, [SCRIPT_PATH, tmpPath], {
      cwd: process.cwd(),
      stdio: ["ignore", "pipe", "pipe"],
    });

    const stdout: Buffer[] = [];
    const stderr: Buffer[] = [];
    py.stdout?.on("data", (ch) => stdout.push(ch));
    py.stderr?.on("data", (ch) => stderr.push(ch));

    const code = await new Promise<number>((resolve) => {
      py.on("close", resolve);
    });

    if (tmpPath) {
      try {
        await unlink(tmpPath);
      } catch {
        // ignore
      }
      tmpPath = null;
    }

    if (code !== 0) {
      const err = Buffer.concat(stderr).toString("utf8");
      return NextResponse.json(
        { error: "Transcription failed", detail: err || "Python script error" },
        { status: 502 }
      );
    }

    const out = Buffer.concat(stdout).toString("utf8").trim();
    let raw: RawNotes;
    try {
      raw = JSON.parse(out);
    } catch {
      return NextResponse.json({ error: "Invalid script output", detail: out.slice(0, 200) }, { status: 502 });
    }

    if (raw.notes.length === 0) {
      return NextResponse.json(
        { error: "No notes detected", hint: "Try a clearer melody or WAV/MP3 format" },
        { status: 422 }
      );
    }

    const rawFinal = await optimizeWithAi(raw, difficulty);
    const { transcribe, arrangement } = buildResult(rawFinal, difficulty, "upload");
    return NextResponse.json({ transcribe, arrangement });
  } catch (e) {
    if (tmpPath) {
      try {
        await unlink(tmpPath);
      } catch {
        // ignore
      }
    }
    return NextResponse.json(
      { error: "Server error", detail: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}
