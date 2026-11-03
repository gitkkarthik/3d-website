import type { Metadata } from "next";
import Link from "next/link";
import { MemoryPreview } from "@/components/home/MemoryPreview";

export const metadata: Metadata = {
  title: "Digital memory pages for your pet",
  description: "A private, elegant page for your pet's photos, videos, voice recordings and stories. Included with the Forever, Together and Memorial editions. Never public or searchable.",
  alternates: { canonical: "/memory-pages" },
};

export default function MemoryPagesInfo() {
  return (
    <div className="mx-auto max-w-7xl px-4 pb-24 pt-10 sm:px-6 lg:px-8">
      <div className="grid items-center gap-14 lg:grid-cols-2">
        <div>
          <p className="eyebrow !text-sage">Digital memory pages</p>
          <h1 className="mt-4 text-5xl leading-tight sm:text-6xl">
            The keepsake you hold. <em className="italic-soft text-clay">The memories you keep.</em>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-soft">
            Every Forever, Together and Memorial edition comes with a private page that lives alongside the figurine: a quiet home for their photos, videos, voice
            recordings and the stories you never want to forget.
          </p>
          <Link href="/create" className="btn btn-primary mt-8">
            Create a keepsake
          </Link>
        </div>
        <MemoryPreview />
      </div>

      <div className="mt-24 grid gap-10 md:grid-cols-3">
        {[
          ["Private by default", "Only you can see it until you decide otherwise. Turn on link sharing for family, and turn it off, or issue a new link, at any time."],
          ["Never public, never searchable", "Pages aren't listed anywhere, are hidden from search engines, and use a long, unguessable address. Your files are served only to people allowed to see them."],
          ["Yours to delete", "Delete the page and every photo, video and recording on it, permanently, with one confirmation. No emails, no waiting."],
          ["Photos & captions", "Add the photos you keep going back to, each with a line about the moment."],
          ["Voice notes", "Record their bark or purr, or yourself telling a story, right from your phone."],
          ["Videos & dates", "Upload short clips or link longer ones, and keep the dates that matter: birthdays, gotcha days, goodbyes."],
        ].map(([t, b]) => (
          <div key={t} className="border-t border-oat pt-5">
            <h2 className="text-xl">{t}</h2>
            <p className="mt-2 leading-relaxed text-ink-soft">{b}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
