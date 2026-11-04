"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import LazyKeepsake from "@/components/three/LazyKeepsake";
import { SoundAdder, SoundCard, type AnalysedSound } from "@/components/sound/Sound";
import { sampleWaveform } from "@/lib/audio-client";
import { saveHandoff } from "@/lib/sound-handoff";

/**
 * The first thing people see: their pet's real sound becoming an engraving.
 * Everything here happens on the visitor's device. Nothing is uploaded.
 */
export function SoundHero({ siteUrl }: { siteUrl: string }) {
  const [name, setName] = useState("");
  const [sound, setSound] = useState<AnalysedSound | null>(null);
  const sample = useMemo(() => sampleWaveform(), []);
  const display = name.trim() || "Bruno";
  useEffect(() => () => (sound ? URL.revokeObjectURL(sound.url) : undefined), [sound]);

  return (
    <div className="grid items-center gap-10 lg:grid-cols-[1fr_1.05fr] lg:gap-14">
      <div className="animate-rise">
        <p className="eyebrow !text-clay-soft">Pawsome Memories · Made in India</p>
        <h1 className="mt-6 text-[2.7rem] leading-[1.02] text-ivory sm:text-6xl lg:text-[4.6rem]">
          Some memories you hold.{" "}
          <em className="italic-soft text-[#e7c3a5]">Some you hear again.</em>
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-[#cfc4b8]">
          We sculpt your pet from your photos and engrave their real bark, purr or voice into the base. Years from now, scan it, and there they are.
        </p>

        <div className="mt-9 max-w-xl rounded-[1.5rem] bg-white/[0.04] p-5 ring-1 ring-white/10 backdrop-blur sm:p-6">
          <p className="font-display text-xl text-ivory">Try it with their sound</p>
          <p className="mt-1 text-sm text-white/55">Record them now, or use a voice note from your phone. It never leaves this device.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
            <label className="sr-only" htmlFor="hero-name">
              Their name
            </label>
            <input
              id="hero-name"
              value={name}
              maxLength={24}
              autoComplete="off"
              onChange={(e) => setName(e.target.value)}
              placeholder="Their name"
              className="w-full rounded-xl border border-white/15 bg-white/[0.06] px-4 py-2.5 text-ivory placeholder:text-white/35 focus:border-clay-soft focus:outline-none"
            />
          </div>
          <div className="mt-4">
            {sound ? (
              <SoundCard src={sound.url} peaks={sound.peaks} duration={sound.duration} title={`${display}'s sound`} tone="dark" onRemove={() => setSound(null)} />
            ) : (
              <SoundAdder tone="dark" onAdded={(s) => setSound(s)} />
            )}
          </div>
          <Link
            href={`/create${name.trim() ? `?name=${encodeURIComponent(name.trim())}` : ""}`}
            onClick={() => {
              if (sound) saveHandoff({ file: sound.file, name: sound.name, peaks: sound.peaks, duration: sound.duration, petName: name.trim() });
            }}
            className="btn mt-5 w-full bg-clay text-white hover:bg-[#864c2d] sm:w-auto"
          >
            {sound ? `Keep ${display}'s sound forever` : "Create their keepsake"} <span aria-hidden>→</span>
          </Link>
        </div>
      </div>

      <div className="relative animate-fade [animation-delay:200ms]">
        <div className="relative aspect-square overflow-hidden rounded-[2rem] sm:aspect-[5/4.6]">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_30%,#3a2c22_0%,#231d19_45%,#1a1614_100%)]" />
          <div className="absolute left-1/2 top-0 h-2/3 w-2/3 -translate-x-1/2 rounded-full bg-[#f3c79c]/10 blur-3xl" aria-hidden />
          <div className="absolute inset-0">
            <LazyKeepsake figure="dog-sitting" coat="fawn" base="walnut" engraving={display} peaks={sound?.peaks ?? sample} qr={`${siteUrl}/memory-pages`} framing="hero" stage="dark" />
          </div>
          <span className="absolute left-4 top-4 rounded-full bg-black/40 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.08em] text-white/70 ring-1 ring-white/10 backdrop-blur">
            {sound ? "Their real sound, engraved" : "Illustrative render · sample sound shape"}
          </span>
          <p className="pointer-events-none absolute inset-x-0 bottom-4 text-center text-xs text-white/40">Drag to turn · the QR on the base really scans</p>
        </div>
      </div>
    </div>
  );
}
