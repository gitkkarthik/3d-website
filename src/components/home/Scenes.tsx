import Image from "next/image";
import QRCode from "qrcode";
import { SITE } from "@/lib/site";

const BARS = [0.2, 0.35, 0.5, 0.42, 0.7, 0.9, 0.62, 0.8, 1, 0.74, 0.55, 0.86, 0.6, 0.4, 0.68, 0.92, 0.7, 0.5, 0.36, 0.58, 0.78, 0.45, 0.3, 0.52, 0.66, 0.4, 0.28, 0.2];

function QrSvg({ text, color }: { text: string; color: string }) {
  const qr = QRCode.create(text, { errorCorrectionLevel: "M" });
  const n = qr.modules.size;
  const rects: string[] = [];
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (qr.modules.get(x, y)) rects.push(`M${x} ${y}h1v1h-1z`);
  return (
    <svg viewBox={`-2 -2 ${n + 4} ${n + 4}`} className="h-full w-full" aria-hidden shapeRendering="crispEdges">
      <path d={rects.join("")} fill={color} />
    </svg>
  );
}

function Phone({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative mx-auto h-full w-[58%] min-w-[180px] rounded-[2rem] bg-night p-[6px] shadow-[0_30px_60px_-30px_rgb(40_25_10/0.7)]">
      <div className="relative h-full overflow-hidden rounded-[1.65rem]">{children}</div>
      <span className="absolute left-1/2 top-[10px] h-[14px] w-[56px] -translate-x-1/2 rounded-full bg-night" aria-hidden />
    </div>
  );
}

/** A phone camera finding the code engraved on a walnut base. */
export function ScanScene() {
  return (
    <div className="relative aspect-[4/5] overflow-hidden rounded-[1.75rem] bg-[radial-gradient(ellipse_at_50%_40%,#4a3426,#241c17)] py-6" aria-hidden>
      <Phone>
        <div className="absolute inset-0 bg-[repeating-linear-gradient(176deg,#6e4a33_0px,#6e4a33_9px,#62412c_10px,#7a5239_15px)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/40" />
        <div className="absolute left-1/2 top-1/2 h-[46%] w-[66%] -translate-x-1/2 -translate-y-1/2">
          <div className="absolute inset-[12%] opacity-90">
            <QrSvg text={`${SITE.url}/memory-pages`} color="#ead7b9" />
          </div>
          {/* viewfinder corners */}
          {["left-0 top-0 border-l-2 border-t-2 rounded-tl-xl", "right-0 top-0 border-r-2 border-t-2 rounded-tr-xl", "left-0 bottom-0 border-l-2 border-b-2 rounded-bl-xl", "right-0 bottom-0 border-r-2 border-b-2 rounded-br-xl"].map((c) => (
            <span key={c} className={`absolute h-6 w-6 border-[#ffd36b] ${c}`} />
          ))}
          <span className="scanline absolute inset-x-2 h-[2px] rounded-full bg-[#ffd36b]/80 shadow-[0_0_12px_#ffd36b]" />
        </div>
        <div className="absolute inset-x-3 top-9 flex items-center gap-2 rounded-2xl bg-white/90 px-3 py-2 text-[10px] text-ink shadow-lg backdrop-blur">
          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-clay text-[10px] text-white">♪</span>
          <span className="min-w-0 leading-tight">
            <span className="block font-semibold">Bruno&apos;s sound</span>
            <span className="block truncate text-ink-mute">Tap to listen</span>
          </span>
        </div>
      </Phone>
    </div>
  );
}

/** The memory player, mid-play. */
export function ListenScene() {
  return (
    <div className="relative aspect-[4/5] overflow-hidden rounded-[1.75rem] bg-[radial-gradient(ellipse_at_50%_40%,#e9dccb,#d6c3aa)] py-6" aria-hidden>
      <Phone>
        <div className="absolute inset-0 bg-night" />
        <div className="absolute inset-x-0 top-0 h-[62%] opacity-60">
          <Image src="/renders/forever.webp" alt="" fill sizes="200px" className="scale-125 object-cover blur-2xl" />
        </div>
        <div className="relative flex h-full flex-col items-center px-4 pt-10 text-center">
          <div className="relative h-[38%] w-[62%] overflow-hidden rounded-t-full bg-sand">
            <Image src="/renders/forever.webp" alt="" fill sizes="160px" className="object-cover object-top" />
          </div>
          <p className="mt-3 font-display text-xl leading-none text-ivory">Bruno</p>
          <p className="mt-1 text-[9px] uppercase tracking-[0.18em] text-white/50">The way he says hello</p>
          <div className="mt-4 flex h-9 w-full items-center gap-[2px] px-1">
            {BARS.map((b, i) => (
              <span key={i} className="wave-bar flex-1 rounded-full bg-white/25" style={{ height: `${b * 100}%`, animationDelay: `${i * 0.11}s` }} />
            ))}
          </div>
          <span className="mt-4 grid h-11 w-11 place-items-center rounded-full bg-ivory text-night">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
              <rect x="2" y="1.5" width="3" height="9" rx="1" />
              <rect x="7" y="1.5" width="3" height="9" rx="1" />
            </svg>
          </span>
        </div>
      </Phone>
    </div>
  );
}
