import { and, count, eq, isNull } from "drizzle-orm";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { getCurrentUser } from "@/lib/auth";
import { getSettings } from "@/lib/catalog";
import { db, schema } from "@/lib/db";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [user, settings] = await Promise.all([getCurrentUser(), getSettings()]);
  let unread = 0;
  if (user) {
    const [r] = await db
      .select({ n: count() })
      .from(schema.notifications)
      .where(and(eq(schema.notifications.userId, user.id), isNull(schema.notifications.readAt)));
    unread = Number(r?.n ?? 0);
  }
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-50 focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-ivory">
        Skip to content
      </a>
      <SiteHeader signedIn={!!user} isAdmin={user?.role === "ADMIN"} unread={unread} />
      <main id="main">{children}</main>
      <SiteFooter contactEmail={settings.contactEmail} />
    </>
  );
}
