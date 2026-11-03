import type { Metadata } from "next";
import Link from "next/link";
import { requireAdminPage } from "@/lib/auth";
import { Wordmark } from "@/components/site/Wordmark";
import { AdminNav } from "@/components/admin/AdminNav";

export const metadata: Metadata = { title: "Studio", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdminPage();
  return (
    <div className="min-h-dvh bg-[#f5f0e8]">
      <header className="sticky top-0 z-30 border-b border-line bg-paper/95 backdrop-blur">
        <div className="flex h-14 items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <Wordmark />
            <span className="rounded-full bg-ink px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider text-ivory">Studio</span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="hidden text-ink-mute sm:inline">{admin.email}</span>
            <Link href="/" className="text-ink-soft hover:text-ink">
              View site ↗
            </Link>
          </div>
        </div>
        <AdminNav />
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 lg:px-6 lg:py-8">{children}</main>
    </div>
  );
}
