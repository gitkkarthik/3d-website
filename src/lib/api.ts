import "server-only";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AuthError } from "./auth";
import { OrderError } from "./orders";
import { UploadError } from "./files";
import { isSameOrigin, randomToken } from "./security";

export const DRAFT_COOKIE = "pm_draft";

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

export function errorResponse(e: unknown) {
  if (e instanceof AuthError) return json({ error: e.message }, e.status);
  if (e instanceof OrderError || e instanceof UploadError) return json({ error: e.message }, 400);
  console.error(e);
  return json({ error: "Something went wrong on our side. Please try again." }, 500);
}

/** Reject cross-site state-changing requests. */
export function guardOrigin(req: Request) {
  if (!isSameOrigin(req)) return json({ error: "Invalid request origin." }, 403);
  return null;
}

/** Anonymous wizard uploads are tied to this httpOnly cookie until the order is placed. */
export async function getDraftToken(create: boolean): Promise<string | null> {
  const jar = await cookies();
  const existing = jar.get(DRAFT_COOKIE)?.value;
  if (existing && /^[A-Za-z0-9_-]{32,64}$/.test(existing)) return existing;
  if (!create) return null;
  const token = randomToken(32);
  jar.set(DRAFT_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });
  return token;
}
