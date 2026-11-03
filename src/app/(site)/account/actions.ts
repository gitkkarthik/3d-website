"use server";

import { revalidatePath } from "next/cache";
import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/lib/db";
import { AuthError, destroySession, requireUser } from "@/lib/auth";
import { decidePreview, getOrderForUser, markPreviewViewed, OrderError } from "@/lib/orders";

export type ActionResult = { ok: true; message?: string } | { ok: false; error: string };

async function wrap(fn: () => Promise<ActionResult | void>): Promise<ActionResult> {
  try {
    return (await fn()) ?? { ok: true };
  } catch (e) {
    if (e instanceof OrderError || e instanceof AuthError) return { ok: false, error: e.message };
    console.error(e);
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}

export async function approvePreviewAction(orderId: string, previewId: string, note: string): Promise<ActionResult> {
  return wrap(async () => {
    const user = await requireUser();
    await decidePreview({ orderId, previewId, decision: "APPROVED", feedback: note.slice(0, 1000), actorUserId: user.id, via: "CUSTOMER" });
    revalidatePath(`/account/orders/${orderId}`);
    return { ok: true, message: "Approved. Thank you! We'll start making it." };
  });
}

export async function requestChangesAction(orderId: string, previewId: string, feedback: string): Promise<ActionResult> {
  return wrap(async () => {
    const user = await requireUser();
    await decidePreview({ orderId, previewId, decision: "CHANGES_REQUESTED", feedback: feedback.slice(0, 2000), actorUserId: user.id, via: "CUSTOMER" });
    revalidatePath(`/account/orders/${orderId}`);
    return { ok: true, message: "Thank you. Our artist will work on a new version." };
  });
}

export async function markNotificationsReadAction(): Promise<void> {
  const user = await requireUser();
  await db
    .update(schema.notifications)
    .set({ readAt: new Date() })
    .where(and(eq(schema.notifications.userId, user.id), isNull(schema.notifications.readAt)));
  revalidatePath("/account");
}

const reviewSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().trim().max(80).optional(),
  body: z.string().trim().min(10, "A sentence or two, please.").max(1500),
  displayName: z.string().trim().min(1).max(40),
  city: z.string().trim().max(40).optional(),
});

/** Reviews can only be written for the customer's own delivered order. One per order. */
export async function submitReviewAction(orderId: string, input: unknown): Promise<ActionResult> {
  return wrap(async () => {
    const user = await requireUser();
    const order = await getOrderForUser(orderId, user.id);
    if (!order) return { ok: false, error: "Order not found." };
    if (order.status !== "DELIVERED") return { ok: false, error: "You can review your keepsake once it's delivered." };
    const parsed = reviewSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
    const inserted = await db
      .insert(schema.reviews)
      .values({ orderId, userId: user.id, productId: order.productId, petName: order.petName, ...parsed.data, title: parsed.data.title || null, city: parsed.data.city || null })
      .onConflictDoNothing()
      .returning({ id: schema.reviews.id });
    if (!inserted.length) return { ok: false, error: "You've already reviewed this order. Thank you!" };
    revalidatePath(`/account/orders/${orderId}`);
    return { ok: true, message: "Thank you. Your review will appear once our studio has checked it." };
  });
}

export async function signOutAction(): Promise<void> {
  await destroySession();
}

export async function markPreviewViewedAction(orderId: string): Promise<void> {
  const user = await requireUser();
  await markPreviewViewed(orderId, user.id);
}
