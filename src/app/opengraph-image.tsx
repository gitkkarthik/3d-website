import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import path from "node:path";

export const alt = "Pawsome Memories: personalised pet keepsakes, made in India";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OG() {
  const png = await import("sharp").then(async ({ default: sharp }) =>
    sharp(await readFile(path.join(process.cwd(), "public/renders/forever.webp"))).png().toBuffer(),
  );
  const src = `data:image/png;base64,${png.toString("base64")}`;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#f8f3ec", fontFamily: "Georgia, serif" }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 0 0 80px", width: 660 }}>
          <div style={{ fontSize: 22, letterSpacing: 5, color: "#9a5a37", textTransform: "uppercase", fontFamily: "sans-serif" }}>Pawsome Memories</div>
          <div style={{ fontSize: 64, lineHeight: 1.08, color: "#2b2724", marginTop: 24 }}>Your pet is one of a kind.</div>
          <div style={{ fontSize: 64, lineHeight: 1.08, color: "#9a5a37", fontStyle: "italic" }}>Their keepsake should be too.</div>
          <div style={{ fontSize: 26, color: "#5d554f", marginTop: 28, fontFamily: "sans-serif" }}>Personalised, hand-painted pet figurines · Made in India</div>
        </div>
        <div style={{ display: "flex", width: 540, alignItems: "center", justifyContent: "center", background: "#efe5d6" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} width={480} height={480} alt="" style={{ objectFit: "contain" }} />
        </div>
      </div>
    ),
    size,
  );
}
