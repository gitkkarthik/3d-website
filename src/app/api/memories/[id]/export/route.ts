import JSZip from "jszip";
import { and, asc, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getMemoryMedia } from "@/lib/memories";
import { storage } from "@/lib/storage";

export const runtime = "nodejs";
export const maxDuration = 60;

const ext = (mime: string) =>
  ({ "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "audio/mpeg": "mp3", "audio/mp4": "m4a", "audio/ogg": "ogg", "audio/webm": "webm", "audio/wav": "wav", "video/mp4": "mp4", "video/quicktime": "mov", "video/webm": "webm" })[mime] ?? "bin";

/** "Download everything": every original file and the written story, in one zip. Owner only. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new Response("Not found", { status: 404 });
  const user = await getCurrentUser();
  if (!user) return new Response("Not found", { status: 404 });
  const [page] = await db.select().from(schema.memoryPages).where(eq(schema.memoryPages.id, id));
  if (!page || (page.userId !== user.id && user.role !== "ADMIN")) return new Response("Not found", { status: 404 });

  const media = await getMemoryMedia(page.id);
  const sounds = page.orderId
    ? await db.select().from(schema.uploads).where(and(eq(schema.uploads.orderId, page.orderId), eq(schema.uploads.kind, "PET_SOUND"))).orderBy(asc(schema.uploads.sortOrder))
    : [];
  const zip = new JSZip();
  const store = storage();
  const add = async (folder: string, u: typeof schema.uploads.$inferSelect, i: number) => {
    const buf = await store.get(u.storageKey);
    if (buf) zip.file(`${folder}/${String(i + 1).padStart(2, "0")}${u.caption ? `-${u.caption.replace(/[^\w\- ]+/g, "").slice(0, 40).trim()}` : ""}.${ext(u.mimeType)}`, buf);
  };
  let i = 0;
  for (const s of sounds) await add("sounds", s, i++);
  for (const m of media.filter((x) => x.kind === "MEMORY_AUDIO")) await add("sounds", m, i++);
  i = 0;
  for (const m of media.filter((x) => x.kind === "MEMORY_IMAGE")) await add("photos", m, i++);
  i = 0;
  for (const m of media.filter((x) => x.kind === "MEMORY_VIDEO")) await add("videos", m, i++);

  const lines = [
    page.petName,
    page.subtitle ?? "",
    "",
    page.message ? `"${page.message}"\n` : "",
    page.story ?? "",
    "",
    ...page.memories.map((m) => `## ${m.title}\n${m.body}\n`),
    ...page.specialDates.map((d) => `${d.label}: ${d.date}`),
    ...page.videoLinks.map((v) => `Video: ${v.url}`),
  ];
  zip.file("their-story.txt", lines.join("\n").replace(/\n{3,}/g, "\n\n"));
  const body = await zip.generateAsync({ type: "uint8array", compression: "STORE" });
  const safe = page.petName.replace(/[^\w\- ]+/g, "").trim() || "memories";
  return new Response(body as unknown as BodyInit, {
    headers: { "Content-Type": "application/zip", "Content-Disposition": `attachment; filename="${safe}-memories.zip"`, "Cache-Control": "no-store" },
  });
}
