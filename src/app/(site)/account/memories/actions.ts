"use server";

import { revalidatePath } from "next/cache";
import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { deleteMemoryPage } from "@/lib/memories";
import { randomToken } from "@/lib/security";
import type { ActionResult } from "../actions";

async function ownedPage(pageId: string) {
  const user = await requireUser();
  const [page] = await db.select().from(schema.memoryPages).where(eq(schema.memoryPages.id, pageId));
  if (!page || (page.userId !== user.id && user.role !== "ADMIN")) throw new Error("not-found");
  return page;
}

const contentSchema = z.object({
  petName: z.string().trim().min(1, "Their name, please.").max(40),
  subtitle: z.string().trim().max(120).optional().default(""),
  story: z.string().trim().max(6000).optional().default(""),
  message: z.string().trim().max(1500).optional().default(""),
  memories: z.array(z.object({ title: z.string().trim().max(120), body: z.string().trim().max(2000) })).max(30),
  specialDates: z.array(z.object({ label: z.string().trim().max(60), date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use a full date.") })).max(20),
  videoLinks: z
    .array(z.object({ url: z.url().refine((u) => u.startsWith("https://"), "Links must start with https://"), title: z.string().trim().max(120).optional() }))
    .max(20),
  profileUploadId: z.uuid().nullable().optional(),
  captions: z.record(z.string(), z.string().max(200)).optional(),
});

export async function saveMemoryPageAction(pageId: string, input: unknown): Promise<ActionResult> {
  try {
    const page = await ownedPage(pageId);
    const parsed = contentSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
    const d = parsed.data;
    const media = await db.select({ id: schema.uploads.id }).from(schema.uploads).where(eq(schema.uploads.memoryPageId, page.id));
    const mediaIds = new Set(media.map((m) => m.id));
    // A profile photo must be one of this page's images, or the page's existing order photo.
    let profileUploadId = page.profileUploadId;
    if (d.profileUploadId !== undefined) {
      if (d.profileUploadId === null || mediaIds.has(d.profileUploadId) || d.profileUploadId === page.profileUploadId) profileUploadId = d.profileUploadId;
    }
    await db
      .update(schema.memoryPages)
      .set({
        petName: d.petName,
        subtitle: d.subtitle || null,
        story: d.story || null,
        message: d.message || null,
        memories: d.memories.filter((m) => m.title || m.body),
        specialDates: d.specialDates.filter((x) => x.label || x.date),
        videoLinks: d.videoLinks,
        profileUploadId,
        updatedAt: new Date(),
      })
      .where(eq(schema.memoryPages.id, page.id));
    if (d.captions) {
      for (const [id, caption] of Object.entries(d.captions)) {
        if (!mediaIds.has(id)) continue;
        await db.update(schema.uploads).set({ caption: caption || null }).where(and(eq(schema.uploads.id, id), inArray(schema.uploads.id, [...mediaIds])));
      }
    }
    revalidatePath(`/m/${page.slug}`);
    return { ok: true, message: "Saved." };
  } catch {
    return { ok: false, error: "Couldn't save. Please try again." };
  }
}

export async function setVisibilityAction(pageId: string, visibility: "PRIVATE" | "LINK"): Promise<ActionResult> {
  try {
    const page = await ownedPage(pageId);
    if (visibility !== "PRIVATE" && visibility !== "LINK") return { ok: false, error: "Invalid choice." };
    await db.update(schema.memoryPages).set({ visibility, updatedAt: new Date() }).where(eq(schema.memoryPages.id, page.id));
    revalidatePath(`/account/memories/${page.id}`);
    return { ok: true, message: visibility === "LINK" ? "Anyone with the link can now view this page." : "This page is now private." };
  } catch {
    return { ok: false, error: "Couldn't update. Please try again." };
  }
}

/** Issue a fresh secret link; the old one stops working immediately. */
export async function resetLinkAction(pageId: string): Promise<ActionResult> {
  try {
    const page = await ownedPage(pageId);
    await db.update(schema.memoryPages).set({ slug: randomToken(16), updatedAt: new Date() }).where(eq(schema.memoryPages.id, page.id));
    revalidatePath(`/account/memories/${page.id}`);
    return { ok: true, message: "New link created. The old link no longer works." };
  } catch {
    return { ok: false, error: "Couldn't reset the link." };
  }
}

export async function deleteMemoryPageAction(pageId: string, confirmName: string): Promise<ActionResult> {
  try {
    const page = await ownedPage(pageId);
    if (confirmName.trim().toLowerCase() !== page.petName.trim().toLowerCase()) {
      return { ok: false, error: `Type ${page.petName} to confirm.` };
    }
    await deleteMemoryPage(page.id);
    revalidatePath("/account");
    return { ok: true, message: "Deleted." };
  } catch {
    return { ok: false, error: "Couldn't delete. Please try again." };
  }
}

/** Pause or resume what happens when someone scans the keepsake. The code itself never changes. */
export async function setQrEnabledAction(pageId: string, enabled: boolean): Promise<ActionResult> {
  try {
    const page = await ownedPage(pageId);
    await db.update(schema.memoryPages).set({ qrEnabled: !!enabled, updatedAt: new Date() }).where(eq(schema.memoryPages.id, page.id));
    return { ok: true, message: enabled ? "Scanning is on." : "Scanning is paused. The keepsake shows a gentle 'resting' message." };
  } catch {
    return { ok: false, error: "Couldn't update. Please try again." };
  }
}
