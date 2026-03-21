/**
 * 实时音高检测模块
 * MVP：基于 FFT 峰值估计主频，映射到最近 MIDI 音高
 * 与 UI 解耦，后续可替换为更精确的算法（如 YIN、CREPE、ML 模型）
 */

const A4_MIDI = 69;
const A4_FREQ = 440;

function freqToMidi(freq: number): number {
  if (freq <= 0) return 0;
  return Math.round(12 * Math.log2(freq / A4_FREQ) + A4_MIDI);
}

/**
 * 从 AnalyserNode 的频域数据中估计主频（简化：取幅值最大 bin 对应频率）
 */
export function estimatePitchFromAnalyser(
  analyser: AnalyserNode,
  sampleRate: number,
  minFreq = 80,
  maxFreq = 1200
): number | null {
  const data = new Float32Array(analyser.frequencyBinCount);
  analyser.getFloatFrequencyData(data);

  let maxMag = -Infinity;
  let maxBin = 0;
  const minBin = Math.floor((minFreq / sampleRate) * analyser.fftSize);
  const maxBinIdx = Math.min(
    Math.ceil((maxFreq / sampleRate) * analyser.fftSize),
    data.length - 1
  );

  for (let i = minBin; i <= maxBinIdx; i++) {
    if (data[i] > maxMag) {
      maxMag = data[i];
      maxBin = i;
    }
  }

  if (maxMag < -80) return null; // 静音或噪声
  const freq = (maxBin * sampleRate) / analyser.fftSize;
  const midi = freqToMidi(freq);
  if (midi < 21 || midi > 108) return null;
  return midi;
}

/**
 * 检测当前帧是否包含多个明显频率（简单和弦）
 * MVP：可只取主频，后续扩展为多音检测
 */
export function estimateChordFromAnalyser(
  analyser: AnalyserNode,
  sampleRate: number,
  topN = 3
): number[] {
  const midi = estimatePitchFromAnalyser(analyser, sampleRate);
  if (midi === null) return [];
  return [midi];
}
