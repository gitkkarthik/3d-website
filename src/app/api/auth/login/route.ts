import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { createSession, verifyPassword } from "@/lib/auth";
import { errorResponse, guardOrigin, json } from "@/lib/api";
import { clientIp, rateLimit } from "@/lib/security";
import { loginSchema } from "@/lib/validation";

export async function POST(req: Request) {
  const bad = guardOrigin(req);
  if (bad) return bad;
  try {
    const parsed = loginSchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) return json({ error: "Enter your email and password." }, 400);
    const { email, password } = parsed.data;
    if (!rateLimit(`login:${clientIp(req)}:${email}`, 8, 15 * 60 * 1000)) {
      return json({ error: "Too many attempts. Please wait 15 minutes and try again." }, 429);
    }
    const [user] = await db.select().from(schema.users).where(eq(schema.users.email, email));
    // Same message either way, so emails can't be probed.
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return json({ error: "That email and password don't match." }, 401);
    }
    await createSession(user.id);
    return json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (e) {
    return errorResponse(e);
  }
}
