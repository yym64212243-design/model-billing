"use client";

import { useState } from "react";
import { UploadAudioCard } from "./UploadAudioCard";
import { RecordAudioCard } from "./RecordAudioCard";
import type { AudioInput } from "@/types";

interface AudioInputTabsProps {
  onAudioReady: (audio: AudioInput) => void;
  defaultTab?: "upload" | "record";
}

export function AudioInputTabs({ onAudioReady, defaultTab = "upload" }: AudioInputTabsProps) {
  const [tab, setTab] = useState<"upload" | "record">(defaultTab);

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="flex rounded-xl bg-white/5 p-1">
        <button
          type="button"
          onClick={() => setTab("upload")}
          className={`touch-target flex-1 rounded-lg py-3 text-sm font-medium transition ${
            tab === "upload" ? "bg-playable-accent text-white" : "text-gray-400 hover:text-white"
          }`}
        >
          上传音频
        </button>
        <button
          type="button"
          onClick={() => setTab("record")}
          className={`touch-target flex-1 rounded-lg py-3 text-sm font-medium transition ${
            tab === "record" ? "bg-playable-accent text-white" : "text-gray-400 hover:text-white"
          }`}
        >
          直接录音
        </button>
      </div>
      <div className="mt-6">
        {tab === "upload" && <UploadAudioCard onAudioReady={onAudioReady} />}
        {tab === "record" && <RecordAudioCard onAudioReady={onAudioReady} />}
      </div>
    </div>
  );
}
