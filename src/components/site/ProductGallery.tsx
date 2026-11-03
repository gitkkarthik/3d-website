"use client";

import Image from "next/image";
import { useState } from "react";
import LazyKeepsake from "@/components/three/LazyKeepsake";
import type { FigureKey } from "@/components/three/Figurines";
import type { BaseStyle } from "@/components/three/baseStyle";

export function ProductGallery({ images, figure, coat, base, engraving, line2, name, memorial }: {
  images: string[];
  figure: FigureKey;
  coat: string;
  base: BaseStyle;
  engraving: string;
  line2?: string;
  name: string;
  memorial?: boolean;
}) {
  const [active, setActive] = useState<number | "3d">(0);
  const bg = memorial ? "bg-[#ece7df]" : "bg-sand";
  return (
    <div>
      <div className={`relative aspect-square overflow-hidden rounded-[1.75rem] ${bg}`}>
        {active === "3d" ? (
          <LazyKeepsake figure={figure} coat={coat as never} base={base} engraving={engraving} line2={line2} framing="card" />
        ) : (
          <Image src={images[active]} alt={`${name}: illustrative render, view ${active + 1}`} fill priority sizes="(min-width:1024px) 50vw, 100vw" className="object-contain p-6" />
        )}
        <span className="render-tag absolute left-4 top-4">Illustrative studio render</span>
        {active === "3d" && <p className="pointer-events-none absolute inset-x-0 bottom-4 text-center text-xs text-ink-mute">Drag to turn</p>}
      </div>
      <div className="mt-3 flex gap-3">
        {images.map((src, i) => (
          <button
            key={src}
            type="button"
            onClick={() => setActive(i)}
            aria-label={`View ${i + 1}`}
            aria-pressed={active === i}
            className={`relative h-20 w-20 overflow-hidden rounded-2xl ${bg} transition-shadow ${active === i ? "shadow-[0_0_0_2px_var(--color-ink)]" : "shadow-[0_0_0_1px_var(--color-line)]"}`}
          >
            <Image src={src} alt="" fill sizes="80px" className="object-contain p-1.5" />
          </button>
        ))}
        <button
          type="button"
          onClick={() => setActive("3d")}
          aria-pressed={active === "3d"}
          className={`flex h-20 flex-1 items-center justify-center gap-2 rounded-2xl px-4 text-sm font-medium transition-shadow sm:flex-none ${active === "3d" ? "bg-ink text-ivory" : "bg-paper text-ink shadow-[0_0_0_1px_var(--color-line)]"}`}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
            <path d="M21 12a9 4 0 1 1-18 0" />
            <path d="m18 15 3-3 3 3" transform="translate(-3 0)" />
            <path d="M12 3v9" />
          </svg>
          Turn it around
        </button>
      </div>
    </div>
  );
}
