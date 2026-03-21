/**
 * 将录音/上传的音频转为 WAV Blob，便于后端 aubio 等工具读取（不支持 WebM/MP3 时）
 */
export async function ensureWavBlob(blob: Blob): Promise<{ blob: Blob; filename: string }> {
  const type = (blob.type || "").toLowerCase();
  if (type.includes("wav")) return { blob, filename: "audio.wav" };
  try {
    const arrayBuffer = await blob.arrayBuffer();
    const ctx = new AudioContext();
    const decoded = await ctx.decodeAudioData(arrayBuffer.slice(0));
    ctx.close();
    const wav = encodeWav(decoded);
    return { blob: new Blob([wav], { type: "audio/wav" }), filename: "audio.wav" };
  } catch {
    return { blob, filename: blob.type ? `audio.${blob.type.split("/")[1]?.split(";")[0] || "bin"}` : "audio.bin" };
  }
}

function encodeWav(audioBuffer: AudioBuffer): ArrayBuffer {
  const numChannels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const format = 1;
  const bitDepth = 16;
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;
  const dataLength = audioBuffer.length * blockAlign;
  const buffer = new ArrayBuffer(44 + dataLength);
  const view = new DataView(buffer);
  const writeStr = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };
  writeStr(0, "RIFF");
  view.setUint32(4, 36 + dataLength, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  writeStr(36, "data");
  view.setUint32(40, dataLength, true);
  const left = audioBuffer.getChannelData(0);
  const right = numChannels > 1 ? audioBuffer.getChannelData(1) : left;
  let offset = 44;
  for (let i = 0; i < audioBuffer.length; i++) {
    const s = Math.max(-1, Math.min(1, left[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    offset += 2;
    if (numChannels > 1) {
      const s2 = Math.max(-1, Math.min(1, right[i]));
      view.setInt16(offset, s2 < 0 ? s2 * 0x8000 : s2 * 0x7fff, true);
      offset += 2;
    }
  }
  return buffer;
}
