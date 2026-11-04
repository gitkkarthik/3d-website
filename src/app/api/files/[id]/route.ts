import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getDraftToken } from "@/lib/api";
import { storage } from "@/lib/storage";
import { safeEqual } from "@/lib/security";

export const runtime = "nodejs";

const notFound = () => new Response("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });

/**
 * The only way to read a stored file. Every request is authorised:
 * studio admins, the file's owner, the owner of the order it belongs to,
 * the anonymous wizard draft that uploaded it, or — for shared memory pages —
 * someone holding that page's secret link.
 */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return notFound();
  const url = new URL(req.url);
  const variant = url.searchParams.get("v") ?? "display";
  const memorySlug = url.searchParams.get("m");
  const qrToken = memorySlug ? null : url.searchParams.get("q");

  const [u] = await db.select().from(schema.uploads).where(eq(schema.uploads.id, id));
  if (!u) return notFound();

  let allowed = false;
  let shared = false;
  const user = await getCurrentUser();
  if (user?.role === "ADMIN") allowed = true;
  else if (user && u.ownerUserId === user.id) allowed = true;
  if (!allowed && user && u.orderId) {
    const [o] = await db.select({ userId: schema.orders.userId }).from(schema.orders).where(eq(schema.orders.id, u.orderId));
    allowed = o?.userId === user.id;
  }
  if (!allowed && u.draftToken) {
    const draft = await getDraftToken(false);
    allowed = !!draft && safeEqual(draft, u.draftToken);
  }
  // Shared viewers: a memory page's private link (?m=slug, when link sharing is on) or the
  // QR engraved on the keepsake (?q=token, while scanning is on). Either only unlocks files
  // that belong to that page: its media, its profile photo, and the order's recorded sounds.
  if (!allowed && (memorySlug || qrToken)) {
    const [page] = await db
      .select()
      .from(schema.memoryPages)
      .where(memorySlug ? eq(schema.memoryPages.slug, memorySlug) : eq(schema.memoryPages.qrToken, qrToken!));
    const pageOpen =
      !!page &&
      (memorySlug
        ? page.visibility === "LINK" && safeEqual(page.slug, memorySlug)
        : page.qrEnabled && !!page.qrToken && safeEqual(page.qrToken, qrToken!));
    const belongs =
      !!page && (u.memoryPageId === page.id || page.profileUploadId === u.id || (u.kind === "PET_SOUND" && !!u.orderId && u.orderId === page.orderId));
    if (pageOpen && belongs) {
      allowed = true;
      shared = true;
    }
  }
  if (!allowed) return notFound();

  // Shared viewers never receive the untouched original image (which may carry metadata).
  let key = u.storageKey;
  let type = u.mimeType;
  if (u.displayKey) {
    if (variant === "thumb" && u.thumbKey) [key, type] = [u.thumbKey, "image/webp"];
    else if (variant === "original" && !shared) [key, type] = [u.storageKey, u.mimeType];
    else [key, type] = [u.displayKey, "image/webp"];
  }

  const body = await storage().get(key);
  if (!body) return notFound();

  const headers: Record<string, string> = {
    "Content-Type": type,
    "Cache-Control": "private, max-age=3600",
    "X-Content-Type-Options": "nosniff",
    "X-Robots-Tag": "noindex, nofollow",
    "Accept-Ranges": "bytes",
    "Content-Disposition": variant === "original" ? `attachment; filename="${(u.originalName ?? "file").replace(/[^\w.\- ]/g, "_")}"` : "inline",
  };

  const range = req.headers.get("range");
  if (range && (type.startsWith("video/") || type.startsWith("audio/"))) {
    const m = /bytes=(\d*)-(\d*)/.exec(range);
    if (m) {
      const size = body.length;
      const start = m[1] ? Number(m[1]) : Math.max(0, size - Number(m[2]));
      const end = m[1] && m[2] ? Math.min(Number(m[2]), size - 1) : size - 1;
      if (start >= size || start > end) return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });
      return new Response(new Uint8Array(body.subarray(start, end + 1)), {
        status: 206,
        headers: { ...headers, "Content-Range": `bytes ${start}-${end}/${size}`, "Content-Length": String(end - start + 1) },
      });
    }
  }
  return new Response(new Uint8Array(body), { headers: { ...headers, "Content-Length": String(body.length) } });
}
