/** 产品常量 */

export const APP_NAME = "Playable";
export const TAGLINE = "把你喜欢的歌，变成你能弹、能看、能跟弹的钢琴版本";

export const DIFFICULTY_OPTIONS = [
  { value: "beginner" as const, label: "初级", description: "左手简单，旋律清晰" },
  { value: "intermediate" as const, label: "中级", description: "适中织体，适合练习" },
  { value: "advanced" as const, label: "高级", description: "更丰富编配" },
] as const;

export const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5] as const;

export const ACCEPTED_AUDIO_TYPES = "audio/mpeg,audio/wav,audio/mp3,audio/m4a,audio/x-m4a,audio/aac";

export const REFINE_ACTIONS = [
  { action: "simplify" as const, label: "更简单一点" },
  { action: "enrich" as const, label: "更丰富一点" },
  { action: "transpose_up" as const, label: "升调" },
  { action: "transpose_down" as const, label: "降调" },
  { action: "simplify_left" as const, label: "左手更简单" },
  { action: "melody_only" as const, label: "只保留主旋律加简单伴奏" },
] as const;
