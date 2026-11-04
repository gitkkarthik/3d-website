import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { safeEqual } from "@/lib/security";
import { MemoryView } from "@/components/memory/MemoryView";

export const dynamic = "force-dynamic";

// Never indexed, never in the sitemap, never sends its URL as a referrer.
export const metadata: Metadata = {
  title: "A memory page",
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
  referrer: "no-referrer",
};

export default async function MemoryPageView({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!/^[A-Za-z0-9_-]{16,64}$/.test(slug)) notFound();
  const [page] = await db.select().from(schema.memoryPages).where(eq(schema.memoryPages.slug, slug));
  if (!page || !safeEqual(page.slug, slug)) notFound();
  const user = await getCurrentUser();
  const isOwner = !!user && (user.id === page.userId || user.role === "ADMIN");
  // Private pages look exactly like pages that don't exist.
  if (page.visibility === "PRIVATE" && !isOwner) notFound();
  return <MemoryView page={page} access={{ key: "m", value: page.slug }} isOwner={isOwner} />;
}
