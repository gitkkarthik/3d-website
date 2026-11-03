"use server";

/**
 * Every admin mutation lives here and starts with requireAdmin().
 * Hiding buttons in the UI is never relied on for security.
 */
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/lib/db";
import { AuthError, requireAdmin } from "@/lib/auth";
import { addOrderNote, cancelOrder, decidePreview, OrderError, recordManualPayment, sendPreview, transitionOrder } from "@/lib/orders";
import { ORDER_STATUSES, type OrderStatus } from "@/lib/db/schema";
import { rupeesToPaise } from "@/lib/money";
import { setSetting } from "@/lib/catalog";
import { deleteMemoryPage } from "@/lib/memories";
import { notifyCustomer } from "@/lib/notify";

export type AdminResult = { ok: true; message?: string } | { ok: false; error: string };

async function run(fn: () => Promise<AdminResult | void>, paths: string[] = []): Promise<AdminResult> {
  try {
    await requireAdmin();
    const r = (await fn()) ?? { ok: true };
    for (const p of paths) (p === "*" ? revalidatePath("/", "layout") : revalidatePath(p));
    return r;
  } catch (e) {
    if (e instanceof AuthError || e instanceof OrderError) return { ok: false, error: e.message };
    if (e instanceof z.ZodError) return { ok: false, error: e.issues[0].message };
    if (e instanceof Error && e.message === "Invalid amount") return { ok: false, error: "Enter a valid amount in rupees." };
    console.error(e);
    return { ok: false, error: "Something went wrong." };
  }
}

const uuid = z.uuid();
const orderPaths = (id: string) => [`/admin/orders/${id}`, "/admin/orders", "/admin", `/account/orders/${id}`];

export async function transitionAction(orderId: string, to: string, note: string): Promise<AdminResult> {
  return run(async () => {
    const admin = await requireAdmin();
    uuid.parse(orderId);
    if (!ORDER_STATUSES.includes(to as OrderStatus)) return { ok: false, error: "Unknown status." };
    await transitionOrder(orderId, to as OrderStatus, admin.id, note.trim() || undefined);
    return { ok: true, message: "Status updated and customer notified." };
  }, orderPaths(orderId));
}

export async function cancelAction(orderId: string, reason: string): Promise<AdminResult> {
  return run(async () => {
    const admin = await requireAdmin();
    if (reason.trim().length < 3) return { ok: false, error: "Add a reason (the customer will see it)." };
    await cancelOrder(uuid.parse(orderId), admin.id, reason.trim());
    return { ok: true, message: "Order cancelled." };
  }, orderPaths(orderId));
}

export async function sendPreviewAction(orderId: string, uploadIds: string[], note: string): Promise<AdminResult> {
  return run(async () => {
    const admin = await requireAdmin();
    const ids = z.array(uuid).min(1, "Upload at least one preview image.").max(8).parse(uploadIds);
    await sendPreview(uuid.parse(orderId), ids, note.trim() || null, admin.id);
    return { ok: true, message: "Preview sent. The customer has been notified." };
  }, orderPaths(orderId));
}

export async function recordDecisionAction(orderId: string, previewId: string, decision: "APPROVED" | "CHANGES_REQUESTED", note: string): Promise<AdminResult> {
  return run(async () => {
    const admin = await requireAdmin();
    if (note.trim().length < 3) return { ok: false, error: "Note how the customer responded (e.g. 'Approved on WhatsApp, 3 Nov')." };
    await decidePreview({ orderId: uuid.parse(orderId), previewId: uuid.parse(previewId), decision, feedback: note.trim(), actorUserId: admin.id, via: "ADMIN_RECORDED" });
    return { ok: true, message: decision === "APPROVED" ? "Approval recorded." : "Change request recorded." };
  }, orderPaths(orderId));
}

