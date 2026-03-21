"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AudioInputTabs } from "@/components/AudioInputTabs";
import { DifficultySelector } from "@/components/DifficultySelector";
import { ProcessingIndicator } from "@/components/ProcessingIndicator";
import { mockTranscribe, mockArrange } from "@/lib/mockApi";
import { arrangementToWaterfall } from "@/lib/arrangementToWaterfall";
import { saveResult } from "@/lib/resultStore";
import { ensureWavBlob } from "@/lib/audioToWav";
import type { AudioInput, DifficultyLevel, PianoArrangement } from "@/types";

function formatAnalysisError(raw: string): string {
  try {
    const parsed = JSON.parse(raw);
    if (parsed?.error) raw = parsed.error;
  } catch {
    // use raw
  }
  if (typeof raw !== "string") return String(raw);
  if (/aubio not installed/i.test(raw))
    return "aubio 未安装。请在终端执行: pip install aubio（需先安装 Python）";
  if (/aubio/i.test(raw)) return "音频分析依赖 aubio。请执行: pip install aubio";
  if (/python|pip/i.test(raw)) return `环境错误: ${raw}`;
  return raw;
}

function InputContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") === "record" ? "record" : "upload";

  const [step, setStep] = useState<"input" | "difficulty" | "processing">("input");
  const [audio, setAudio] = useState<AudioInput | null>(null);
  const [difficulty, setDifficulty] = useState<DifficultyLevel>("intermediate");
  const [error, setError] = useState<string | null>(null);

  const handleAudioReady = (a: AudioInput) => {
    setAudio(a);
    setStep("difficulty");
    setError(null);
  };

  const runWithMock = async () => {
    if (!audio) return;
    setError(null);
    setStep("processing");
    const transcribe = await mockTranscribe(audio);
    const arrangement = await mockArrange(transcribe, difficulty);
    const waterfallData = arrangementToWaterfall(arrangement);
    saveResult({
      arrangement,
      waterfallData,
      audioUrl: audio.url,
      fromRealAnalysis: false,
      createdAt: Date.now(),
    });
    router.push("/result");
  };

  const handleGenerate = async () => {
    if (!audio) return;
    setStep("processing");
    setError(null);
    try {
      const { blob: sendBlob, filename } = await ensureWavBlob(audio.blob);
      const formData = new FormData();
      formData.append("audio", sendBlob, filename);
      formData.append("difficulty", difficulty);
      const res = await fetch("/api/analyze", { method: "POST", body: formData });
      if (res.ok) {
        const { arrangement } = (await res.json()) as { transcribe: unknown; arrangement: PianoArrangement };
        const waterfallData = arrangementToWaterfall(arrangement);
        saveResult({
          arrangement,
          waterfallData,
          audioUrl: audio.url,
          fromRealAnalysis: true,
          createdAt: Date.now(),
        });
        router.push("/result");
        return;
      }
      const errBody = await res.json().catch(() => ({}));
      const rawDetail = errBody.detail || errBody.error || `请求失败 ${res.status}`;
      const msg = formatAnalysisError(rawDetail);
      throw new Error(msg);
    } catch (e) {
      const message = e instanceof Error ? e.message : "生成失败";
      setError(message);
      setStep("difficulty");
    }
  };

  return (
    <main className="min-h-screen">
      <header className="border-b border-white/10 px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <a href="/" className="text-xl font-bold text-white">
            Playable
          </a>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-10">
        {step === "input" && (
          <>
            <h1 className="text-2xl font-bold text-white">输入音频</h1>
            <p className="mt-2 text-gray-400">上传文件或直接录制环境中的音乐</p>
            <div className="mt-8">
              <AudioInputTabs onAudioReady={handleAudioReady} defaultTab={initialTab} />
            </div>
          </>
        )}

        {step === "difficulty" && audio && (
          <>
            <h1 className="text-2xl font-bold text-white">选择难度</h1>
            <p className="mt-2 text-gray-400">根据你的水平选择编配难度</p>
            <div className="mt-4 rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-200/90">
              <strong>真实分析：</strong>点击「生成钢琴编配」后将<strong>根据您的音频</strong>检测音高与节奏并生成钢琴谱。需在项目目录配置 Python 与 aubio（见 README）。若未配置，失败后可选择「仍使用演示谱」。若配置了 OPENAI_API_KEY，会再用 AI 优化编配。
            </div>
            <div className="mt-8">
              <DifficultySelector value={difficulty} onChange={setDifficulty} />
            </div>
            {error && (
              <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                <p>{error}</p>
                <p className="mt-2 text-red-200/80">若未配置真实分析环境，可先使用演示谱体验。</p>
                <button
                  type="button"
                  onClick={runWithMock}
                  className="mt-2 rounded-lg border border-red-400/50 px-3 py-1.5 text-sm hover:bg-red-500/20"
                >
                  仍使用演示谱（不分析音频）
                </button>
              </div>
            )}
            <div className="mt-8 flex gap-4">
              <button
                type="button"
                onClick={() => setStep("input")}
                className="rounded-xl border border-white/20 px-6 py-3 text-white hover:bg-white/10"
              >
                上一步
              </button>
              <button
                type="button"
                onClick={handleGenerate}
                className="rounded-xl bg-playable-accent px-6 py-3 font-medium text-white hover:opacity-90"
              >
                生成钢琴编配（真实分析音频）
              </button>
            </div>
          </>
        )}

        {step === "processing" && (
          <ProcessingIndicator message="正在分析音频并生成钢琴编配…" />
        )}
      </div>
    </main>
  );
}

export default function InputPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-gray-400">加载中…</div>}>
      <InputContent />
    </Suspense>
  );
}
