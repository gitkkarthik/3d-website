"use client";

import Link from "next/link";
import { useState } from "react";
import LazyKeepsake from "@/components/three/LazyKeepsake";
import type { FigureKey } from "@/components/three/Figurines";
import type { BaseStyle } from "@/components/three/baseStyle";

const LOOKS: { figure: FigureKey; coat: string; base: BaseStyle; label: string }[] = [
  { figure: "dog-sitting", coat: "fawn", base: "walnut", label: "Indie, sitting" },
  { figure: "cat-loaf", coat: "tabby", base: "slate", label: "Cat, loafing" },
  { figure: "dog-play", coat: "tuxedo", base: "oak", label: "Playtime" },
  { figure: "dog-sleeping", coat: "golden", base: "ivory", label: "Asleep" },
];

export function HeroKeepsake() {
  const [name, setName] = useState("");
  const [look, setLook] = useState(0);
  const l = LOOKS[look];
  const display = name.trim() || "Bruno";

  return (
    <div className="relative">
      <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] bg-sand sm:aspect-[5/5] lg:aspect-[4/5]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_35%,#fbf5ec_0%,#efe5d6_55%,#e6d8c4_100%)]" />
        <div className="absolute inset-0">
          <LazyKeepsake figure={l.figure} coat={l.coat as never} base={l.base} engraving={display} framing="hero" />
        </div>
        <span className="render-tag absolute left-4 top-4">Illustrative studio render</span>
        <div className="absolute right-4 top-4 flex gap-1.5" role="group" aria-label="Example styles">
          {LOOKS.map((x, i) => (
            <button
              key={x.label}
              type="button"
              onClick={() => setLook(i)}
              aria-pressed={i === look}
              aria-label={x.label}
              title={x.label}
              className={`h-2.5 rounded-full transition-all duration-300 ${i === look ? "w-6 bg-ink" : "w-2.5 bg-ink/25 hover:bg-ink/45"}`}
            />
          ))}
        </div>
        <p className="pointer-events-none absolute inset-x-0 bottom-4 text-center text-xs text-ink-mute">Drag to turn it around</p>
      </div>

      {/* The "try it" engraving card */}
      <div className="relative z-10 mx-3 -mt-14 rounded-2xl bg-paper p-4 shadow-[0_0_0_1px_var(--color-line),0_18px_40px_-18px_rgb(70_45_25/0.35)] sm:mx-8 sm:p-5">
        <label htmlFor="hero-name" className="text-sm font-medium text-ink">
          Whose name should we engrave?
        </label>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <input
            id="hero-name"
            className="input !py-2.5"
            placeholder="Type your pet's name"
            value={name}
            maxLength={24}
            autoComplete="off"
            onChange={(e) => setName(e.target.value)}
          />
          <Link
            href={`/create${name.trim() ? `?name=${encodeURIComponent(name.trim())}` : ""}`}
            className="btn btn-clay shrink-0"
          >
            {name.trim() ? `Start ${name.trim().slice(0, 14)}'s keepsake` : "Start"}
            <span aria-hidden>→</span>
          </Link>
        </div>
        <p className="mt-2 text-xs text-ink-mute">
          This shows our base and engraving style. Your pet&apos;s figurine is sculpted by our artist from your own photos.
        </p>
      </div>
    </div>
  );
}
