import "server-only";
import { and, desc, eq, inArray, isNull, or, sql } from "drizzle-orm";
import { db, schema, type Tx } from "./db";
import type { OrderStatus } from "./db/schema";
import { canTransition, customerMessageFor } from "./lifecycle";
import { notifyCustomer } from "./notify";
import { getProducts, getSettings, shippingFor } from "./catalog";
import type { OrderInput } from "./validation";
import { randomToken } from "./security";

export class OrderError extends Error {}

export type Order = typeof schema.orders.$inferSelect;

function orderNumber() {
  // Short, readable, unguessable enough to quote on WhatsApp; not used for access control.
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const bytes = randomToken(12);
  let s = "";
  for (let i = 0; i < 6; i++) s += alphabet[bytes.charCodeAt(i) % alphabet.length];
  return `PM-${s}`;
}

/** Price is always computed on the server from the live catalogue. */
export async function quote(input: Pick<OrderInput["personalise"], "productSlug" | "variantId" | "poseOptionId" | "baseOptionId">) {
  const products = await getProducts();
  const product = products.find((p) => p.slug === input.productSlug);
  if (!product) throw new OrderError("That edition isn't available right now.");
  const variant = product.variants.find((v) => v.id === input.variantId);
  if (!variant) throw new OrderError("Please choose a size for your keepsake.");
  const pose = input.poseOptionId ? product.poses.find((o) => o.id === input.poseOptionId) : undefined;
  const base = input.baseOptionId ? product.bases.find((o) => o.id === input.baseOptionId) : undefined;
  if (input.poseOptionId && !pose) throw new OrderError("That pose isn't available for this edition.");
  if (input.baseOptionId && !base) throw new OrderError("That base isn't available for this edition.");
  const optionsPricePaise = (pose?.priceDeltaPaise ?? 0) + (base?.priceDeltaPaise ?? 0);
  const subtotal = variant.pricePaise + optionsPricePaise;
  const shippingPaise = shippingFor(subtotal, await getSettings());
  return {
    product,
    variant,
    pose,
    base,
    unitPricePaise: variant.pricePaise,
    optionsPricePaise,
    shippingPaise,
    totalPaise: subtotal + shippingPaise,
  };
}

/**
 * Creates an order exactly once per idempotency key. Photos must belong to this
 * customer (or to their anonymous wizard draft) and not already be attached to an order.
 */
