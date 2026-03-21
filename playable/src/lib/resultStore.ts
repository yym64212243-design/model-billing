/**
 * MVP 结果存储：使用 sessionStorage 在页面间传递编配与瀑布流数据
 * 后续可替换为 API + 服务端存储
 */

import type { PianoArrangement, WaterfallData } from "@/types";

const KEY = "playable_result";

export interface StoredResult {
  arrangement: PianoArrangement;
  waterfallData: WaterfallData;
  /** 原始音频的 blob URL，用于瀑布流页同步播放（同会话内有效） */
  audioUrl?: string;
  /** 是否来自真实音频分析（true=按音频生成，false=演示谱） */
  fromRealAnalysis?: boolean;
  createdAt: number;
}

export function saveResult(result: StoredResult): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(KEY, JSON.stringify(result));
  } catch {
    // ignore
  }
}

export function loadResult(): StoredResult | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredResult;
  } catch {
    return null;
  }
}
