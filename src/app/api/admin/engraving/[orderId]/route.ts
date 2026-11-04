import { and, asc, eq, isNotNull } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { qrMatrix, scanUrl } from "@/lib/qr";

export const runtime = "nodejs";

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/**
 * Vector engraving artwork for the production partner: name, optional date line,
 * the pet's real waveform and the keepsake's permanent QR code. Sized in millimetres.
 * Admin only; enforced here, not by hiding the link.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ orderId: string }> }) {
  const user = await getCurrentUser();
  if (user?.role !== "ADMIN") return new Response("Not found", { status: 404 });
  const { orderId } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(orderId)) return new Response("Not found", { status: 404 });
  const [order] = await db.select().from(schema.orders).where(eq(schema.orders.id, orderId));
  if (!order) return new Response("Not found", { status: 404 });
  const [page] = await db.select().from(schema.memoryPages).where(eq(schema.memoryPages.orderId, orderId));

  // The engraved sound: the order's first recording, else the first voice note added to their memory page.
  let [sound] = await db
    .select()
    .from(schema.uploads)
    .where(and(eq(schema.uploads.orderId, orderId), eq(schema.uploads.kind, "PET_SOUND"), isNotNull(schema.uploads.waveform)))
    .orderBy(asc(schema.uploads.sortOrder))
    .limit(1);
  if (!sound && page) {
    [sound] = await db
      .select()
      .from(schema.uploads)
      .where(and(eq(schema.uploads.memoryPageId, page.id), eq(schema.uploads.kind, "MEMORY_AUDIO"), isNotNull(schema.uploads.waveform)))
      .orderBy(asc(schema.uploads.sortOrder))
      .limit(1);
  }

  const W = 120; // mm
  const H = 34;
  const qrSize = page?.qrToken ? 26 : 0;
  const textW = W - (qrSize ? qrSize + 6 : 0);
  const cx = textW / 2;
  const date = order.importantDate ? new Date(order.importantDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "";
  const line2 = [order.importantDateLabel, date].filter(Boolean).join(" ");

  const parts: string[] = [];
  parts.push(`<text x="${cx}" y="10" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-style="italic" font-size="8">${esc(order.engravedName)}</text>`);
  if (line2) parts.push(`<text x="${cx}" y="15" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="2.6" letter-spacing="0.5">${esc(line2.toUpperCase())}</text>`);
  if (sound?.waveform?.length) {
    const peaks = sound.waveform;
    const ww = textW - 8;
    const x0 = 4;
    const cy = line2 ? 24.5 : 22;
    const maxH = 12;
    const step = ww / peaks.length;
    const bw = step * 0.55;
    for (let i = 0; i < peaks.length; i++) {
      const h = Math.max(0.6, peaks[i] * maxH);
      parts.push(`<rect x="${(x0 + i * step + (step - bw) / 2).toFixed(3)}" y="${(cy - h / 2).toFixed(3)}" width="${bw.toFixed(3)}" height="${h.toFixed(3)}" rx="${(bw / 2).toFixed(3)}"/>`);
    }
  }
  if (page?.qrToken) {
    const m = qrMatrix(scanUrl(page.qrToken));
    const cell = qrSize / m.length;
    const ox = W - qrSize - 2;
    const oy = (H - qrSize) / 2;
    const d: string[] = [];
    m.forEach((row, y) => row.forEach((on, x) => on && d.push(`M${(ox + x * cell).toFixed(3)} ${(oy + y * cell).toFixed(3)}h${cell.toFixed(3)}v${cell.toFixed(3)}h-${cell.toFixed(3)}z`)));
    parts.push(`<path d="${d.join("")}"/>`);
  }

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<!-- Pawsome Memories engraving · order ${esc(order.number)} · ${esc(order.petName)}
     Sound: ${sound ? esc(sound.caption ?? "recording") : "none provided"} · QR: ${page?.qrToken ? esc(scanUrl(page.qrToken)) : "none"}
     Scale freely; keep the QR at least 18 mm wide for reliable scanning. -->
<svg xmlns="http://www.w3.org/2000/svg" width="${W}mm" height="${H}mm" viewBox="0 0 ${W} ${H}" fill="#000">
${parts.join("\n")}
</svg>`;
  return new Response(svg, {
    headers: { "Content-Type": "image/svg+xml", "Content-Disposition": `attachment; filename="engraving-${order.number}.svg"`, "Cache-Control": "no-store" },
  });
}
