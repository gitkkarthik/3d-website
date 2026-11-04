"use client";

/**
 * A waveform drawn from real peaks. `progress` (0–1) lights bars up as audio plays,
 * like the engraving on the keepsake coming alive.
 */
export function Waveform({
  peaks,
  progress = 0,
  height = 56,
  gap = 2,
  activeClass = "fill-clay",
  idleClass = "fill-oat",
  onSeek,
  label = "Waveform",
}: {
  peaks: number[];
  progress?: number;
  height?: number;
  gap?: number;
  activeClass?: string;
  idleClass?: string;
  onSeek?: (fraction: number) => void;
  label?: string;
}) {
  const n = peaks.length || 1;
  const w = 1000;
  const bw = w / n - gap;
  return (
    <svg
      viewBox={`0 0 ${w} ${height}`}
      preserveAspectRatio="none"
      className={`block w-full ${onSeek ? "cursor-pointer" : ""}`}
      style={{ height }}
      role={onSeek ? "slider" : "img"}
      aria-label={label}
      aria-valuenow={onSeek ? Math.round(progress * 100) : undefined}
      aria-valuemin={onSeek ? 0 : undefined}
      aria-valuemax={onSeek ? 100 : undefined}
      tabIndex={onSeek ? 0 : undefined}
      onClick={(e) => {
        if (!onSeek) return;
        const r = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
        onSeek(Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)));
      }}
      onKeyDown={(e) => {
        if (!onSeek) return;
        if (e.key === "ArrowRight") onSeek(Math.min(1, progress + 0.05));
        if (e.key === "ArrowLeft") onSeek(Math.max(0, progress - 0.05));
      }}
    >
      {peaks.map((p, i) => {
        const h = Math.max(3, p * (height - 2));
        const active = (i + 0.5) / n <= progress;
        return <rect key={i} x={i * (bw + gap) + gap / 2} y={(height - h) / 2} width={Math.max(1, bw)} height={h} rx={Math.min(bw / 2, 4)} className={`${active ? activeClass : idleClass} transition-colors duration-150`} />;
      })}
    </svg>
  );
}