export async function createOrder(userId: string, draftToken: string | null, input: OrderInput): Promise<{ order: Order; duplicate: boolean }> {
  const existing = await db
    .select()
    .from(schema.orders)
    .where(and(eq(schema.orders.userId, userId), eq(schema.orders.idempotencyKey, input.idempotencyKey)));
  if (existing[0]) return { order: existing[0], duplicate: true };

  const q = await quote(input.personalise);
  const ownerPhotoIds = q.product.includesOwner ? input.personalise.ownerPhotoIds : [];
  if (q.product.includesOwner && ownerPhotoIds.length === 0) {
    throw new OrderError("Please add at least one photo of you for the Together Edition.");
  }
  const allPhotoIds = [...input.pet.photoIds, ...ownerPhotoIds];
  if (new Set(allPhotoIds).size !== allPhotoIds.length) throw new OrderError("The same photo was added twice.");

  return db.transaction(async (tx) => {
    const ownership = draftToken
      ? or(eq(schema.uploads.ownerUserId, userId), eq(schema.uploads.draftToken, draftToken))
      : eq(schema.uploads.ownerUserId, userId);
    const photos = await tx
      .select({ id: schema.uploads.id })
      .from(schema.uploads)
      .where(and(inArray(schema.uploads.id, allPhotoIds), eq(schema.uploads.kind, "PET_PHOTO"), isNull(schema.uploads.orderId), ownership))
      .for("update");
    if (photos.length !== allPhotoIds.length) {
      // A concurrent submit with the same key may have just claimed these photos.
      const dup = await tx
        .select()
        .from(schema.orders)
        .where(and(eq(schema.orders.userId, userId), eq(schema.orders.idempotencyKey, input.idempotencyKey)));
      if (dup[0]) return { order: dup[0], duplicate: true };
      throw new OrderError("Some photos couldn't be found. Please re-upload them and try again.");
    }
    const soundIds = input.pet.soundIds ?? [];
    if (soundIds.length) {
      const sounds = await tx
        .select({ id: schema.uploads.id })
        .from(schema.uploads)
        .where(and(inArray(schema.uploads.id, soundIds), eq(schema.uploads.kind, "PET_SOUND"), isNull(schema.uploads.orderId), ownership))
        .for("update");
      if (sounds.length !== new Set(soundIds).size) throw new OrderError("A recording couldn't be found. Please add it again.");
    }

    let inserted: Order | undefined;
    for (let attempt = 0; attempt < 3 && !inserted; attempt++) {
      const rows = await tx
        .insert(schema.orders)
        .values({
          number: orderNumber(),
          userId,
          idempotencyKey: input.idempotencyKey,
          productId: q.product.id,
          variantId: q.variant.id,
          poseOptionId: q.pose?.id ?? null,
          baseOptionId: q.base?.id ?? null,
          snapshot: {
            productName: q.product.name,
            productSlug: q.product.slug,
            variantName: q.variant.name,
            poseLabel: q.pose?.label ?? null,
            baseLabel: q.base?.label ?? null,
          },
          petName: input.pet.petName,
          animalType: input.pet.animalType,
          breed: input.pet.breed,
          petAge: input.pet.petAge ?? null,
          story: input.story,
          poseNotes: input.personalise.poseNotes ?? null,
          engravedName: input.personalise.engravedName,
          message: input.personalise.message ?? null,
          importantDate: input.personalise.importantDate ?? null,
          importantDateLabel: input.personalise.importantDateLabel ?? null,
          ownerNotes: q.product.includesOwner ? (input.personalise.ownerNotes ?? null) : null,
          specialInstructions: input.personalise.specialInstructions ?? null,
          wantsMemoryPage: q.product.includesMemoryPage && input.personalise.wantsMemoryPage,
          unitPricePaise: q.unitPricePaise,
          optionsPricePaise: q.optionsPricePaise,
          shippingPaise: q.shippingPaise,
          totalPaise: q.totalPaise,
          ...input.delivery,
          shipLine2: input.delivery.shipLine2 ?? null,
          giftNote: input.delivery.isGift ? (input.delivery.giftNote ?? null) : null,
        })
        .onConflictDoNothing()
        .returning();
      inserted = rows[0];
      if (!inserted) {
        // Either the order number collided (retry) or a concurrent duplicate submit won the race.
        const dup = await tx
          .select()
          .from(schema.orders)
          .where(and(eq(schema.orders.userId, userId), eq(schema.orders.idempotencyKey, input.idempotencyKey)));
        if (dup[0]) return { order: dup[0], duplicate: true };
      }
    }
    if (!inserted) throw new OrderError("We couldn't create your order. Please try again.");

    for (const [i, id] of allPhotoIds.entries()) {
      const isOwner = i >= input.pet.photoIds.length;
      await tx
        .update(schema.uploads)
        .set({ orderId: inserted.id, ownerUserId: userId, draftToken: null, sortOrder: i, caption: isOwner ? "owner" : null })
        .where(eq(schema.uploads.id, id));
    }
    for (const [i, id] of soundIds.entries()) {
      await tx.update(schema.uploads).set({ orderId: inserted.id, ownerUserId: userId, draftToken: null, sortOrder: i }).where(eq(schema.uploads.id, id));
    }
    if (inserted.wantsMemoryPage) {
      await tx.insert(schema.memoryPages).values({
        slug: randomToken(16),
        qrToken: randomToken(12),
        userId,
        orderId: inserted.id,
        petName: inserted.petName,
        isMemorial: q.product.isMemorial,
        profileUploadId: input.pet.photoIds[0],
        story: [input.story.personality, input.story.smile].filter(Boolean).join("\n\n") || null,
        memories: input.story.freezeMoment ? [{ title: "The moment we'd freeze forever", body: input.story.freezeMoment }] : [],
        specialDates: inserted.importantDate ? [{ label: inserted.importantDateLabel || "A day to remember", date: inserted.importantDate }] : [],
        message: inserted.message,
      });
    }
    await tx.insert(schema.orderEvents).values({
      orderId: inserted.id,
      type: "STATUS_CHANGE",
      toStatus: "ORDER_RECEIVED",
      message: "Order placed",
      visibleToCustomer: true,
      actorUserId: userId,
    });
    return { order: inserted, duplicate: false };
  });
}

