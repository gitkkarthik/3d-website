import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { createSession, hashPassword } from "@/lib/auth";
import { errorResponse, guardOrigin, json } from "@/lib/api";
import { clientIp, rateLimit } from "@/lib/security";
import { fieldErrors, registerSchema } from "@/lib/validation";

export async function POST(req: Request) {
  const bad = guardOrigin(req);
  if (bad) return bad;
  if (!rateLimit(`register:${clientIp(req)}`, 10, 60 * 60 * 1000)) {
    return json({ error: "Too many attempts. Please try again in a little while." }, 429);
  }
  try {
    const parsed = registerSchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) return json({ error: "Please check the highlighted fields.", fields: fieldErrors(parsed.error) }, 400);
    const { name, email, phone, password } = parsed.data;
    const [existing] = await db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.email, email));
    if (existing) {
      return json({ error: "An account with this email already exists. Please sign in instead.", fields: { email: "Already registered" } }, 409);
    }
    const [user] = await db
      .insert(schema.users)
      .values({ name, email, phone: phone ?? null, passwordHash: await hashPassword(password) })
      .returning({ id: schema.users.id, name: schema.users.name, email: schema.users.email });
    await createSession(user.id);
    return json({ user });
  } catch (e) {
    return errorResponse(e);
  }
}
