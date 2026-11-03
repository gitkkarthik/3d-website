import { and, count, eq, isNull } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { errorResponse, getDraftToken, guardOrigin, json } from "@/lib/api";
import { deleteStored, LIMITS, processAndStore, UploadError } from "@/lib/files";
import { clientIp, rateLimit } from "@/lib/security";
import type { UploadKind } from "@/lib/db/schema";

export const runtime = "nodejs";
export const maxDuration = 60;

const KINDS: UploadKind[] = ["PET_PHOTO", "PREVIEW", "MEMORY_IMAGE", "MEMORY_VIDEO", "MEMORY_AUDIO"];
const MEMORY_CAPS: Partial<Record<UploadKind, number>> = { MEMORY_IMAGE: 80, MEMORY_VIDEO: 12, MEMORY_AUDIO: 24 };
const isUuid = (s: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);

export async function POST(req: Request) {
  const bad = guardOrigin(req);
  if (bad) return bad;
  try {
    const len = Number(req.headers.get("content-length") ?? 0);
    if (len > LIMITS.video + 1024 * 1024) return json({ error: "That file is too large." }, 413);

    const form = await req.formData().catch(() => null);
    if (!form) return json({ error: "Upload failed. Please try again." }, 400);
    const kind = String(form.get("kind") ?? "") as UploadKind;
    const file = form.get("file");
    if (!KINDS.includes(kind)) return json({ error: "Unknown upload type." }, 400);
    if (!(file instanceof File)) return json({ error: "No file received." }, 400);

    const user = await getCurrentUser();
    const values: Partial<typeof schema.uploads.$inferInsert> = {};

    if (kind === "PET_PHOTO") {
      const draft = user ? null : await getDraftToken(true);
      const key = user ? `u:${user.id}` : `d:${draft}:${clientIp(req)}`;
      if (!rateLimit(`upload:${key}`, 60, 60 * 60 * 1000)) return json({ error: "Too many uploads. Please wait a little." }, 429);
      // Bound how many unattached photos a single visitor can park on our storage.
      const [{ n }] = await db
        .select({ n: count() })
        .from(schema.uploads)
        .where(and(eq(schema.uploads.kind, "PET_PHOTO"), isNull(schema.uploads.orderId), user ? eq(schema.uploads.ownerUserId, user.id) : eq(schema.uploads.draftToken, draft!)));
      if (Number(n) >= 40) return json({ error: "You've uploaded a lot of photos. Remove some you aren't using first." }, 429);
      if (user) values.ownerUserId = user.id;
      else values.draftToken = draft;
    } else if (kind === "PREVIEW") {
      if (user?.role !== "ADMIN") return json({ error: "Not allowed." }, 403);
      const orderId = String(form.get("orderId") ?? "");
      if (!isUuid(orderId)) return json({ error: "Order required." }, 400);
      values.ownerUserId = user.id;
    } else {
      if (!user) return json({ error: "Please sign in." }, 401);
      const memoryPageId = String(form.get("memoryPageId") ?? "");
      if (!isUuid(memoryPageId)) return json({ error: "Memory page required." }, 400);
      const [page] = await db.select().from(schema.memoryPages).where(eq(schema.memoryPages.id, memoryPageId));
      if (!page || (page.userId !== user.id && user.role !== "ADMIN")) return json({ error: "Memory page not found." }, 404);
      const [{ n }] = await db
        .select({ n: count() })
        .from(schema.uploads)
        .where(and(eq(schema.uploads.memoryPageId, page.id), eq(schema.uploads.kind, kind)));
      if (Number(n) >= (MEMORY_CAPS[kind] ?? 50)) return json({ error: "This memory page has reached its limit for that kind of file." }, 400);
      if (!rateLimit(`upload:u:${user.id}`, 120, 60 * 60 * 1000)) return json({ error: "Too many uploads. Please wait a little." }, 429);
      values.ownerUserId = page.userId;
      values.memoryPageId = page.id;
      values.sortOrder = Number(n);
    }

    const caption = String(form.get("caption") ?? "").trim().slice(0, 200) || null;
    const buf = Buffer.from(await file.arrayBuffer());
    const stored = await processAndStore(buf, kind);
    const [row] = await db
      .insert(schema.uploads)
      .values({ kind, ...values, ...stored, caption, originalName: file.name.slice(0, 200) } as typeof schema.uploads.$inferInsert)
      .returning({ id: schema.uploads.id, kind: schema.uploads.kind, mimeType: schema.uploads.mimeType, width: schema.uploads.width, height: schema.uploads.height, caption: schema.uploads.caption });
    return json({ upload: row });
  } catch (e) {
    if (e instanceof UploadError) return json({ error: e.message }, 415);
    return errorResponse(e);
  }
}

/** Remove a photo the customer no longer wants (only while it isn't attached to an order). */
export async function DELETE(req: Request) {
  const bad = guardOrigin(req);
  if (bad) return bad;
  try {
    const id = new URL(req.url).searchParams.get("id") ?? "";
    if (!isUuid(id)) return json({ error: "Not found." }, 404);
    const [u] = await db.select().from(schema.uploads).where(eq(schema.uploads.id, id));
    if (!u) return json({ error: "Not found." }, 404);
    const user = await getCurrentUser();
    const draft = await getDraftToken(false);
    const owns = (user && u.ownerUserId === user.id) || (draft && u.draftToken === draft) || user?.role === "ADMIN";
    if (!owns) return json({ error: "Not found." }, 404);
    if (u.orderId && u.kind === "PET_PHOTO") return json({ error: "Photos on a placed order can't be removed here. Contact us and we'll help." }, 400);
    if (u.kind === "PREVIEW" && u.orderId) {
      return json({ error: "Sent previews are kept as a record." }, 400);
    }
    await db.delete(schema.uploads).where(eq(schema.uploads.id, id));
    await deleteStored(u);
    if (u.memoryPageId) {
      await db.update(schema.memoryPages).set({ profileUploadId: null }).where(and(eq(schema.memoryPages.id, u.memoryPageId), eq(schema.memoryPages.profileUploadId, u.id)));
    }
    return json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}