async function lockOrder(tx: Tx, orderId: string) {
  const [o] = await tx.select().from(schema.orders).where(eq(schema.orders.id, orderId)).for("update");
  if (!o) throw new OrderError("Order not found.");
  return o;
}

async function afterStatusChange(o: Order, to: OrderStatus) {
  const msg = customerMessageFor(to, o.petName);
  if (msg) await notifyCustomer(o.userId, o.id, msg.title, msg.body, `/account/orders/${o.id}`);
}

/** Generic admin status move, guarded by the lifecycle rules. */
export async function transitionOrder(orderId: string, to: OrderStatus, actorUserId: string, note?: string) {
  const updated = await db.transaction(async (tx) => {
    const o = await lockOrder(tx, orderId);
    const check = canTransition(o, to, "manual");
    if (!check.ok) throw new OrderError(check.reason);
    const now = new Date();
    const [u] = await tx
      .update(schema.orders)
      .set({
        status: to,
        updatedAt: now,
        ...(to === "SHIPPED" ? { shippedAt: now } : {}),
        ...(to === "DELIVERED" ? { deliveredAt: now } : {}),
        ...(to === "CANCELLED" ? { cancelledAt: now, cancelReason: note ?? null } : {}),
      })
      .where(eq(schema.orders.id, orderId))
      .returning();
    await tx.insert(schema.orderEvents).values({
      orderId,
      type: "STATUS_CHANGE",
      fromStatus: o.status,
      toStatus: to,
      message: note ?? null,
      visibleToCustomer: true,
      actorUserId,
    });
    return u;
  });
  await afterStatusChange(updated, to);
  return updated;
}

export async function cancelOrder(orderId: string, actorUserId: string, reason: string) {
  const updated = await db.transaction(async (tx) => {
    const o = await lockOrder(tx, orderId);
    const check = canTransition(o, "CANCELLED");
    if (!check.ok) throw new OrderError(check.reason);
    const [u] = await tx
      .update(schema.orders)
      .set({ status: "CANCELLED", cancelledAt: new Date(), cancelReason: reason, updatedAt: new Date() })
      .where(eq(schema.orders.id, orderId))
      .returning();
    await tx.insert(schema.orderEvents).values({ orderId, type: "STATUS_CHANGE", fromStatus: o.status, toStatus: "CANCELLED", message: reason, visibleToCustomer: true, actorUserId });
    return u;
  });
  await afterStatusChange(updated, "CANCELLED");
  return updated;
}

/** Admin uploads a new preview version → PREVIEW_SENT, customer notified. */
export async function sendPreview(orderId: string, uploadIds: string[], artistNote: string | null, actorUserId: string) {
  if (!uploadIds.length) throw new OrderError("Add at least one preview image.");
  const updated = await db.transaction(async (tx) => {
    const o = await lockOrder(tx, orderId);
    const check = canTransition(o, "PREVIEW_SENT", "preview");
    if (!check.ok) throw new OrderError(check.reason);
    // Any older pending preview is superseded.
    await tx
      .update(schema.designPreviews)
      .set({ decision: "CHANGES_REQUESTED", decidedAt: new Date(), decidedVia: "SUPERSEDED", customerFeedback: sql`coalesce(${schema.designPreviews.customerFeedback}, 'Superseded by a newer preview')` })
      .where(and(eq(schema.designPreviews.orderId, orderId), eq(schema.designPreviews.decision, "PENDING")));
    const [{ max }] = await tx
      .select({ max: sql<number>`coalesce(max(${schema.designPreviews.version}), 0)` })
      .from(schema.designPreviews)
      .where(eq(schema.designPreviews.orderId, orderId));
    const version = Number(max) + 1;
    await tx.insert(schema.designPreviews).values({ orderId, version, uploadIds, artistNote });
    await tx.update(schema.uploads).set({ orderId }).where(and(inArray(schema.uploads.id, uploadIds), eq(schema.uploads.kind, "PREVIEW")));
    const [u] = await tx.update(schema.orders).set({ status: "PREVIEW_SENT", updatedAt: new Date() }).where(eq(schema.orders.id, orderId)).returning();
    await tx.insert(schema.orderEvents).values({
      orderId,
      type: "PREVIEW",
      fromStatus: o.status,
      toStatus: "PREVIEW_SENT",
      message: `Design preview v${version} sent${artistNote ? `: ${artistNote}` : ""}`,
      visibleToCustomer: true,
      actorUserId,
    });
    return u;
  });
  await afterStatusChange(updated, "PREVIEW_SENT");
  return updated;
}

