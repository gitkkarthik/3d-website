import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { safeEqual } from "@/lib/security";
import { MemoryView } from "@/components/memory/MemoryView";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Hear them again",
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
  referrer: "no-referrer",
};

/**
 * Where the QR code engraved on a keepsake points. It's permanent: it keeps working
 * whether or not the owner shares their private link, unless they switch scanning off.
 */
export default async function ScanPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!/^[A-Za-z0-9_-]{12,64}$/.test(token)) notFound();
  const [page] = await db.select().from(schema.memoryPages).where(eq(schema.memoryPages.qrToken, token));
  if (!page || !page.qrToken || !safeEqual(page.qrToken, token)) notFound();
  const user = await getCurrentUser();
  const isOwner = !!user && (user.id === page.userId || user.role === "ADMIN");
  if (!page.qrEnabled && !isOwner) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-night px-6 text-center text-ivory">
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-[#e7c3a5]">Pawsome Memories</p>
        <h1 className="mt-5 text-4xl">This keepsake is resting quietly.</h1>
        <p className="mt-3 max-w-sm text-white/60">Its family has paused scanning for now. Nothing has been lost; they can switch it back on any time.</p>
        <Link href="/" className="mt-8 text-sm underline underline-offset-4">
          About Pawsome Memories
        </Link>
      </div>
    );
  }
  return <MemoryView page={page} access={{ key: "q", value: page.qrToken }} isOwner={isOwner} />;
}
