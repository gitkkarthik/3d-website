import "server-only";
import { asc, eq } from "drizzle-orm";
import { db, schema } from "./db";
import { deleteStored } from "./files";

export type MemoryPage = typeof schema.memoryPages.$inferSelect;

export async function getMemoryMedia(pageId: string) {
  return db.select().from(schema.uploads).where(eq(schema.uploads.memoryPageId, pageId)).orderBy(asc(schema.uploads.sortOrder), asc(schema.uploads.createdAt));
}

/** Permanently delete a memory page and every file that belongs to it. */
export async function deleteMemoryPage(pageId: string) {
  const media = await getMemoryMedia(pageId);
  await db.transaction(async (tx) => {
    await tx.delete(schema.uploads).where(eq(schema.uploads.memoryPageId, pageId));
    await tx.delete(schema.memoryPages).where(eq(schema.memoryPages.id, pageId));
  });
  await Promise.all(media.map((m) => deleteStored(m).catch(() => {})));
  return media.length;
}

/** Only YouTube / Vimeo embeds (privacy-enhanced); everything else is shown as a plain link. */
export function videoEmbed(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.protocol !== "https:") return null;
    const host = u.hostname.replace(/^www\./, "");
    if (host === "youtu.be") return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(u.pathname.slice(1))}`;
    if (host === "youtube.com" || host === "m.youtube.com") {
      const v = u.searchParams.get("v") ?? (u.pathname.startsWith("/shorts/") ? u.pathname.split("/")[2] : null);
      return v ? `https://www.youtube-nocookie.com/embed/${encodeURIComponent(v)}` : null;
    }
    if (host === "vimeo.com") {
      const id = u.pathname.split("/").filter(Boolean)[0];
      return id && /^\d+$/.test(id) ? `https://player.vimeo.com/video/${id}?dnt=1` : null;
    }
    return null;
  } catch {
    return null;
  }
}