/** Customer opened their preview: PREVIEW_SENT → CUSTOMER_APPROVAL_PENDING. */
export async function markPreviewViewed(orderId: string, userId: string) {
  await db.transaction(async (tx) => {
    const o = await lockOrder(tx, orderId);
    if (o.userId !== userId || o.status !== "PREVIEW_SENT") return;
    await tx.update(schema.orders).set({ status: "CUSTOMER_APPROVAL_PENDING", updatedAt: new Date() }).where(eq(schema.orders.id, orderId));
    await tx.insert(schema.orderEvents).values({ orderId, type: "STATUS_CHANGE", fromStatus: o.status, toStatus: "CUSTOMER_APPROVAL_PENDING", message: "Customer viewed the preview", visibleToCustomer: false, actorUserId: userId });
  });
}

/**
 * Approve or request changes on the latest pending preview.
 * via=CUSTOMER: the customer clicked approve. via=ADMIN_RECORDED: the studio records an
 * approval given elsewhere (e.g. WhatsApp) — logged with the admin's id and a note.
 */
export async function decidePreview(opts: {
  orderId: string;
  previewId: string;
  decision: "APPROVED" | "CHANGES_REQUESTED";
  feedback?: string | null;
  actorUserId: string;
  via: "CUSTOMER" | "ADMIN_RECORDED";
}) {
  const { orderId, previewId, decision, actorUserId, via } = opts;
  const feedback = opts.feedback?.trim() || null;
  if (decision === "CHANGES_REQUESTED" && !feedback) throw new OrderError("Tell us what you'd like changed.");
  const to: OrderStatus = decision === "APPROVED" ? "APPROVED_FOR_PRODUCTION" : "DESIGN_IN_PROGRESS";

  const updated = await db.transaction(async (tx) => {
    const o = await lockOrder(tx, orderId);
    if (via === "CUSTOMER" && o.userId !== actorUserId) throw new OrderError("Order not found.");
    const [p] = await tx
      .select()
      .from(schema.designPreviews)
      .where(and(eq(schema.designPreviews.id, previewId), eq(schema.designPreviews.orderId, orderId)))
      .for("update");
    if (!p) throw new OrderError("Preview not found.");
    if (p.decision !== "PENDING") throw new OrderError("This preview has already been answered.");
    const now = new Date();
    const ctx = decision === "APPROVED" ? { ...o, approvedPreviewId: p.id, approvedAt: now } : o;
    const check = canTransition(ctx, to, decision === "APPROVED" ? "approval" : "changes");
    if (!check.ok) throw new OrderError(check.reason);

    await tx
      .update(schema.designPreviews)
      .set({ decision, customerFeedback: feedback, decidedAt: now, decidedVia: via, decidedBy: actorUserId })
      .where(eq(schema.designPreviews.id, p.id));
    const [u] = await tx
      .update(schema.orders)
      .set({
        status: to,
        updatedAt: now,
        ...(decision === "APPROVED" ? { approvedAt: now, approvedPreviewId: p.id } : {}),
      })
      .where(eq(schema.orders.id, orderId))
      .returning();
    await tx.insert(schema.orderEvents).values({
      orderId,
      type: decision === "APPROVED" ? "APPROVAL" : "CHANGES",
      fromStatus: o.status,
      toStatus: to,
      message:
        decision === "APPROVED"
          ? `Preview v${p.version} approved${via === "ADMIN_RECORDED" ? " (recorded by studio)" : ""}${feedback ? `: ${feedback}` : ""}`
          : `Changes requested on v${p.version}: ${feedback}`,
      visibleToCustomer: true,
      actorUserId,
    });
    return u;
  });
  if (decision === "APPROVED") await afterStatusChange(updated, to);
  else if (via === "ADMIN_RECORDED")
    await notifyCustomer(updated.userId, orderId, "We've noted your changes", "Our artist is working on a new version of the design.", `/account/orders/${orderId}`);
  return updated;
}

