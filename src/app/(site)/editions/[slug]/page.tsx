import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductGallery } from "@/components/site/ProductGallery";
import { ReviewList, Stars } from "@/components/site/Reviews";
import { getProductBySlug, getProducts } from "@/lib/catalog";
import { RENDER_FOR, STEPS } from "@/lib/content";
import { formatINR } from "@/lib/money";
import { getPublishedReviews } from "@/lib/reviews";
import { absoluteUrl } from "@/lib/site";
import type { FigureKey } from "@/components/three/Figurines";

export const revalidate = 300;

export async function generateStaticParams() {
  try {
    return (await getProducts()).map((p) => ({ slug: p.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const p = await getProductBySlug((await params).slug);
  if (!p) return {};
  const img = RENDER_FOR[p.slug]?.main;
  return {
    title: p.seoTitle ?? p.name,
    description: p.seoDescription ?? p.description,
    alternates: { canonical: `/editions/${p.slug}` },
    openGraph: { title: `${p.name} · Pawsome Memories`, description: p.tagline, images: img ? [{ url: img }] : undefined },
  };
}

const DEMO: Record<string, { coat: string; base: "oak" | "walnut" | "ivory" | "slate"; name: string; line2?: string }> = {
  "personality-edition": { coat: "tuxedo", base: "oak", name: "Bruno" },
  "forever-edition": { coat: "fawn", base: "walnut", name: "Laddoo", line2: "Good boy, always" },
  "together-edition": { coat: "tuxedo", base: "oak", name: "Maya & Coco" },
  "forever-in-our-hearts-edition": { coat: "golden", base: "ivory", name: "Simba", line2: "2011 · 2024" },
};

export default async function EditionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = await getProductBySlug(slug);
  if (!p) notFound();
  const reviews = await getPublishedReviews({ productId: p.id });
  const renders = RENDER_FOR[p.slug] ?? { main: "/renders/forever.webp", alt: "/renders/forever-2.webp" };
  const demo = DEMO[p.slug] ?? DEMO["forever-edition"];
  const avg = reviews.length ? reviews.reduce((a, r) => a + r.rating, 0) / reviews.length : null;

  const ld = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    description: p.description,
    image: [absoluteUrl(renders.main)],
    brand: { "@type": "Brand", name: "Pawsome Memories" },
    url: absoluteUrl(`/editions/${p.slug}`),
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "INR",
      lowPrice: (p.fromPaise / 100).toFixed(0),
      highPrice: (p.toPaise / 100).toFixed(0),
      offerCount: p.variants.length,
      availability: "https://schema.org/MadeToOrder",
    },
    // Only real, published reviews from delivered orders are ever counted.
    ...(avg && reviews.length
      ? { aggregateRating: { "@type": "AggregateRating", ratingValue: avg.toFixed(1), reviewCount: reviews.length } }
      : {}),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <div className="mx-auto max-w-7xl px-4 pb-10 pt-6 sm:px-6 lg:px-8">
        <nav className="text-sm text-ink-mute" aria-label="Breadcrumb">
          <Link href="/editions" className="hover:text-ink">
            Editions
          </Link>{" "}
          / <span className="text-ink-soft">{p.name}</span>
        </nav>

        <div className="mt-6 grid gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="lg:sticky lg:top-24 lg:self-start">
            <ProductGallery
              images={[renders.main, renders.alt]}
              figure={p.renderKey as FigureKey}
              coat={demo.coat}
              base={demo.base}
              engraving={demo.name}
              line2={demo.line2}
              name={p.name}
              memorial={p.isMemorial}
            />
          </div>

          <div>
            <p className="eyebrow">{p.isMemorial ? "Memorial keepsake" : "Personalised keepsake"}</p>
            <h1 className="mt-3 text-4xl leading-tight sm:text-5xl">{p.name}</h1>
            <p className="mt-3 font-display text-xl italic text-ink-soft">{p.tagline}</p>
            <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2">
              <p className="font-display text-3xl">
                {formatINR(p.fromPaise)}
                {p.toPaise !== p.fromPaise && <span className="text-ink-mute"> – {formatINR(p.toPaise)}</span>}
              </p>
              {avg ? (
                <span className="flex items-center gap-2 text-sm text-ink-soft">
                  <Stars n={Math.round(avg)} /> {reviews.length} verified review{reviews.length === 1 ? "" : "s"}
                </span>
              ) : null}
            </div>
            <p className="mt-6 leading-relaxed text-ink-soft">{p.description}</p>

            <Link href={`/create?edition=${p.slug}`} className="btn btn-primary mt-8 h-13 w-full text-base sm:w-auto sm:px-10">
              Customise yours
            </Link>
            <p className="mt-3 text-sm text-ink-mute">You&apos;ll approve a design preview before we make anything.</p>

            <section className="mt-12" aria-labelledby="sizes">
              <h2 id="sizes" className="text-2xl">
                Sizes
              </h2>
              <ul className="mt-4 divide-y divide-line rounded-2xl bg-paper shadow-[0_0_0_1px_var(--color-line)]">
                {p.variants.map((v) => (
                  <li key={v.id} className="flex items-start justify-between gap-4 p-4 sm:p-5">
                    <div>
                      <p className="font-medium">{v.name}</p>
                      {v.description && <p className="mt-0.5 text-sm text-ink-mute">{v.description}</p>}
                    </div>
                    <p className="font-display text-lg">{formatINR(v.pricePaise)}</p>
                  </li>
                ))}
              </ul>
            </section>

            <section className="mt-10" aria-labelledby="personalise">
              <h2 id="personalise" className="text-2xl">
                Personalisation
              </h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <OptionBlock title={p.includesOwner ? "Your moment together" : "Pose"} items={p.poses} />
                <OptionBlock title="Base" items={p.bases} />
              </div>
              <p className="mt-4 text-sm text-ink-soft">
                Plus: engraved name{p.slug !== "personality-edition" ? ", a personal message" : ""}
                {p.isMemorial ? ", a meaningful date" : ", an optional date"}, and any special instructions for our artist.
              </p>
            </section>

            <section className="mt-10" aria-labelledby="included">
              <h2 id="included" className="text-2xl">
                What&apos;s included
              </h2>
              <ul className="mt-4 space-y-2.5 text-ink-soft">
                {p.includes.map((i) => (
                  <li key={i} className="flex gap-3">
                    <svg width="18" height="18" viewBox="0 0 16 16" className="mt-0.5 shrink-0 text-sage" aria-hidden>
                      <path d="M3 8.5 6.5 12 13 4.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {i}
                  </li>
                ))}
              </ul>
            </section>

            <section className="mt-10 rounded-2xl bg-sand/70 p-6" aria-labelledby="timing">
              <h2 id="timing" className="text-2xl">
                Making &amp; delivery
              </h2>
              <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-ink-mute">First design preview</dt>
                  <dd className="mt-1 font-medium">Within 3–5 working days</dd>
                </div>
                <div>
                  <dt className="text-ink-mute">After you approve</dt>
                  <dd className="mt-1 font-medium">
                    Delivered in about {p.leadTimeMinDays}–{p.leadTimeMaxDays} days
                  </dd>
                </div>
                <div>
                  <dt className="text-ink-mute">How it&apos;s made</dt>
                  <dd className="mt-1">3D printed in fine resin by our production partner, then hand-painted and sealed by our artists.</dd>
                </div>
                <div>
                  <dt className="text-ink-mute">Shipping</dt>
                  <dd className="mt-1">Tracked delivery across India, in a protective gift box.</dd>
                </div>
              </dl>
            </section>

            <section className="mt-10">
              <p className="font-display text-lg italic leading-relaxed text-ink-soft">{p.story}</p>
            </section>
          </div>
        </div>
      </div>

      <section className="bg-sand/45">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <h2 className="text-3xl">How your {p.name} is made</h2>
          <ol className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s) => (
              <li key={s.n}>
                <span className="font-display text-3xl text-clay-soft">{s.n}</span>
                <p className="mt-2 font-medium">{s.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-ink-soft">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8" aria-labelledby="reviews">
        <h2 id="reviews" className="text-3xl">
          Reviews
        </h2>
        <p className="mt-2 text-sm text-ink-mute">Only customers who received a {p.name} can leave a review.</p>
        <div className="mt-8">
          <ReviewList
            reviews={reviews}
            emptyTitle="No reviews yet"
            emptyBody={`We only show reviews from customers who've received their ${p.name}. As a new studio, we're still waiting on our first ones, and we won't fill this space with made-up praise.`}
          />
        </div>
      </section>

      {/* Sticky mobile CTA */}
      <div className="sticky bottom-0 z-30 border-t border-line bg-ivory/95 p-3 backdrop-blur lg:hidden">
        <Link href={`/create?edition=${p.slug}`} className="btn btn-primary w-full">
          Customise yours · from {formatINR(p.fromPaise)}
        </Link>
      </div>
    </>
  );
}

function OptionBlock({ title, items }: { title: string; items: { id: string; label: string; description: string; priceDeltaPaise: number }[] }) {
  return (
    <div className="rounded-2xl bg-paper p-5 shadow-[0_0_0_1px_var(--color-line)]">
      <p className="text-sm font-medium text-ink-mute">{title}</p>
      <ul className="mt-3 space-y-2 text-sm">
        {items.map((o) => (
          <li key={o.id} className="flex justify-between gap-3">
            <span>{o.label}</span>
            {o.priceDeltaPaise > 0 && <span className="text-ink-mute">+{formatINR(o.priceDeltaPaise)}</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}
