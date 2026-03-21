#!/usr/bin/env python3
"""
真实音频转谱：使用 aubio 做 onset + pitch 检测，输出音符序列 JSON。
供 Next.js API 调用，用于「根据录音/上传音频生成钢琴谱」。
依赖: pip install aubio (或见 requirements-transcribe.txt)
"""
import json
import sys
import os

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Usage: transcribe_audio.py <path_to_audio>"}), file=sys.stderr)
        sys.exit(1)
    path = sys.argv[1]
    if not os.path.isfile(path):
        print(json.dumps({"error": f"File not found: {path}"}), file=sys.stderr)
        sys.exit(1)

    try:
        import aubio
    except ImportError:
        print(json.dumps({"error": "aubio not installed. Run: pip install aubio"}), file=sys.stderr)
        sys.exit(1)

    # 打开音频
    samplerate = 44100
    hop_s = 256
    win_s = 2048
    source = aubio.source(path, samplerate, hop_s)
    samplerate = source.samplerate
    total_frames = 0
    notes = []  # [{ startTime, duration, pitch, velocity }]
    onset_detector = aubio.onset("default", win_s, hop_s, samplerate)
    pitch_detector = aubio.pitch("yin", win_s, hop_s, samplerate)
    pitch_detector.set_unit("midi")
    pitch_detector.set_tolerance(0.7)

    current_onset_time = None
    current_pitch_sum = 0
    current_pitch_count = 0
    last_midi = None

    while True:
        samples, read = source()
        if read == 0:
            break
        time_sec = total_frames / samplerate
        onset = onset_detector(samples)
        if onset:
            if current_onset_time is not None and last_midi is not None and current_pitch_count > 0:
                duration = time_sec - current_onset_time
                avg_midi = current_pitch_sum / current_pitch_count
                midi_int = int(round(avg_midi))
                if 21 <= midi_int <= 108 and duration > 0.02:
                    notes.append({
                        "startTime": round(current_onset_time, 4),
                        "duration": round(duration, 4),
                        "pitch": midi_int,
                        "velocity": 0.8,
                    })
            current_onset_time = time_sec
            current_pitch_sum = 0
            current_pitch_count = 0
            last_midi = None

        pitch_midi = pitch_detector(samples)[0]
        confidence = pitch_detector.get_confidence()
        if confidence > 0.6 and pitch_midi > 0:
            midi_int = int(round(pitch_midi))
            if 21 <= midi_int <= 108:
                current_pitch_sum += pitch_midi
                current_pitch_count += 1
                last_midi = pitch_midi

        total_frames += read

    # 最后一段
    if current_onset_time is not None and last_midi is not None and current_pitch_count > 0:
        duration = total_frames / samplerate - current_onset_time
        avg_midi = current_pitch_sum / current_pitch_count
        midi_int = int(round(avg_midi))
        if 21 <= midi_int <= 108 and duration > 0.02:
            notes.append({
                "startTime": round(current_onset_time, 4),
                "duration": round(duration, 4),
                "pitch": midi_int,
                "velocity": 0.8,
            })

    duration_seconds = total_frames / samplerate
    # 简单估计 tempo：从相邻 onset 间隔
    tempos = []
    for i in range(1, len(notes)):
        dt = notes[i]["startTime"] - notes[i - 1]["startTime"]
        if 0.2 < dt < 2.0:
            tempos.append(60 / dt)
    tempo = int(round(sum(tempos) / len(tempos))) if tempos else 90
    tempo = max(60, min(180, tempo))

    # 简单估计 key：出现最多的音名 (简化)
    pitch_classes = [n["pitch"] % 12 for n in notes]
    from collections import Counter
    most = Counter(pitch_classes).most_common(1)
    names = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
    key = names[most[0][0]] if most else "C"

    out = {
        "durationSeconds": round(duration_seconds, 2),
        "tempo": tempo,
        "key": key,
        "notes": notes,
    }
    print(json.dumps(out))


if __name__ == "__main__":
    main()
