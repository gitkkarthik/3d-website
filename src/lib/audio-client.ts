"use client";

/**
 * Turn a recording into ~N normalised peaks (0–1) for drawing and engraving.
 * Runs entirely in the browser: nothing is uploaded to compute it.
 */
export async function analyseAudio(file: Blob, bars = 72): Promise<{ peaks: number[]; duration: number }> {
  const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const ctx = new Ctx();
  try {
    const buf = await ctx.decodeAudioData(await file.arrayBuffer());
    const data = buf.getChannelData(0);
    // Ignore leading/trailing near-silence so the engraving shows the actual sound.
    const threshold = 0.02;
    let start = 0;
    let end = data.length - 1;
    while (start < end && Math.abs(data[start]) < threshold) start++;
    while (end > start && Math.abs(data[end]) < threshold) end--;
    if (end - start < bars) {
      start = 0;
      end = data.length - 1;
    }
    const span = end - start;
    const peaks: number[] = [];
    for (let i = 0; i < bars; i++) {
      const a = start + Math.floor((i * span) / bars);
      const b = start + Math.floor(((i + 1) * span) / bars);
      let sum = 0;
      let max = 0;
      for (let j = a; j < b; j++) {
        const v = Math.abs(data[j]);
        sum += v * v;
        if (v > max) max = v;
      }
      const rms = Math.sqrt(sum / Math.max(1, b - a));
      peaks.push(rms * 0.7 + max * 0.3);
    }
    const top = Math.max(...peaks, 1e-6);
    return { peaks: peaks.map((p) => Math.round(Math.min(1, Math.pow(p / top, 0.8)) * 1000) / 1000), duration: buf.duration };
  } finally {
    ctx.close().catch(() => {});
  }
}

export function formatDuration(sec: number) {
  const s = Math.max(0, Math.round(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/** A gentle placeholder waveform (clearly a sample, used before someone adds their own). */
export function sampleWaveform(bars = 72): number[] {
  return Array.from({ length: bars }, (_, i) => {
    const t = i / bars;
    const env = Math.sin(Math.PI * t) ** 0.6;
    const v = 0.35 + 0.65 * Math.abs(Math.sin(i * 1.7) * Math.cos(i * 0.43));
    return Math.round(env * v * 1000) / 1000;
  });
}

/** Simple microphone recorder. Returns a stop() that resolves to the recording. */
export async function startRecording(maxSeconds = 120, onTick?: (sec: number) => void): Promise<{ stop: () => Promise<File>; cancel: () => void }> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false } });
  const mime = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"].find((m) => MediaRecorder.isTypeSupported(m)) ?? "";
  const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
  const chunks: Blob[] = [];
  rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
  let secs = 0;
  const timer = setInterval(() => {
    secs++;
    onTick?.(secs);
    if (secs >= maxSeconds && rec.state === "recording") rec.stop();
  }, 1000);
  const done = new Promise<File>((resolve) => {
    rec.onstop = () => {
      clearInterval(timer);
      stream.getTracks().forEach((t) => t.stop());
      const type = rec.mimeType || "audio/webm";
      resolve(new File(chunks, `recording.${type.includes("mp4") ? "m4a" : "webm"}`, { type }));
    };
  });
  rec.start();
  return {
    stop: () => {
      if (rec.state === "recording") rec.stop();
      return done;
    },
    cancel: () => {
      clearInterval(timer);
      if (rec.state === "recording") rec.stop();
      stream.getTracks().forEach((t) => t.stop());
    },
  };
}
