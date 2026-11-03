import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { json } from "@/lib/api";
import { markOrderPaid } from "@/lib/orders";
import { verifyWebhookSignature } from "@/lib/razorpay";

/**
 * Razorpay webhook. Configure in Razorpay Dashboard → Webhooks with events
 * payment.captured, payment.failed, order.paid, using RAZORPAY_WEBHOOK_SECRET.
 * Idempotent: replays are harmless.
 */
export async function POST(req: Request) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return json({ error: "Webhook not configured" }, 503);
  const raw = await req.text();
  const sig = req.headers.get("x-razorpay-signature") ?? "";
  if (!sig || !verifyWebhookSignature(raw, sig, secret)) return json({ error: "Invalid signature" }, 401);

  let event: { event?: string; payload?: { payment?: { entity?: { id: string; order_id: string; amount: number; status: string; method?: string } } } };
  try {
    event = JSON.parse(raw);
  } catch {
    return json({ error: "Bad payload" }, 400);
  }
  const p = event.payload?.payment?.entity;
  if (!p?.order_id) return json({ ok: true, ignored: true });

  const [payment] = await db.select().from(schema.payments).where(eq(schema.payments.providerOrderId, p.order_id));
  if (!payment) return json({ ok: true, ignored: true });

  if (event.event === "payment.captured" || event.event === "order.paid") {
    if (p.amount !== payment.amountPaise) {
      console.error(`[razorpay] amount mismatch for ${p.order_id}: got ${p.amount}, expected ${payment.amountPaise}`);
      await db.update(schema.payments).set({ note: `Amount mismatch: received ${p.amount}`, raw: event, updatedAt: new Date() }).where(eq(schema.payments.id, payment.id));
      return json({ ok: true, flagged: true });
    }
    await db.transaction(async (tx) => {
      await tx
        .update(schema.payments)
        .set({ status: "CAPTURED", providerPaymentId: p.id, method: p.method ?? null, raw: event, updatedAt: new Date() })
        .where(eq(schema.payments.id, payment.id));
      await markOrderPaid(tx, payment.orderId, null, `Paid online via Razorpay (${p.id})`);
    });
  } else if (event.event === "payment.failed") {
    if (payment.status !== "CAPTURED") {
      await db.update(schema.payments).set({ status: "FAILED", raw: event, updatedAt: new Date() }).where(eq(schema.payments.id, payment.id));
    }
  }
  return json({ ok: true });
}
