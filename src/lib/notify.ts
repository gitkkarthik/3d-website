import "server-only";
import { eq } from "drizzle-orm";
import { db, schema } from "./db";

const APP_URL = () => process.env.APP_URL || "http://localhost:3001";

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

/** Sends via Resend when configured; otherwise logs (dev). Never throws. */
export async function sendEmail(to: string, subject: string, text: string, href?: string): Promise<"SENT" | "LOGGED" | "FAILED"> {
  const key = process.env.RESEND_API_KEY;
  const link = href ? `${APP_URL()}${href}` : null;
  if (!key) {
    console.info(`[email:dev] to=${to} subject="${subject}"${link ? ` link=${link}` : ""}`);
    return "LOGGED";
  }
  const html = `<div style="font-family:Georgia,serif;background:#f8f3ec;padding:32px;color:#2b2724">
    <p style="font-size:13px;letter-spacing:.12em;text-transform:uppercase;color:#8a6a52">Pawsome Memories</p>
    <h1 style="font-weight:400;font-size:26px;margin:8px 0 16px">${escapeHtml(subject)}</h1>
    <p style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6">${escapeHtml(text)}</p>
    ${link ? `<p style="margin-top:24px"><a href="${link}" style="background:#2b2724;color:#f8f3ec;padding:12px 20px;border-radius:999px;text-decoration:none;font-family:Arial,sans-serif;font-size:14px">View your order</a></p>` : ""}
  </div>`;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: process.env.EMAIL_FROM, to, subject, text: link ? `${text}\n\n${link}` : text, html }),
    });
    return res.ok ? "SENT" : "FAILED";
  } catch {
    return "FAILED";
  }
}

/** In-app notification (always) + email (best effort). */
export async function notifyCustomer(userId: string, orderId: string | null, title: string, body: string, href?: string) {
  const [user] = await db.select({ email: schema.users.email }).from(schema.users).where(eq(schema.users.id, userId));
  const emailStatus = user ? await sendEmail(user.email, title, body, href) : "SKIPPED";
  await db.insert(schema.notifications).values({ userId, orderId, title, body, href: href ?? null, emailStatus });
}
