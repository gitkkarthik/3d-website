import { destroySession } from "@/lib/auth";
import { guardOrigin, json } from "@/lib/api";

export async function POST(req: Request) {
  const bad = guardOrigin(req);
  if (bad) return bad;
  await destroySession();
  return json({ ok: true });
}
