"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrangementSummary } from "@/components/ArrangementSummary";
import { ScorePreview } from "@/components/ScorePreview";
import { PlaybackControls } from "@/components/PlaybackControls";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { ExportButtons } from "@/components/ExportButtons";
import { RefineControls } from "@/components/RefineControls";
import { loadResult, saveResult } from "@/lib/resultStore";
import { mockArrange } from "@/lib/mockApi";
import { arrangementToWaterfall } from "@/lib/arrangementToWaterfall";
import type { PianoArrangement, RefineAction, ExportFormat, ExportState } from "@/types";

export default function ResultPage() {
  const [arrangement, setArrangement] = useState<PianoArrangement | null>(null);
  const [refining, setRefining] = useState(false);
  const [exportStates, setExportStates] = useState<Partial<Record<ExportFormat, ExportState>>>({});

  const [fromRealAnalysis, setFromRealAnalysis] = useState(false);
  useEffect(() => {
    const result = loadResult();
    if (result) {
      setArrangement(result.arrangement);
      setFromRealAnalysis(result.fromRealAnalysis ?? false);
    }
  }, []);

  const handleRefine = async (action: RefineAction) => {
    if (!arrangement) return;
    setRefining(true);
    try {
      const next = await mockArrange(
        {
          id: arrangement.transcribeId,
          audioInputId: "",
          tempo: arrangement.tempo,
          key: arrangement.key,
          timeSignature: "4/4",
          melody: [],
          chords: [],
          sections: [],
          durationSeconds: arrangement.durationSeconds,
        },
        arrangement.difficulty,
        action
      );
      const waterfallData = arrangementToWaterfall(next);
      saveResult({ arrangement: next, waterfallData, fromRealAnalysis: false, createdAt: Date.now() });
      setArrangement(next);
      setFromRealAnalysis(false);
    } finally {
      setRefining(false);
    }
  };

  const handleExport = (format: ExportFormat) => {
    setExportStates((s) => ({ ...s, [format]: { format, status: "generating", url: null, error: null } }));
    setTimeout(() => {
      setExportStates((s) => ({ ...s, [format]: { format, status: "idle", url: null, error: "MVP 阶段暂未实现" } }));
    }, 800);
  };

  if (!arrangement) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400">未找到生成结果</p>
          <Link href="/input" className="mt-4 inline-block text-playable-accent hover:underline">
            去生成
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <header className="border-b border-white/10 px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link href="/" className="text-xl font-bold text-white">
            Playable
          </Link>
          <ThemeSwitcher />
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="text-2xl font-bold text-white">生成结果</h1>
        <p className="mt-2 text-sm text-gray-400">
          {fromRealAnalysis
            ? "已根据您的音频分析生成钢琴编配，播放为钢琴音。"
            : "当前为演示谱（未对音频做真实分析）。播放为钢琴音。"}
        </p>

        <div className="mt-6">
          <ArrangementSummary arrangement={arrangement} />
        </div>

        <div className="mt-8 flex flex-wrap gap-4">
          <Link
            href="/waterfall"
            className="inline-flex items-center rounded-xl bg-playable-accent px-6 py-3 font-medium text-white hover:opacity-90"
          >
            进入瀑布流视图
          </Link>
          <Link
            href="/waterfall?practice=1"
            className="inline-flex items-center rounded-xl border border-white/30 bg-white/5 px-6 py-3 text-white hover:bg-white/10"
          >
            跟弹监听模式
          </Link>
        </div>

        <div className="mt-8">
          <ScorePreview arrangement={arrangement} />
        </div>

        <div className="mt-8">
          <h3 className="text-sm font-medium text-playable-muted">导出</h3>
          <div className="mt-2">
            <ExportButtons
              exportStates={exportStates}
              onExport={handleExport}
            />
          </div>
        </div>

        <div className="mt-8">
          <RefineControls onRefine={handleRefine} isRefining={refining} />
        </div>
      </div>
    </main>
  );
}