/** Mark an order paid. Idempotent. Used by Razorpay verify/webhook and manual recording. */
export async function markOrderPaid(tx: Tx, orderId: string, actorUserId: string | null, message: string) {
  const o = await lockOrder(tx, orderId);
  if (o.paymentStatus === "PAID") return o;
  const [u] = await tx.update(schema.orders).set({ paymentStatus: "PAID", updatedAt: new Date() }).where(eq(schema.orders.id, orderId)).returning();
  await tx.insert(schema.orderEvents).values({ orderId, type: "PAYMENT", message, visibleToCustomer: true, actorUserId });
  return u;
}

export async function recordManualPayment(orderId: string, amountPaise: number, method: string, reference: string | null, actorUserId: string) {
  const o = await db.transaction(async (tx) => {
    const o = await lockOrder(tx, orderId);
    if (o.status === "CANCELLED") throw new OrderError("This order is cancelled.");
    if (o.paymentStatus === "PAID") throw new OrderError("This order is already marked as paid.");
    if (amountPaise !== o.totalPaise) throw new OrderError("The amount must match the order total. Use a note for partial payments.");
    await tx.insert(schema.payments).values({ orderId, provider: "MANUAL", status: "CAPTURED", amountPaise, method, reference, recordedBy: actorUserId });
    return markOrderPaid(tx, orderId, actorUserId, `Payment received (${method}${reference ? `, ref ${reference}` : ""})`);
  });
  await notifyCustomer(o.userId, o.id, "Payment received", `Thank you, we've received your payment for ${o.petName}'s keepsake.`, `/account/orders/${o.id}`);
}

export async function addOrderNote(orderId: string, message: string, actorUserId: string, visibleToCustomer = false) {
  await db.insert(schema.orderEvents).values({ orderId, type: "NOTE", message, visibleToCustomer, actorUserId });
}

export async function getOrderForUser(orderId: string, userId: string) {
  const [o] = await db.select().from(schema.orders).where(and(eq(schema.orders.id, orderId), eq(schema.orders.userId, userId)));
  return o ?? null;
}

export async function getOrderDetail(orderId: string) {
  const [order] = await db.select().from(schema.orders).where(eq(schema.orders.id, orderId));
  if (!order) return null;
  const [photos, previews, events, paymentRows, memory] = await Promise.all([
    db.select().from(schema.uploads).where(and(eq(schema.uploads.orderId, orderId), eq(schema.uploads.kind, "PET_PHOTO"))).orderBy(schema.uploads.sortOrder),
    db.select().from(schema.designPreviews).where(eq(schema.designPreviews.orderId, orderId)).orderBy(desc(schema.designPreviews.version)),
    db.select().from(schema.orderEvents).where(eq(schema.orderEvents.orderId, orderId)).orderBy(desc(schema.orderEvents.createdAt)),
    db.select().from(schema.payments).where(eq(schema.payments.orderId, orderId)).orderBy(desc(schema.payments.createdAt)),
    db.select({ id: schema.memoryPages.id, slug: schema.memoryPages.slug }).from(schema.memoryPages).where(eq(schema.memoryPages.orderId, orderId)),
  ]);
  return { order, photos, previews, events, payments: paymentRows, memory: memory[0] ?? null };
}
