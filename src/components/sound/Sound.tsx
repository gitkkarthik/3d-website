"use client";

import { useEffect, useRef, useState } from "react";
import { Waveform } from "./Waveform";
import { analyseAudio, formatDuration, startRecording } from "@/lib/audio-client";

export type AnalysedSound = { file: Blob; url: string; peaks: number[]; duration: number; name: string };

/** One audio element per card; pauses any other card that's playing. */
let current: HTMLAudioElement | null = null;

export function useAudio(src: string | null) {
  const ref = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    if (!src) return;
    const a = new Audio(src);
    a.preload = "metadata";
    ref.current = a;
    let raf = 0;
    const tick = () => {
      if (a.duration) setProgress(a.currentTime / a.duration);
      raf = requestAnimationFrame(tick);
    };
    a.onplay = () => {
      if (current && current !== a) current.pause();
      current = a;
      setPlaying(true);
      raf = requestAnimationFrame(tick);
    };
    a.onpause = () => {
      setPlaying(false);
      cancelAnimationFrame(raf);
    };
    a.onended = () => {
      setPlaying(false);
      setProgress(1);
      cancelAnimationFrame(raf);
      setTimeout(() => setProgress(0), 600);
    };
    return () => {
      a.pause();
      cancelAnimationFrame(raf);
      ref.current = null;
    };
  }, [src]);
  return {
    playing,
    progress,
    audio: ref,
    toggle: () => {
      const a = ref.current;
      if (!a) return;
      if (a.paused) a.play().catch(() => {});
      else a.pause();
    },
    seek: (f: number) => {
      const a = ref.current;
      if (!a || !a.duration) return;
      a.currentTime = f * a.duration;
      setProgress(f);
      if (a.paused) a.play().catch(() => {});
    },
  };
}

export function PlayButton({ playing, onClick, size = 48, tone = "light", label }: { playing: boolean; onClick: () => void; size?: number; tone?: "light" | "dark"; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={playing ? `Pause ${label}` : `Play ${label}`}
      className={`relative grid shrink-0 place-items-center rounded-full transition-transform duration-300 active:scale-95 ${tone === "dark" ? "bg-ivory text-night" : "bg-clay text-white"}`}
      style={{ width: size, height: size }}
    >
      {playing && <span className={`absolute inset-0 animate-ping rounded-full ${tone === "dark" ? "bg-ivory/30" : "bg-clay/30"}`} aria-hidden />}
      {playing ? (
        <svg width={size * 0.32} height={size * 0.32} viewBox="0 0 12 12" fill="currentColor" aria-hidden>
          <rect x="2" y="1.5" width="3" height="9" rx="1" />
          <rect x="7" y="1.5" width="3" height="9" rx="1" />
        </svg>
      ) : (
        <svg width={size * 0.32} height={size * 0.32} viewBox="0 0 12 12" fill="currentColor" aria-hidden className="translate-x-[1px]">
          <path d="M2.5 1.3v9.4c0 .5.5.8.9.5l7.4-4.7c.4-.3.4-.8 0-1.1L3.4.8c-.4-.3-.9 0-.9.5Z" />
        </svg>
      )}
    </button>
  );
}

export function SoundCard({ src, peaks, duration, title, tone = "light", onRemove }: { src: string; peaks: number[]; duration?: number | null; title: string; tone?: "light" | "dark"; onRemove?: () => void }) {
  const a = useAudio(src);
  const dark = tone === "dark";
  return (
    <div className={`flex items-center gap-3 rounded-2xl p-3 ${dark ? "bg-white/[0.06] ring-1 ring-white/10" : "bg-paper shadow-[0_0_0_1px_var(--color-line)]"}`}>
      <PlayButton playing={a.playing} onClick={a.toggle} size={44} tone={dark ? "dark" : "light"} label={title} />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p className={`truncate text-sm font-medium ${dark ? "text-ivory" : "text-ink"}`}>{title}</p>
          {duration ? <span className={`text-xs tabular-nums ${dark ? "text-white/50" : "text-ink-mute"}`}>{formatDuration(duration)}</span> : null}
        </div>
        <Waveform peaks={peaks} progress={a.progress} height={30} onSeek={a.seek} activeClass={dark ? "fill-[#e7c3a5]" : "fill-clay"} idleClass={dark ? "fill-white/20" : "fill-oat"} label={`${title} waveform. Click to seek.`} />
      </div>
      {onRemove && (
        <button type="button" onClick={onRemove} className={`shrink-0 rounded-full px-2 py-1 text-xs ${dark ? "text-white/60 hover:text-white" : "text-ink-mute hover:text-ink"}`} aria-label={`Remove ${title}`}>
          ✕
        </button>
      )}
    </div>
  );
}

