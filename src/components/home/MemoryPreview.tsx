import Image from "next/image";

/** A static, clearly-labelled sample of a memory page, built in HTML. */
export function MemoryPreview() {
  const bars = [6, 10, 16, 9, 20, 14, 24, 12, 18, 8, 22, 15, 10, 19, 7, 13, 21, 11, 16, 6, 12, 18, 9, 14];
  return (
    <div className="relative mx-auto w-full max-w-[340px]">
      <div className="rounded-[2.6rem] bg-night p-2.5 shadow-[0_40px_80px_-40px_rgb(40_25_10/0.6)]">
        <div className="overflow-hidden rounded-[2.1rem] bg-ivory">
          <div className="relative h-44 bg-[radial-gradient(ellipse_at_50%_40%,#fbf5ec,#e8dccb)]">
            <Image src="/renders/forever.webp" alt="" fill sizes="340px" className="object-contain p-3" />
          </div>
          <div className="px-6 pb-7 pt-5 text-center">
            <p className="eyebrow">Laddoo&apos;s memory page</p>
            <p className="mt-2 font-display text-[1.7rem] leading-tight">
              Laddoo, <em className="italic-soft">our sunshine</em>
            </p>
            <p className="mt-1 text-xs text-ink-mute">Found us on a rainy July evening · 2019</p>
            <div className="mt-5 flex items-center gap-3 rounded-2xl bg-paper p-3 text-left shadow-[0_0_0_1px_var(--color-line)]">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-clay text-white" aria-hidden>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor"><path d="M2 1.2v9.6L10.5 6 2 1.2Z" /></svg>
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-ink">His &lsquo;talking&rsquo; at dinner time</p>
                <div className="mt-1.5 flex h-6 items-center gap-[3px]" aria-hidden>
                  {bars.map((h, i) => (
                    <span key={i} className={`w-[3px] rounded-full ${i < 9 ? "bg-clay" : "bg-oat"}`} style={{ height: h }} />
                  ))}
                </div>
              </div>
              <span className="text-[0.65rem] text-ink-mute">0:14</span>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-1.5" aria-hidden>
              <div className="aspect-square rounded-lg bg-[linear-gradient(140deg,#d9b48f,#a8754f)]" />
              <div className="aspect-square rounded-lg bg-[linear-gradient(140deg,#e8d8bf,#c4a27c)]" />
              <div className="aspect-square rounded-lg bg-[linear-gradient(140deg,#c9b8a3,#8f7a64)]" />
            </div>
            <p className="mt-5 text-left font-display text-[0.95rem] italic leading-relaxed text-ink-soft">
              &ldquo;He never learned to fetch. He did learn exactly which drawer the biscuits live in.&rdquo;
            </p>
          </div>
        </div>
      </div>
      <span className="render-tag absolute -right-2 top-8 rotate-3">Sample page</span>
    </div>
  );
}
