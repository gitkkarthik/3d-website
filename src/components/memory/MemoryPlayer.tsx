"use client";

import { useEffect, useRef, useState } from "react";
import { Waveform } from "@/components/sound/Waveform";
import { PlayButton } from "@/components/sound/Sound";
import { formatDuration } from "@/lib/audio-client";

export type PlayerSound = { id: string; src: string; peaks: number[] | null; duration: number | null; title: string };
export type PlayerPhoto = { src: string; alt: string };

const FLAT = Array.from({ length: 72 }, (_, i) => 0.25 + 0.2 * Math.abs(Math.sin(i * 0.9)));

/**
 * What you see when you scan the keepsake: their face, their name, and one tap to hear them.
 * Photos drift and crossfade while the sound plays; the waveform lights up as it goes.
 */
export function MemoryPlayer({ name, subtitle, memorial, photos, sounds }: { name: string; subtitle?: string | null; memorial: boolean; photos: PlayerPhoto[]; sounds: PlayerSound[] }) {
  const audio = useRef<HTMLAudioElement | null>(null);
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [photo, setPhoto] = useState(0);
  const [started, setStarted] = useState(false);
  const sound = sounds[idx];

  // Slow slideshow while listening (and a gentler one while idle).
  useEffect(() => {
    if (photos.length < 2) return;
    const t = setInterval(() => setPhoto((p) => (p + 1) % photos.length), playing ? 4500 : 8000);
    return () => clearInterval(t);
  }, [photos.length, playing]);

  useEffect(() => {
    const a = audio.current;
    if (!a || !sound) return;
    let raf = 0;
    const tick = () => {
      if (a.duration) setProgress(a.currentTime / a.duration);
      raf = requestAnimationFrame(tick);
    };
    const onPlay = () => {
      setPlaying(true);
      raf = requestAnimationFrame(tick);
    };
    const onPause = () => {
      setPlaying(false);
      cancelAnimationFrame(raf);
    };
    const onEnd = () => {
      cancelAnimationFrame(raf);
      setProgress(1);
      if (idx < sounds.length - 1) {
        setTimeout(() => {
          setProgress(0);
          setIdx(idx + 1);
        }, 900);
      } else {
        setPlaying(false);
        setTimeout(() => setProgress(0), 1200);
      }
    };
    a.addEventListener("play", onPlay);
    a.addEventListener("pause", onPause);
    a.addEventListener("ended", onEnd);
    if (started) a.play().catch(() => setPlaying(false));
    return () => {
      a.removeEventListener("play", onPlay);
      a.removeEventListener("pause", onPause);
      a.removeEventListener("ended", onEnd);
      cancelAnimationFrame(raf);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, sound?.src]);

  function toggle() {
    const a = audio.current;
    if (!a) return;
    setStarted(true);
    if (a.paused) a.play().catch(() => {});
    else a.pause();
  }

  return (
    <section className="relative isolate flex min-h-[100svh] flex-col overflow-hidden bg-night text-ivory">
      {/* Ambient background: the current photo, blurred */}
      {photos.map((p, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={`bg-${p.src}`} src={p.src} alt="" aria-hidden className={`absolute inset-0 -z-10 h-full w-full scale-125 object-cover blur-3xl transition-opacity duration-[2000ms] ${i === photo ? "opacity-45" : "opacity-0"}`} />
      ))}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-night/40 via-night/60 to-night" aria-hidden />

      <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-6 pb-10 pt-14 text-center">
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-[#e7c3a5]">{memorial ? "In loving memory" : "A little piece of them, forever"}</p>

        <div className="relative mt-7 aspect-[4/5] w-[62vw] max-w-[260px] overflow-hidden rounded-t-full bg-white/5 shadow-[0_40px_80px_-30px_rgb(0_0_0/0.8)] ring-1 ring-white/10">
          {photos.length ? (
            photos.map((p, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={p.src} src={p.src} alt={i === photo ? p.alt : ""} className={`kenburns absolute inset-0 h-full w-full object-cover transition-opacity duration-[1600ms] ${i === photo ? "opacity-100" : "opacity-0"}`} />
            ))
          ) : (
            <div className="grid h-full place-items-center font-display text-6xl text-white/30">{name.slice(0, 1)}</div>
          )}
        </div>

        <h1 className="mt-7 text-[3.2rem] leading-none text-ivory sm:text-6xl">{name}</h1>
        {subtitle && <p className="mt-3 font-display text-lg italic text-white/70">{subtitle}</p>}

        {sound ? (
          <div className="mt-8 w-full">
            {/* key forces a fresh element per sound so iOS reliably loads the new source */}
            <audio key={sound.src} ref={audio} src={sound.src} preload="metadata" playsInline />
            <div className="flex items-center gap-4">
              <PlayButton playing={playing} onClick={toggle} size={64} tone="dark" label={sound.title} />
              <div className="min-w-0 flex-1 text-left">
                <p className="truncate text-sm font-medium text-ivory">{started ? sound.title : `Hear ${name}`}</p>
                <p className="text-xs tabular-nums text-white/50">
                  {sound.duration ? formatDuration(sound.duration) : ""}
                  {sounds.length > 1 ? ` · ${idx + 1} of ${sounds.length}` : ""}
                </p>
              </div>
            </div>
            <div className="mt-4">
              <Waveform
                peaks={sound.peaks ?? FLAT}
                progress={progress}
                height={56}
                activeClass="fill-[#e7c3a5]"
                idleClass="fill-white/20"
                onSeek={(f) => {
                  const a = audio.current;
                  if (a?.duration) {
                    a.currentTime = f * a.duration;
                    setStarted(true);
                    a.play().catch(() => {});
                  }
                }}
                label={`${sound.title}: waveform`}
              />
            </div>
            {sounds.length > 1 && (
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                {sounds.map((s, i) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      setStarted(true);
                      setProgress(0);
                      setIdx(i);
                    }}
                    className={`rounded-full px-3 py-1.5 text-xs transition-colors ${i === idx ? "bg-ivory text-night" : "bg-white/10 text-white/75 hover:bg-white/20"}`}
                  >
                    {s.title}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : null}
      </div>

      <a href="#story" className="mx-auto mb-6 flex flex-col items-center gap-1 text-xs text-white/50 hover:text-white">
        Their story
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" className="animate-bounce" aria-hidden>
          <path d="m3 5 4 4 4-4" />
        </svg>
      </a>
    </section>
  );
}