/** Record with the microphone, or pick a voice note / audio file. Analyses locally. */
export function SoundAdder({ onAdded, tone = "light", disabled, compact }: { onAdded: (s: AnalysedSound) => void | Promise<void>; tone?: "light" | "dark"; disabled?: boolean; compact?: boolean }) {
  const input = useRef<HTMLInputElement>(null);
  const rec = useRef<Awaited<ReturnType<typeof startRecording>> | null>(null);
  const [state, setState] = useState<"idle" | "recording" | "working">("idle");
  const [secs, setSecs] = useState(0);
  const [err, setErr] = useState<string | null>(null);
  const dark = tone === "dark";

  useEffect(() => () => rec.current?.cancel(), []);

  async function handle(file: Blob, name: string) {
    setState("working");
    setErr(null);
    try {
      if (file.size > 20 * 1024 * 1024) throw new Error("big");
      const { peaks, duration } = await analyseAudio(file);
      if (duration < 0.4) throw new Error("short");
      await onAdded({ file, url: URL.createObjectURL(file), peaks, duration, name });
    } catch (e) {
      const m = (e as Error).message;
      setErr(
        m === "big"
          ? "That file is over 20 MB. A shorter clip works best."
          : m === "short"
            ? "That recording is too short. Try a few seconds."
            : m && !["EncodingError", "big", "short"].includes(m) && !/decode|Unable/i.test(m)
              ? m
              : "We couldn't read that file. Voice notes (M4A, MP3, WAV, OGG, OPUS) work best.",
      );
    } finally {
      setState("idle");
    }
  }

  async function startRec() {
    setErr(null);
    try {
      setSecs(0);
      rec.current = await startRecording(120, setSecs);
      setState("recording");
    } catch {
      setErr("We couldn't use your microphone. You can upload a voice note instead.");
    }
  }

  async function stopRec() {
    const r = rec.current;
    rec.current = null;
    if (!r) return;
    const file = await r.stop();
    await handle(file, "A recording");
  }

  const btn = dark ? "bg-ivory text-night hover:bg-white" : "bg-ink text-ivory hover:bg-[#3d3733]";
  const ghost = dark ? "text-ivory ring-1 ring-white/25 hover:bg-white/10" : "text-ink ring-1 ring-oat hover:bg-paper";

  return (
    <div>
      <div className={`flex flex-wrap items-center gap-2 ${compact ? "" : "sm:gap-3"}`}>
        {state === "recording" ? (
          <button type="button" onClick={stopRec} className="btn btn-clay btn-sm gap-2">
            <span className="h-2 w-2 animate-pulse rounded-full bg-white" aria-hidden /> Stop · {formatDuration(secs)}
          </button>
        ) : (
          <button type="button" onClick={startRec} disabled={disabled || state === "working"} className={`btn btn-sm gap-2 ${btn}`}>
            <span className="h-2 w-2 rounded-full bg-[#d0543f]" aria-hidden /> Record their sound
          </button>
        )}
        <button type="button" onClick={() => input.current?.click()} disabled={disabled || state !== "idle"} className={`btn btn-sm ${ghost}`}>
          {state === "working" ? "Listening…" : "Upload a voice note"}
        </button>
        <input
          ref={input}
          type="file"
          accept="audio/*,video/mp4,video/quicktime,.m4a,.mp3,.wav,.ogg,.opus,.aac,.webm"
          className="sr-only"
          tabIndex={-1}
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (f) handle(f, f.name.replace(/\.[^.]+$/, "") || "A recording");
          }}
        />
      </div>
      {err && (
        <p className={`mt-2 text-sm ${dark ? "text-[#f0b5a4]" : "text-[#a3402c]"}`} role="alert">
          {err}
        </p>
      )}
    </div>
  );
}
