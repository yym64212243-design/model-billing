"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRecording } from "@/hooks/useRecording";
import type { AudioInput } from "@/types";
import { RecordingStatus } from "@/types";

interface RecordAudioCardProps {
  onAudioReady: (audio: AudioInput) => void;
}

const statusLabel: Record<RecordingStatus, string> = {
  idle: "空闲",
  recording: "录音中",
  processing: "处理中",
  completed: "已完成",
};

export function RecordAudioCard({ onAudioReady }: RecordAudioCardProps) {
  const { status, duration, error, startRecording, stopRecording, reset, getCompletedBlob } =
    useRecording();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState(false);
  const previewUrlRef = useRef<string | null>(null);

  useEffect(() => {
    setPreviewError(false);
    if (status === "completed") {
      const blob = getCompletedBlob();
      if (blob) {
        if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = URL.createObjectURL(blob);
        setPreviewUrl(previewUrlRef.current);
      }
    } else {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = null;
      }
      setPreviewUrl(null);
    }
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = null;
      }
    };
  }, [status, getCompletedBlob]);

  const handleUseRecording = useCallback(() => {
    const blob = getCompletedBlob();
    if (!blob || status !== "completed") return;
    const url = URL.createObjectURL(blob);
    const audio: AudioInput = {
      id: `record-${Date.now()}`,
      source: "record",
      fileName: "录音",
      durationSeconds: duration,
      blob,
      url,
      mimeType: blob.type,
      createdAt: Date.now(),
    };
    onAudioReady(audio);
  }, [getCompletedBlob, status, duration, onAudioReady]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
      <p className="mb-2 text-sm text-playable-muted">
        安静环境下效果更佳，建议让设备靠近钢琴或音源。第一版更适合旋律清晰的歌曲。
      </p>
      <div className="flex flex-col items-center gap-4 py-6">
        <span
          className={`rounded-full px-4 py-1.5 text-sm font-medium ${
            status === "recording"
              ? "bg-red-500/20 text-red-400"
              : status === "processing"
              ? "bg-amber-500/20 text-amber-400"
              : status === "completed"
              ? "bg-green-500/20 text-green-400"
              : "bg-white/10 text-gray-400"
          }`}
        >
          {statusLabel[status]}
        </span>
        {status === "recording" && (
          <p className="text-2xl font-mono tabular-nums text-white">
            {formatTime(duration)}
          </p>
        )}
        {error && <p className="text-sm text-red-400">{error}</p>}
        <div className="flex gap-3">
          {status === "idle" && (
            <button
              type="button"
              onClick={startRecording}
              className="touch-target rounded-xl bg-red-500 px-6 py-3 text-white transition hover:bg-red-600"
            >
              开始录音
            </button>
          )}
          {status === "recording" && (
            <button
              type="button"
              onClick={stopRecording}
              className="touch-target rounded-xl bg-gray-600 px-6 py-3 text-white transition hover:bg-gray-500"
            >
              停止录音
            </button>
          )}
          {status === "completed" && (
            <>
              {previewUrl && (
                <>
                  <audio
                    controls
                    src={previewUrl}
                    className="w-full max-w-md rounded-lg bg-black/30"
                    onError={() => setPreviewError(true)}
                  />
                  {previewError && (
                    <p className="text-sm text-amber-400">
                      无法在此浏览器中预览播放（部分浏览器不支持该录音格式），您仍可点击「使用这段录音」继续生成。
                    </p>
                  )}
                </>
              )}
              <p className="text-sm text-gray-400">试听录音，确认后使用或重录</p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleUseRecording}
                  className="touch-target rounded-xl bg-playable-accent px-6 py-3 text-white transition hover:opacity-90"
                >
                  使用这段录音
                </button>
                <button
                  type="button"
                  onClick={reset}
                  className="touch-target rounded-xl border border-white/30 px-6 py-3 text-white transition hover:bg-white/10"
                >
                  删除并重录
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
