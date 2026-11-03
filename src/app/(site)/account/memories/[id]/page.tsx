import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { requireUserPage } from "@/lib/auth";
import { getMemoryMedia } from "@/lib/memories";
import { MemoryEditor } from "@/components/memory/MemoryEditor";

export const metadata: Metadata = { title: "Edit memory page", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function EditMemoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUserPage(`/account/memories/${id}`);
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [page] = await db.select().from(schema.memoryPages).where(eq(schema.memoryPages.id, id));
  if (!page || (page.userId !== user.id && user.role !== "ADMIN")) notFound();
  const media = await getMemoryMedia(page.id);
  const h = await headers();
  const origin = process.env.APP_URL || `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;

  return (
    <div className="mx-auto max-w-3xl px-4 pb-24 pt-6 sm:px-6">
      <Link href="/account" className="text-sm text-ink-mute hover:text-ink">
        ← My keepsakes
      </Link>
      <p className="eyebrow mt-6">Memory page</p>
      <h1 className="mt-3 text-4xl sm:text-5xl">
        {page.petName}&apos;s <em className="italic-soft text-clay">memories</em>
      </h1>
      <p className="mt-3 text-ink-soft">Add to it whenever a memory comes back to you. It&apos;s private unless you choose to share it.</p>
      <div className="mt-8">
        <MemoryEditor
          origin={origin}
          page={{
            id: page.id,
            slug: page.slug,
            petName: page.petName,
            subtitle: page.subtitle,
            story: page.story,
            message: page.message,
            memories: page.memories,
            specialDates: page.specialDates,
            videoLinks: page.videoLinks,
            profileUploadId: page.profileUploadId,
            visibility: page.visibility,
            isMemorial: page.isMemorial,
          }}
          media={media.map((m) => ({ id: m.id, kind: m.kind, mimeType: m.mimeType, caption: m.caption }))}
        />
      </div>
    </div>
  );
}
