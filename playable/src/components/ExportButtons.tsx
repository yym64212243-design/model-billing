"use client";

import type { ExportState, ExportFormat } from "@/types";

interface ExportButtonsProps {
  exportStates: Partial<Record<ExportFormat, ExportState>>;
  onExport: (format: ExportFormat) => void;
}

const LABELS: Record<ExportFormat, string> = {
  pdf: "导出 PDF",
  midi: "导出 MIDI",
  musicxml: "导出 MusicXML",
};

export function ExportButtons({ exportStates, onExport }: ExportButtonsProps) {
  return (
    <div className="flex flex-wrap gap-3">
      {(["pdf", "midi", "musicxml"] as ExportFormat[]).map((format) => {
        const state = exportStates[format] ?? { status: "idle" as const, url: null, error: null };
        const loading = state.status === "generating";
        const ready = state.status === "ready" && state.url;

        return (
          <div key={format} className="flex items-center gap-2">
            <button
              type="button"
              disabled={loading}
              onClick={() => (ready ? window.open(state.url!, "_blank") : onExport(format))}
              className="touch-target rounded-xl border border-white/20 bg-white/5 px-4 py-2 text-sm font-medium text-white hover:bg-white/10 disabled:opacity-50"
            >
              {loading ? "生成中…" : ready ? "下载 " + LABELS[format] : LABELS[format]}
            </button>
            {state.error && (
              <span className="text-xs text-red-400">{state.error}</span>
            )}
          </div>
        );
      })}
      <p className="w-full text-xs text-playable-muted">
        MVP 阶段为预留入口，接入真实乐谱/MIDI 生成后即可使用。
      </p>
    </div>
  );
}
