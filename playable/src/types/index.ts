/**
 * Playable — 核心数据类型定义
 * 与 UI 解耦，便于后续接入真实转谱/编配/听音服务
 */

// ─── 1. 音频输入对象 ─────────────────────────────────────────────────────────
export type AudioSourceType = "upload" | "record";

export interface AudioInput {
  id: string;
  source: AudioSourceType;
  /** 原始文件名（上传时）或 "录音" */
  fileName: string;
  /** 时长（秒） */
  durationSeconds: number;
  /** 用于播放/上传的 Blob */
  blob: Blob;
  /** 用于预览的 Object URL，用完后需 revokeObjectURL */
  url: string;
  /** 文件类型，如 audio/mpeg, audio/wav */
  mimeType: string;
  /** 创建时间 */
  createdAt: number;
}

// ─── 2. 转录结果对象（可被真实 ASR/转谱服务替换）────────────────────────────
export interface TranscribeResult {
  id: string;
  audioInputId: string;
  /** 曲速 BPM */
  tempo: number;
  /** 调性，如 "C", "Am", "F#m" */
  key: string;
  /** 拍号，如 "4/4" */
  timeSignature: string;
  /** 旋律轮廓 / 音高序列（简化表示，实际可为 MIDI 或事件列表） */
  melody: MelodyEvent[];
  /** 和弦进行 */
  chords: ChordEvent[];
  /** 段落，如 intro, verse, chorus */
  sections: SectionInfo[];
  /** 总时长（秒） */
  durationSeconds: number;
}

export interface MelodyEvent {
  time: number;
  pitch: number; // MIDI note number
  duration: number;
  velocity?: number;
}

export interface ChordEvent {
  time: number;
  duration: number;
  /** 根音 + 类型，如 "C", "Am7", "F#m" */
  symbol: string;
  /** MIDI 音高数组（可选，用于编配） */
  pitches?: number[];
}

export interface SectionInfo {
  name: string;
  startTime: number;
  endTime: number;
}

// ─── 3. 钢琴编配结果对象 ───────────────────────────────────────────────────
export type DifficultyLevel = "beginner" | "intermediate" | "advanced";

export interface PianoArrangement {
  id: string;
  transcribeId: string;
  difficulty: DifficultyLevel;
  /** 左手音符 */
  leftHand: ArrangementNote[];
  /** 右手音符 */
  rightHand: ArrangementNote[];
  /** 小节信息（用于乐谱排版） */
  measures: MeasureInfo[];
  /** 伴奏型描述，如 "block", "arpeggio" */
  accompanimentStyle?: string;
  /** 调性 */
  key: string;
  /** 曲速 */
  tempo: number;
  /** 总时长（秒） */
  durationSeconds: number;
}

export interface ArrangementNote {
  pitch: number; // MIDI 0–127
  startTime: number; // 秒
  duration: number; // 秒
  velocity: number; // 0–1
  hand: "left" | "right";
}

export interface MeasureInfo {
  index: number;
  startTime: number;
  endTime: number;
  timeSignature: string;
}

// ─── 4. 瀑布流可视化数据对象 ────────────────────────────────────────────────
export interface WaterfallNote {
  id: string;
  pitch: number;
  startTime: number;
  duration: number;
  /** 键盘 lane / 键位索引 (0–87 或相对 88 键) */
  keyIndex: number;
  /** 用于分组的颜色/轨道 */
  colorGroup: number;
  hand: "left" | "right";
  velocity: number;
}

export interface WaterfallData {
  notes: WaterfallNote[];
  durationSeconds: number;
  tempo: number;
  /** 最低 MIDI 音高（用于映射到 lane） */
  minPitch: number;
  /** 最高 MIDI 音高 */
  maxPitch: number;
}

// ─── 5. 跟弹监听状态对象 ───────────────────────────────────────────────────
export type MonitorState = "idle" | "listening" | "matching" | "error";

export interface LiveInputMonitorState {
  /** 当前监听状态 */
  state: MonitorState;
  /** 当前识别到的音（MIDI 音高数组，支持和弦） */
  detectedPitches: number[];
  /** 当前应命中的音（来自瀑布流） */
  expectedPitches: number[];
  /** 是否命中 */
  isHit: boolean;
  /** 命中时间偏差（毫秒，正为延后） */
  hitTimeOffsetMs: number | null;
  /** 连续命中次数 */
  streak: number;
  /** 最近一次命中时间 */
  lastHitAt: number | null;
}

// ─── 6. 导出对象 ───────────────────────────────────────────────────────────
export type ExportFormat = "pdf" | "midi" | "musicxml";

export interface ExportState {
  format: ExportFormat;
  /** 生成状态 */
  status: "idle" | "generating" | "ready" | "error";
  /** 下载地址或 blob URL */
  url: string | null;
  error: string | null;
}

// ─── 7. 录音状态 ───────────────────────────────────────────────────────────
export type RecordingStatus = "idle" | "recording" | "processing" | "completed";

// ─── 8. 二次调整请求 ───────────────────────────────────────────────────────
export type RefineAction =
  | "simplify"
  | "enrich"
  | "transpose_up"
  | "transpose_down"
  | "simplify_left"
  | "melody_only";

export interface RefineRequest {
  arrangementId: string;
  action: RefineAction;
}
