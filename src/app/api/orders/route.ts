import { requireUser } from "@/lib/auth";
import { errorResponse, getDraftToken, guardOrigin, json } from "@/lib/api";
import { createOrder } from "@/lib/orders";
import { notifyCustomer } from "@/lib/notify";
import { rateLimit } from "@/lib/security";
import { fieldErrors, orderInputSchema } from "@/lib/validation";

export async function POST(req: Request) {
  const bad = guardOrigin(req);
  if (bad) return bad;
  try {
    const user = await requireUser();
    if (!rateLimit(`order:${user.id}`, 10, 60 * 60 * 1000)) return json({ error: "Too many orders in a short time. Please contact us." }, 429);
    const parsed = orderInputSchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) return json({ error: "A few details need another look.", fields: fieldErrors(parsed.error) }, 400);
    const draft = await getDraftToken(false);
    const { order, duplicate } = await createOrder(user.id, draft, parsed.data);
    if (!duplicate) {
      await notifyCustomer(
        user.id,
        order.id,
        `We've received ${order.petName}'s story`,
        `Thank you. Your order ${order.number} is in. Our artist will study your photos and send you a design preview to approve before anything is made.`,
        `/account/orders/${order.id}`,
      );
    }
    return json({ order: { id: order.id, number: order.number }, duplicate });
  } catch (e) {
    return errorResponse(e);
  }
}
