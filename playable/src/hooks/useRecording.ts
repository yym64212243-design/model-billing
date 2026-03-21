"use client";

import { useState, useCallback, useRef } from "react";
import type { RecordingStatus } from "@/types";

function getPreferredAudioMime(): string {
  if (typeof MediaRecorder === "undefined") return "audio/webm";
  // Safari 等对 WebM 的 <audio> 播放支持差，优先尝试 mp4
  if (MediaRecorder.isTypeSupported("audio/mp4")) return "audio/mp4";
  if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) return "audio/webm;codecs=opus";
  if (MediaRecorder.isTypeSupported("audio/webm")) return "audio/webm";
  return "audio/webm";
}

interface UseRecordingOptions {
  onComplete?: (blob: Blob, durationSeconds: number) => void;
}

export function useRecording(options: UseRecordingOptions = {}) {
  const [status, setStatus] = useState<RecordingStatus>("idle");
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const completedBlobRef = useRef<Blob | null>(null);
  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startRecording = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // 优先使用浏览器可播放的格式，避免预览时显示 Error（如 Safari 不支持 WebM）
      const mime = getPreferredAudioMime();
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: mime });
        completedBlobRef.current = blob;
        const durationSeconds = (Date.now() - startTimeRef.current) / 1000;
        setDuration(durationSeconds);
        setStatus("completed");
      };
      recorder.start(200);
      startTimeRef.current = Date.now();
      setStatus("recording");
      setDuration(0);
      timerRef.current = setInterval(() => {
        setDuration((Date.now() - startTimeRef.current) / 1000);
      }, 100);
    } catch (err) {
      setError(err instanceof Error ? err.message : "无法访问麦克风");
      setStatus("idle");
    }
  }, [options]);

  const stopRecording = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (mediaRecorderRef.current?.state === "recording") {
      setStatus("processing");
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    setStatus("idle");
    setDuration(0);
    setError(null);
    chunksRef.current = [];
    completedBlobRef.current = null;
  }, []);

  const getCompletedBlob = useCallback((): Blob | null => completedBlobRef.current, []);

  return { status, duration, error, startRecording, stopRecording, reset, getCompletedBlob };
}
