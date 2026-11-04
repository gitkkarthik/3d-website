import Image from "next/image";
import Link from "next/link";
import { SoundHero } from "@/components/home/SoundHero";
import { ListenScene, ScanScene } from "@/components/home/Scenes";
import { MemoryPreview } from "@/components/home/MemoryPreview";
import { EditionCard } from "@/components/site/EditionCard";
import { Faq, faqJsonLd } from "@/components/site/Faq";
import { Reveal } from "@/components/site/Reveal";
import { ReviewList } from "@/components/site/Reviews";
import { getProducts } from "@/lib/catalog";
import { EXAMPLES, STEPS, WHY } from "@/lib/content";
import { getPublishedReviews } from "@/lib/reviews";
import { SITE, absoluteUrl } from "@/lib/site";

export const revalidate = 300;

export default async function HomePage() {
  const [products, reviews] = await Promise.all([getProducts(), getPublishedReviews({ limit: 6 })]);
  const orgLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE.name,
    url: absoluteUrl("/"),
    slogan: SITE.tagline,
    areaServed: "IN",
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([orgLd, faqJsonLd()]) }} />

      {/* ───────────── Hero: their sound, engraved ───────────── */}
      <section className="relative -mt-16 overflow-hidden bg-night pt-16">
        <div className="pointer-events-none absolute -left-40 top-20 h-96 w-96 rounded-full bg-clay/20 blur-[120px]" aria-hidden />
        <div className="mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6 md:pt-14 lg:px-8 lg:pb-24">
          <SoundHero siteUrl={SITE.url} />
        </div>
      </section>

      {/* ───────────── The insight ───────────── */}
      <section>
        <div className="mx-auto max-w-5xl px-4 py-20 text-center sm:px-6 sm:py-28">
          <Reveal>
            <p className="eyebrow">Why sound</p>
            <p className="mt-6 font-display text-[1.8rem] leading-[1.25] sm:text-[2.7rem]">
              Your phone holds a thousand photos of them.{" "}
              <em className="italic-soft text-clay">Almost no recordings.</em>
            </p>
            <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-ink-soft">
              The jingle of a collar. The sigh when they finally settle. The sound they make only for you. Faces stay with us for years; sounds are the first thing we lose. So every Pawsome keepsake carries both: their likeness to hold, and their voice to hear again.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ───────────── Hold. Scan. Hear. ───────────── */}
      <section className="bg-sand/50">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
          <h2 className="max-w-3xl text-4xl leading-tight sm:text-6xl">
            Hold them. Scan them. <em className="italic-soft text-clay">Hear them.</em>
          </h2>
          <ol className="mt-14 grid gap-6 md:grid-cols-3">
            <Reveal as="li" className="flex flex-col">
              <div className="relative aspect-[4/5] overflow-hidden rounded-[1.75rem] bg-[radial-gradient(ellipse_at_50%_35%,#fbf5ec,#e6d8c4)]">
                <Image src="/renders/hold.webp" alt="Illustrative render of a keepsake with an engraved waveform and QR code" fill sizes="(min-width:768px) 33vw, 100vw" className="object-contain p-4" />
                <span className="render-tag absolute left-3 top-3">Illustrative</span>
              </div>
              <p className="mt-5 font-display text-3xl text-clay-soft">01</p>
              <h3 className="mt-1 text-2xl">Hold them</h3>
              <p className="mt-2 leading-relaxed text-ink-soft">A hand-painted miniature sculpted from your photos, with their name and the shape of their sound engraved into the base.</p>
            </Reveal>
            <Reveal as="li" delay={100} className="flex flex-col">
              <ScanScene />
              <p className="mt-5 font-display text-3xl text-clay-soft">02</p>
              <h3 className="mt-1 text-2xl">Scan them</h3>
              <p className="mt-2 leading-relaxed text-ink-soft">Point any phone camera at the engraved code. No app, no login, no subscription. It works for every guest, every year.</p>
            </Reveal>
            <Reveal as="li" delay={200} className="flex flex-col">
              <ListenScene />
              <p className="mt-5 font-display text-3xl text-clay-soft">03</p>
              <h3 className="mt-1 text-2xl">Hear them</h3>
              <p className="mt-2 leading-relaxed text-ink-soft">Their sound plays as their photos drift by, followed by their story, the videos you love and your words to them.</p>
            </Reveal>
          </ol>

          <ul className="mt-16 grid gap-px overflow-hidden rounded-[1.5rem] bg-oat/70 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["No subscription. Ever.", "One price. The code on your keepsake never stops working because a plan lapsed."],
              ["Download everything", "Your photos, recordings and story are yours. Export them whenever you like."],
              ["Private unless you share", "Only people holding the keepsake, or your private link, can open it."],
              ["Add to it for years", "New photos, a new voice note, a birthday. The page grows with them."],
            ].map(([t, b]) => (
              <li key={t} className="bg-ivory p-6">
                <p className="font-display text-lg">{t}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{b}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ───────────── How it works ───────────── */}
      <section id="how-it-works" className="scroll-mt-20">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr] lg:items-end">
            <div>
              <p className="eyebrow">How it works</p>
              <h2 className="mt-4 text-4xl leading-tight sm:text-5xl">
                Made by people, <em className="italic-soft">approved by you.</em>
              </h2>
            </div>
            <p className="max-w-xl text-ink-soft lg:justify-self-end">
              There&apos;s no magic button. A real artist sculpts every design from your photos, and nothing is printed until
              you&apos;ve seen it and said yes.
            </p>
          </div>
          <ol className="mt-14 grid gap-px overflow-hidden rounded-[1.5rem] bg-line shadow-[0_0_0_1px_var(--color-line)] sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <Reveal as="li" key={s.n} delay={i * 90} className="flex flex-col bg-paper p-7">
                <span className="font-display text-5xl text-clay-soft">{s.n}</span>
                <h3 className="mt-6 text-xl">{s.title}</h3>
                <p className="mt-3 flex-1 text-[0.95rem] leading-relaxed text-ink-soft">{s.body}</p>
                <p className="mt-6 text-xs font-medium uppercase tracking-[0.14em] text-sage">{s.time}</p>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* ───────────── Editions ───────────── */}
      <section className="bg-sand/45">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="eyebrow">The editions</p>
              <h2 className="mt-4 text-4xl sm:text-5xl">Four ways to keep them close</h2>
            </div>
            <Link href="/editions" className="text-sm font-medium text-ink underline decoration-oat underline-offset-4 hover:decoration-ink">
              Compare all editions
            </Link>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((p, i) => (
              <Reveal key={p.id} delay={i * 80}>
                <EditionCard p={p} index={i} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────── Examples ───────────── */}
      <section>
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
          <div className="max-w-2xl">
            <p className="eyebrow">Styles &amp; finishes</p>
            <h2 className="mt-4 text-4xl sm:text-5xl">
              Every one starts with <em className="italic-soft">a story</em>
            </h2>
            <p className="mt-5 text-ink-soft">
              These are illustrative studio renders showing our poses, bases and engraving, paired with the kind of detail
              that shapes a design. They aren&apos;t photographs of customer orders.
            </p>
          </div>
          <div className="-mx-4 mt-12 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-3">
            {EXAMPLES.map((e, i) => (
              <Reveal key={e.name} delay={(i % 3) * 80} className="w-[78%] shrink-0 snap-center sm:w-auto">
                <figure className="group">
                  <div className="relative aspect-square overflow-hidden rounded-[1.5rem] bg-sand">
                    <Image src={e.src} alt={`${e.name}: illustrative render`} fill sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 80vw" className="object-contain p-5 transition-transform duration-700 group-hover:scale-[1.03]" />
                    <span className="render-tag absolute left-3 top-3">Illustrative</span>
                  </div>
                  <figcaption className="mt-4">
                    <p className="font-display text-xl">{e.name}</p>
                    <p className="mt-1 font-display italic text-ink-soft">&ldquo;{e.note}&rdquo;</p>
                    <p className="mt-2 text-xs uppercase tracking-[0.12em] text-ink-mute">{e.style}</p>
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────── Memory pages ───────────── */}
      <section className="overflow-hidden bg-sage-soft/60">
        <div className="mx-auto grid max-w-7xl items-center gap-14 px-4 py-20 sm:px-6 sm:py-28 lg:grid-cols-2 lg:px-8">
          <Reveal>
            <p className="eyebrow !text-sage">Digital memory pages</p>
            <h2 className="mt-4 text-4xl leading-tight sm:text-5xl">
              Some memories <em className="italic-soft">have a sound.</em>
            </h2>
            <p className="mt-6 max-w-lg leading-relaxed text-ink-soft">
              Every keepsake comes with a private memory page, the one its QR code opens: their photos, the videos you
              can&apos;t delete, the voice notes of their ridiculous little noises, and the stories behind them.
            </p>
            <ul className="mt-8 space-y-3 text-ink-soft">
              {[
                "Private by default. Share it only if you want to",
                "Never listed, indexed or searchable",
                "Photos, videos, voice recordings and special dates",
                "Delete it whenever you choose",
              ].map((t) => (
                <li key={t} className="flex gap-3">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-sage" aria-hidden />
                  {t}
                </li>
              ))}
            </ul>
            <Link href="/memory-pages" className="btn btn-ghost mt-10">
              About memory pages
            </Link>
          </Reveal>
          <Reveal delay={150}>
            <MemoryPreview />
          </Reveal>
        </div>
      </section>

      {/* ───────────── Customer stories ───────────── */}
      <section>
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
          <p className="eyebrow">Customer stories</p>
          <h2 className="mt-4 max-w-2xl text-4xl sm:text-5xl">From the families we make for</h2>
          <div className="mt-12">
            <ReviewList
              reviews={reviews}
              emptyTitle="Our first stories are still being written."
              emptyBody="We're a new studio, so we don't have customer reviews to show you yet, and we won't invent any. Every review here will come from a family who received their keepsake, linked to a real order."
            />
          </div>
        </div>
      </section>

      {/* ───────────── Why us ───────────── */}
      <section className="bg-sand/45">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-[1fr_2fr]">
            <div>
              <p className="eyebrow">Why Pawsome Memories</p>
              <h2 className="mt-4 text-4xl leading-tight sm:text-5xl">Small studio. Big care.</h2>
            </div>
            <div className="grid gap-x-10 gap-y-10 sm:grid-cols-2">
              {WHY.map((w, i) => (
                <Reveal key={w.title} delay={(i % 2) * 80}>
                  <div className="border-t border-oat pt-5">
                    <h3 className="text-xl">{w.title}</h3>
                    <p className="mt-2 leading-relaxed text-ink-soft">{w.body}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ───────────── FAQ ───────────── */}
      <section id="faq" className="scroll-mt-20">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-20 sm:px-6 sm:py-28 lg:grid-cols-[1fr_2fr] lg:px-8">
          <div>
            <p className="eyebrow">Questions</p>
            <h2 className="mt-4 text-4xl sm:text-5xl">Good to know</h2>
          </div>
          <Faq />
        </div>
      </section>

      {/* ───────────── Beyond paws ───────────── */}
      <section>
        <div className="mx-auto max-w-4xl px-4 pb-20 text-center sm:px-6">
          <Reveal>
            <p className="eyebrow">Where this is going</p>
            <p className="mt-5 font-display text-[1.6rem] leading-snug sm:text-[2.2rem]">
              We&apos;re starting with the ones with paws.{" "}
              <em className="italic-soft text-clay">But a grandmother&apos;s lullaby deserves keeping too.</em>
            </p>
            <p className="mx-auto mt-5 max-w-2xl text-ink-soft">
              The same idea, a likeness to hold and a voice to hear again, works for anyone you love. If you&apos;d like us to make one for a person, tell us at{" "}
              <a href="mailto:hello@pawsomememories.in?subject=Keepsake%20for%20a%20person" className="underline underline-offset-4">
                hello@pawsomememories.in
              </a>
              . We&apos;re listening.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ───────────── Final CTA ───────────── */}
      <section className="px-4 pb-20 sm:px-6 lg:px-8">
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-night px-6 py-16 text-center text-ivory sm:px-12 sm:py-24">
          <div className="pointer-events-none absolute -bottom-24 left-1/2 h-72 w-[42rem] -translate-x-1/2 rounded-full bg-clay/25 blur-3xl" aria-hidden />
          <p className="eyebrow relative !text-clay-soft">Five minutes, a few photos</p>
          <h2 className="relative mx-auto mt-5 max-w-3xl text-4xl leading-tight sm:text-6xl">
            Before the sound fades, <em className="italic-soft text-[#e7c3a5]">let&apos;s keep it.</em>
          </h2>
          <Link href="/create" className="btn relative mt-10 h-13 bg-ivory px-8 text-base text-ink hover:bg-white">
            Create your pet keepsake
          </Link>
          <p className="relative mt-5 text-sm text-[#bfb3a6]">A few photos, a voice note if you have one, five minutes. You approve the design before we make anything.</p>
        </div>
      </section>
    </>
  );
}