export async function addNoteAction(orderId: string, message: string, visibleToCustomer: boolean): Promise<AdminResult> {
  return run(async () => {
    const admin = await requireAdmin();
    const msg = z.string().trim().min(1, "Write a note.").max(2000).parse(message);
    await addOrderNote(uuid.parse(orderId), msg, admin.id, visibleToCustomer);
    if (visibleToCustomer) {
      const [o] = await db.select().from(schema.orders).where(eq(schema.orders.id, orderId));
      if (o) await notifyCustomer(o.userId, o.id, `A note about ${o.petName}'s keepsake`, msg, `/account/orders/${o.id}`);
    }
    return { ok: true, message: visibleToCustomer ? "Message sent to customer." : "Internal note added." };
  }, orderPaths(orderId));
}

const shippingSchema = z.object({
  courier: z.string().trim().min(2, "Courier name?").max(60),
  trackingNumber: z.string().trim().min(3, "Tracking number?").max(80),
  trackingUrl: z.union([z.url().refine((u) => u.startsWith("https://"), "Tracking link must be https"), z.literal("")]),
});

export async function saveShippingAction(orderId: string, input: unknown): Promise<AdminResult> {
  return run(async () => {
    const admin = await requireAdmin();
    const d = shippingSchema.parse(input);
    await db
      .update(schema.orders)
      .set({ courier: d.courier, trackingNumber: d.trackingNumber, trackingUrl: d.trackingUrl || null, updatedAt: new Date() })
      .where(eq(schema.orders.id, uuid.parse(orderId)));
    await addOrderNote(orderId, `Shipping details: ${d.courier} ${d.trackingNumber}`, admin.id, false);
    return { ok: true, message: "Shipping details saved." };
  }, orderPaths(orderId));
}

export async function saveCostsAction(orderId: string, input: { production: string; shipping: string; partner: string }): Promise<AdminResult> {
  return run(async () => {
    const admin = await requireAdmin();
    const production = input.production.trim() === "" ? null : rupeesToPaise(input.production);
    const shipping = input.shipping.trim() === "" ? null : rupeesToPaise(input.shipping);
    await db
      .update(schema.orders)
      .set({ productionCostPaise: production, shippingCostPaise: shipping, productionPartner: input.partner.trim().slice(0, 80) || null, updatedAt: new Date() })
      .where(eq(schema.orders.id, uuid.parse(orderId)));
    await db.insert(schema.orderEvents).values({ orderId, type: "COST", message: `Costs updated: production ${input.production || "–"}, shipping ${input.shipping || "–"}`, actorUserId: admin.id });
    return { ok: true, message: "Costs saved." };
  }, orderPaths(orderId));
}

export async function recordPaymentAction(orderId: string, input: { amount: string; method: string; reference: string }): Promise<AdminResult> {
  return run(async () => {
    const admin = await requireAdmin();
    const method = z.enum(["UPI", "Bank transfer", "Cash", "Card (offline)", "Other"]).parse(input.method);
    await recordManualPayment(uuid.parse(orderId), rupeesToPaise(input.amount), method, input.reference.trim().slice(0, 80) || null, admin.id);
    return { ok: true, message: "Payment recorded." };
  }, orderPaths(orderId));
}

/* ── Catalogue ── */

const productSchema = z.object({
  name: z.string().trim().min(2).max(80),
  tagline: z.string().trim().min(2).max(140),
  description: z.string().trim().min(10).max(2000),
  story: z.string().trim().max(2000),
  includes: z.string().max(2000),
  leadTimeMinDays: z.coerce.number().int().min(1).max(120),
  leadTimeMaxDays: z.coerce.number().int().min(1).max(120),
  active: z.boolean(),
  includesMemoryPage: z.boolean(),
  seoTitle: z.string().trim().max(120),
  seoDescription: z.string().trim().max(300),
});

export async function saveProductAction(productId: string, input: unknown): Promise<AdminResult> {
  return run(async () => {
    const d = productSchema.parse(input);
    if (d.leadTimeMaxDays < d.leadTimeMinDays) return { ok: false, error: "Max lead time must be ≥ min." };
    await db
      .update(schema.products)
      .set({ ...d, includes: d.includes.split("\n").map((s) => s.trim()).filter(Boolean), seoTitle: d.seoTitle || null, seoDescription: d.seoDescription || null, updatedAt: new Date() })
      .where(eq(schema.products.id, uuid.parse(productId)));
    return { ok: true, message: "Edition saved." };
  }, ["*"]);
}

