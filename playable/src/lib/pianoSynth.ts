/**
 * 钢琴音色合成（Web Audio API）
 * 根据编配音符在播放时触发，用于瀑布流视图的钢琴声
 * 多振荡器 + 包络模拟钢琴击弦感
 */

const A4_MIDI = 69;
const A4_HZ = 440;

function midiToFreq(midi: number): number {
  return A4_HZ * Math.pow(2, (midi - A4_MIDI) / 12);
}

/**
 * 在给定 AudioContext 上播放一个钢琴音（多谐波 + 击弦包络）
 */
export function playPianoNote(
  ctx: AudioContext,
  pitch: number,
  duration: number,
  velocity: number
): void {
  const freq = midiToFreq(pitch);
  const now = ctx.currentTime;
  const vol = 0.35 * Math.min(1, velocity + 0.25);

  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(0, now);
  masterGain.gain.linearRampToValueAtTime(vol, now + 0.008);
  masterGain.gain.exponentialRampToValueAtTime(vol * 0.25, now + duration * 0.15);
  masterGain.gain.exponentialRampToValueAtTime(0.001, now + Math.min(duration, 1.2));
  masterGain.connect(ctx.destination);

  const playOsc = (type: OscillatorType, f: number, gainVal: number) => {
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(f, now);
    const g = ctx.createGain();
    g.gain.setValueAtTime(gainVal, now);
    osc.connect(g);
    g.connect(masterGain);
    osc.start(now);
    osc.stop(now + Math.min(duration, 1.5));
  };

  playOsc("sine", freq, 1);
  playOsc("sine", freq * 2, 0.4);
  playOsc("sine", freq * 2.5, 0.2);
  playOsc("sine", freq * 4, 0.08);
}

/**
 * 创建或获取单例 AudioContext，并在用户手势下 resume
 */
export function getPianoAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const ctx = (window as unknown as { __playablePianoCtx?: AudioContext }).__playablePianoCtx;
  if (ctx) return ctx;
  const c = new (window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)();
  (window as unknown as { __playablePianoCtx?: AudioContext }).__playablePianoCtx = c;
  return c;
}

export async function resumePianoContext(): Promise<AudioContext | null> {
  const ctx = getPianoAudioContext();
  if (!ctx) return null;
  if (ctx.state === "suspended") await ctx.resume();
  return ctx;
}
