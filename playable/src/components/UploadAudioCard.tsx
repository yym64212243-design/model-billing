"use client";

import { useCallback, useRef } from "react";
import type { AudioInput } from "@/types";
import { ACCEPTED_AUDIO_TYPES } from "@/lib/constants";

interface UploadAudioCardProps {
  onAudioReady: (audio: AudioInput) => void;
}

function getDuration(blob: Blob): Promise<number> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audio.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(audio.duration);
    };
    audio.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("无法读取音频"));
    };
  });
}

export function UploadAudioCard({ onAudioReady }: UploadAudioCardProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      const blob = new Blob([await file.arrayBuffer()], { type: file.type });
      const url = URL.createObjectURL(blob);
      let duration = 30;
      try {
        duration = await getDuration(blob);
      } catch {
        // keep default
      }
      const audio: AudioInput = {
        id: `upload-${Date.now()}`,
        source: "upload",
        fileName: file.name,
        durationSeconds: duration,
        blob,
        url,
        mimeType: file.type,
        createdAt: Date.now(),
      };
      onAudioReady(audio);
    },
    [onAudioReady]
  );

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };

  return (
    <div
      className="rounded-2xl border border-white/10 bg-white/5 p-6 transition hover:border-white/20"
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
      role="button"
      tabIndex={0}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_AUDIO_TYPES}
        onChange={onInputChange}
        className="hidden"
      />
      <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
        <div className="rounded-full bg-white/10 p-4">
          <svg className="h-10 w-10 text-playable-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </div>
        <p className="text-gray-300">点击或拖拽上传 MP3、WAV、M4A</p>
        <p className="text-sm text-playable-muted">支持常见音频格式</p>
      </div>
    </div>
  );
}
