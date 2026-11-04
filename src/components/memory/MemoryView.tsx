import Link from "next/link";
import { and, asc, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { getMemoryMedia, videoEmbed, type MemoryPage } from "@/lib/memories";
import { MemoryPlayer } from "./MemoryPlayer";

/**
 * A memory page. Reached by its private link (/m/…) or by scanning the keepsake (/q/…).
 * `access` is passed to every file URL so the file route can authorise viewers who aren't signed in.
 */
export async function MemoryView({ page, access, isOwner }: { page: MemoryPage; access: { key: "m" | "q"; value: string }; isOwner: boolean }) {
  const media = await getMemoryMedia(page.id);
  const orderSounds = page.orderId
    ? await db
        .select()
        .from(schema.uploads)
        .where(and(eq(schema.uploads.orderId, page.orderId), eq(schema.uploads.kind, "PET_SOUND")))
        .orderBy(asc(schema.uploads.sortOrder))
    : [];
  const images = media.filter((m) => m.kind === "MEMORY_IMAGE");
  const audios = [...orderSounds, ...media.filter((m) => m.kind === "MEMORY_AUDIO")];
  const videos = media.filter((m) => m.kind === "MEMORY_VIDEO");
  const src = (id: string, v?: string) => `/api/files/${id}?${access.key}=${encodeURIComponent(access.value)}${v ? `&v=${v}` : ""}`;
  const fmt = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

  const photos = [
    ...(page.profileUploadId ? [{ src: src(page.profileUploadId), alt: page.petName }] : []),
    ...images.filter((i) => i.id !== page.profileUploadId).map((i) => ({ src: src(i.id), alt: i.caption ?? "" })),
  ].slice(0, 12);
  const sounds = audios.map((a, i) => ({
    id: a.id,
    src: src(a.id),
    peaks: a.waveform ?? null,
    duration: a.durationSec ?? null,
    title: a.caption || (a.kind === "PET_SOUND" ? (i === 0 ? `${page.petName}'s sound` : `${page.petName}, recording ${i + 1}`) : "A voice note"),
  }));

  return (
    <div className={`min-h-dvh ${page.isMemorial ? "bg-[#f4f1ec]" : "bg-ivory"}`}>
      {isOwner && (
        <div className="fixed inset-x-0 top-0 z-30 bg-night/80 text-ivory backdrop-blur">
          <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-2 px-4 py-2 text-xs">
            <span>
              {access.key === "q"
                ? "You're seeing what people see when they scan the keepsake."
                : page.visibility === "PRIVATE"
                  ? "Private: only you can see this link."
                  : "Shared: anyone with this link can view it."}
            </span>
            <Link href={`/account/memories/${page.id}`} className="font-medium underline underline-offset-4">
              Edit page
            </Link>
          </div>
        </div>
      )}

      <MemoryPlayer name={page.petName} subtitle={page.subtitle} memorial={page.isMemorial} photos={photos} sounds={sounds} />

      <main id="story" className="mx-auto max-w-3xl scroll-mt-4 px-4 pb-24 pt-16 sm:px-6">
        {page.message && (
          <section className="pb-10 text-center">
            <p className="font-display text-[1.7rem] leading-snug text-ink sm:text-[2.1rem]">
              <span className="text-clay-soft">&ldquo;</span>
              {page.message}
              <span className="text-clay-soft">&rdquo;</span>
            </p>
          </section>
        )}

        {page.story && (
          <section className="py-8" aria-labelledby="story-h">
            <h2 id="story-h" className="text-center text-3xl">
              Their story
            </h2>
            <div className="mt-6 space-y-5 font-display text-[1.15rem] leading-[1.85] text-ink-soft">
              {page.story.split(/\n{2,}/).map((p, i) => (
                <p key={i} className={i === 0 ? "first-letter:float-left first-letter:mr-2 first-letter:font-display first-letter:text-6xl first-letter:leading-[0.9] first-letter:text-clay" : ""}>
                  {p}
                </p>
              ))}
            </div>
          </section>
        )}
      </main>

      {images.length > 0 && (
        <section className="mx-auto max-w-5xl px-4 pb-16 sm:px-6" aria-label="Photos">
          <div className="columns-2 gap-3 sm:columns-3 [&>figure]:mb-3">
            {images.map((m) => (
              <figure key={m.id} className="break-inside-avoid overflow-hidden rounded-2xl bg-sand">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src(m.id)} alt={m.caption ?? ""} loading="lazy" className="w-full" />
                {m.caption && <figcaption className="bg-paper px-3 py-2 font-display text-sm italic text-ink-soft">{m.caption}</figcaption>}
              </figure>
            ))}
          </div>
        </section>
      )}

      <div className="mx-auto max-w-3xl px-4 pb-24 sm:px-6">
        {(videos.length > 0 || page.videoLinks.length > 0) && (
          <section className="pb-12" aria-labelledby="videos">
            <h2 id="videos" className="text-center text-3xl">
              Moving pictures
            </h2>
            <div className="mt-6 space-y-5">
              {videos.map((v) => (
                <figure key={v.id}>
                  <video controls preload="metadata" playsInline src={src(v.id)} className="w-full rounded-2xl bg-night" />
                  {v.caption && <figcaption className="mt-2 text-center font-display italic text-ink-soft">{v.caption}</figcaption>}
                </figure>
              ))}
              {page.videoLinks.map((v, i) => {
                const embed = videoEmbed(v.url);
                return embed ? (
                  <div key={i} className="aspect-video overflow-hidden rounded-2xl bg-night">
                    <iframe src={embed} title={v.title ?? `Video ${i + 1}`} className="h-full w-full" allow="encrypted-media; picture-in-picture" allowFullScreen referrerPolicy="no-referrer" loading="lazy" />
                  </div>
                ) : (
                  <a key={i} href={v.url} target="_blank" rel="noreferrer noopener" className="block rounded-2xl bg-paper p-4 text-center underline shadow-[0_0_0_1px_var(--color-line)]">
                    {v.title ?? "Watch video"} ↗
                  </a>
                );
              })}
            </div>
          </section>
        )}

        {page.memories.length > 0 && (
          <section className="pb-12" aria-labelledby="memories">
            <h2 id="memories" className="text-center text-3xl">
              Favourite memories
            </h2>
            <div className="mt-8 space-y-10">
              {page.memories.map((m, i) => (
                <article key={i} className="border-t border-oat pt-6">
                  {m.title && <h3 className="text-2xl">{m.title}</h3>}
                  <p className="mt-3 whitespace-pre-line leading-relaxed text-ink-soft">{m.body}</p>
                </article>
              ))}
            </div>
          </section>
        )}

        {page.specialDates.length > 0 && (
          <section className="pb-12" aria-labelledby="dates">
            <h2 id="dates" className="text-center text-3xl">
              Days we remember
            </h2>
            <ul className="mx-auto mt-8 max-w-md space-y-4">
              {page.specialDates.map((d, i) => (
                <li key={i} className="flex items-baseline justify-between gap-4 border-b border-line pb-3">
                  <span className="font-display text-lg">{d.label}</span>
                  <span className="text-sm text-ink-mute">{d.date ? fmt(d.date) : ""}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {!page.message && !page.story && images.length === 0 && audios.length === 0 && page.memories.length === 0 && (
          <div className="rounded-2xl bg-paper p-8 text-center shadow-[0_0_0_1px_var(--color-line)]">
            <p className="font-display text-2xl">This page is waiting for its first memory.</p>
            {isOwner && (
              <Link href={`/account/memories/${page.id}`} className="btn btn-primary mt-5">
                Add photos, stories &amp; voice notes
              </Link>
            )}
          </div>
        )}

        <footer className="pt-10 text-center text-xs text-ink-mute">
          A keepsake page made with{" "}
          <Link href="/" className="underline underline-offset-2">
            Pawsome Memories
          </Link>
        </footer>
      </div>
    </div>
  );
}
