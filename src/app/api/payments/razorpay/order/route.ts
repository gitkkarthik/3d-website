import { and, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { errorResponse, guardOrigin, json } from "@/lib/api";
import { getOrderForUser } from "@/lib/orders";
import { createRazorpayOrder, razorpayConfig } from "@/lib/razorpay";

/** Create (or reuse) a Razorpay order for the customer's order. Amount always comes from our DB. */
export async function POST(req: Request) {
  const bad = guardOrigin(req);
  if (bad) return bad;
  try {
    const user = await requireUser();
    const cfg = razorpayConfig();
    if (!cfg) return json({ error: "Online payment isn't enabled yet." }, 503);
    const { orderId } = (await req.json().catch(() => ({}))) as { orderId?: string };
    const order = orderId ? await getOrderForUser(orderId, user.id) : null;
    if (!order) return json({ error: "Order not found." }, 404);
    if (order.paymentStatus === "PAID") return json({ error: "This order is already paid." }, 409);
    if (order.status === "CANCELLED") return json({ error: "This order was cancelled." }, 409);

    const [open] = await db
      .select()
      .from(schema.payments)
      .where(and(eq(schema.payments.orderId, order.id), eq(schema.payments.provider, "RAZORPAY"), eq(schema.payments.status, "CREATED"), eq(schema.payments.amountPaise, order.totalPaise)));
    let rzpOrderId = open?.providerOrderId ?? null;
    if (!rzpOrderId) {
      const rzp = await createRazorpayOrder(order.totalPaise, order.number, { order_id: order.id, order_number: order.number });
      rzpOrderId = rzp.id;
      await db.insert(schema.payments).values({ orderId: order.id, provider: "RAZORPAY", status: "CREATED", amountPaise: order.totalPaise, providerOrderId: rzp.id, raw: rzp });
    }
    return json({
      keyId: cfg.keyId,
      testMode: cfg.testMode,
      razorpayOrderId: rzpOrderId,
      amount: order.totalPaise,
      currency: "INR",
      name: "Pawsome Memories",
      description: `${order.snapshot.productName} for ${order.petName}`,
      prefill: { name: user.name, email: user.email, contact: order.shipPhone },
    });
  } catch (e) {
    return errorResponse(e);
  }
}
