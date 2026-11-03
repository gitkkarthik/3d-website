import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { errorResponse, guardOrigin, json } from "@/lib/api";
import { markOrderPaid } from "@/lib/orders";
import { notifyCustomer } from "@/lib/notify";
import { razorpayConfig, verifyCheckoutSignature } from "@/lib/razorpay";

/**
 * Called by the browser after Razorpay Checkout succeeds. We only mark the order
 * paid if the HMAC signature verifies with our secret — the browser's word is not enough.
 * The webhook (payment.captured / order.paid) is the backstop if this call never arrives.
 */
export async function POST(req: Request) {
  const bad = guardOrigin(req);
  if (bad) return bad;
  try {
    const user = await requireUser();
    const cfg = razorpayConfig();
    if (!cfg) return json({ error: "Online payment isn't enabled." }, 503);
    const b = (await req.json().catch(() => ({}))) as Record<string, string | undefined>;
    const rzpOrderId = b.razorpay_order_id ?? "";
    const rzpPaymentId = b.razorpay_payment_id ?? "";
    const signature = b.razorpay_signature ?? "";
    if (!rzpOrderId || !rzpPaymentId || !signature) return json({ error: "Incomplete payment response." }, 400);

    const [payment] = await db.select().from(schema.payments).where(eq(schema.payments.providerOrderId, rzpOrderId));
    if (!payment) return json({ error: "Payment not found." }, 404);
    const [order] = await db.select().from(schema.orders).where(eq(schema.orders.id, payment.orderId));
    if (!order || order.userId !== user.id) return json({ error: "Payment not found." }, 404);

    if (!verifyCheckoutSignature(rzpOrderId, rzpPaymentId, signature, cfg.keySecret)) {
      await db.update(schema.payments).set({ status: "FAILED", note: "Signature verification failed", updatedAt: new Date() }).where(eq(schema.payments.id, payment.id));
      return json({ error: "We couldn't verify this payment. If money left your account, contact us and we'll sort it out." }, 400);
    }

    const wasPaid = order.paymentStatus === "PAID";
    await db.transaction(async (tx) => {
      await tx
        .update(schema.payments)
        .set({ status: "CAPTURED", providerPaymentId: rzpPaymentId, updatedAt: new Date() })
        .where(eq(schema.payments.id, payment.id));
      await markOrderPaid(tx, order.id, user.id, `Paid online via Razorpay (${rzpPaymentId})`);
    });
    if (!wasPaid) {
      await notifyCustomer(user.id, order.id, "Payment received", `Thank you, your payment for ${order.petName}'s keepsake is confirmed.`, `/account/orders/${order.id}`);
    }
    return json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}