export async function saveVariantAction(variantId: string | null, productId: string, input: { name: string; description: string; price: string; active: boolean }): Promise<AdminResult> {
  return run(async () => {
    const name = z.string().trim().min(2, "Name the size.").max(80).parse(input.name);
    const pricePaise = rupeesToPaise(input.price);
    if (pricePaise < 100) return { ok: false, error: "Price must be at least ₹1." };
    if (variantId) {
      await db.update(schema.productVariants).set({ name, description: input.description.trim().slice(0, 200), pricePaise, active: input.active }).where(eq(schema.productVariants.id, uuid.parse(variantId)));
    } else {
      await db.insert(schema.productVariants).values({ productId: uuid.parse(productId), name, description: input.description.trim().slice(0, 200), pricePaise, active: input.active, sortOrder: 99 });
    }
    return { ok: true, message: "Price saved. Existing orders keep the price they were placed at." };
  }, ["*"]);
}

export async function saveOptionAction(optionId: string | null, productId: string, input: { kind: "POSE" | "BASE"; label: string; description: string; delta: string; active: boolean }): Promise<AdminResult> {
  return run(async () => {
    const label = z.string().trim().min(2, "Label?").max(80).parse(input.label);
    const kind = z.enum(["POSE", "BASE"]).parse(input.kind);
    const priceDeltaPaise = input.delta.trim() === "" ? 0 : rupeesToPaise(input.delta);
    const values = { label, description: input.description.trim().slice(0, 200), priceDeltaPaise, active: input.active };
    if (optionId) await db.update(schema.productOptions).set(values).where(eq(schema.productOptions.id, uuid.parse(optionId)));
    else await db.insert(schema.productOptions).values({ ...values, kind, productId: uuid.parse(productId), sortOrder: 99 });
    return { ok: true, message: "Option saved." };
  }, ["*"]);
}

/* ── Reviews ── */
export async function moderateReviewAction(reviewId: string, status: "PENDING" | "PUBLISHED" | "HIDDEN", featured: boolean): Promise<AdminResult> {
  return run(async () => {
    await db.update(schema.reviews).set({ status: z.enum(["PENDING", "PUBLISHED", "HIDDEN"]).parse(status), featured: status === "PUBLISHED" && featured }).where(eq(schema.reviews.id, uuid.parse(reviewId)));
    return { ok: true };
  }, ["*"]);
}

/* ── Memory pages ── */
export async function adminDeleteMemoryAction(pageId: string): Promise<AdminResult> {
  return run(async () => {
    const n = await deleteMemoryPage(uuid.parse(pageId));
    return { ok: true, message: `Memory page and ${n} file(s) permanently deleted.` };
  }, ["/admin/memories"]);
}

export async function adminSetMemoryVisibilityAction(pageId: string, visibility: "PRIVATE" | "LINK"): Promise<AdminResult> {
  return run(async () => {
    await db.update(schema.memoryPages).set({ visibility: z.enum(["PRIVATE", "LINK"]).parse(visibility) }).where(eq(schema.memoryPages.id, uuid.parse(pageId)));
    return { ok: true };
  }, ["/admin/memories"]);
}

/* ── Settings ── */
export async function saveSettingsAction(input: { shippingFee: string; freeAbove: string; contactEmail: string; contactWhatsapp: string; manualPaymentInstructions: string }): Promise<AdminResult> {
  return run(async () => {
    await setSetting("shippingFeePaise", input.shippingFee.trim() === "" ? 0 : rupeesToPaise(input.shippingFee));
    await setSetting("freeShippingAbovePaise", input.freeAbove.trim() === "" ? null : rupeesToPaise(input.freeAbove));
    await setSetting("contactEmail", z.email("Valid contact email?").parse(input.contactEmail.trim()));
    await setSetting("contactWhatsapp", input.contactWhatsapp.trim().slice(0, 20));
    await setSetting("manualPaymentInstructions", z.string().trim().min(10).max(800).parse(input.manualPaymentInstructions));
    return { ok: true, message: "Settings saved." };
  }, ["*"]);
}
