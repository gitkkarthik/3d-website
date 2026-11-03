import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Faq, faqJsonLd } from "@/components/site/Faq";
import { EditionCard } from "@/components/site/EditionCard";
import { getProducts } from "@/lib/catalog";
import { FAQS } from "@/lib/content";

export const revalidate = 300;

/** SEO landing pages for the searches people actually make. */
const PAGES: Record<string, { title: string; h1: [string, string]; intro: string; img: string; seoTitle: string; seoDescription: string; points: string[]; editions: string[]; faqs: number[] }> = {
  "custom-dog-figurine": {
    title: "Custom dog figurines",
    h1: ["A personalised dog figurine that's", "unmistakably them."],
    intro: "From Indies with one floppy ear to very serious Labradors, we sculpt your dog from your photos, hand-paint their exact colours, and engrave their name on the base. You approve the design before anything is made.",
    img: "/renders/forever.webp",
    seoTitle: "Custom Dog Figurine India | Personalised Dog Miniature from Photos",
    seoDescription: "Personalised dog figurines made in India from your photos. Hand-painted 3D printed miniatures of your dog with their name engraved. Approve the design first. From ₹999.",
    points: ["Every breed, including Indies and mixed breeds", "Their markings, ear shape and expression", "Their favourite toy or signature pose", "Name engraved on a wood or stone-finish base"],
    editions: ["personality-edition", "forever-edition", "together-edition"],
    faqs: [0, 1, 2, 3],
  },
  "custom-cat-figurine": {
    title: "Custom cat miniatures",
    h1: ["A custom cat miniature,", "loaf and all."],
    intro: "The loaf. The judgemental stare. The one paw tucked just so. Send us photos of your cat and tell us what they're like. We'll sculpt, paint and engrave a miniature that captures their whole attitude.",
    img: "/renders/cat-tabby.webp",
    seoTitle: "Custom Cat Miniature India | Personalised Cat Figurine from Photos",
    seoDescription: "A personalised cat figurine sculpted from your photos and hand-painted, with your cat's name engraved. 3D printed pet figurines made in India. Approve before we make it.",
    points: ["Tabbies, calicos, Persians and Indie cats", "Sitting, loafing or curled up asleep", "Hand-painted to match their coat", "A keepsake that fits on a bookshelf"],
    editions: ["personality-edition", "forever-edition", "forever-in-our-hearts-edition"],
    faqs: [0, 1, 4, 3],
  },
  "pet-memorial-gifts": {
    title: "Pet memorial gifts",
    h1: ["For the ones who are", "always with us."],
    intro: "A gentle, personalised memorial figurine of the pet you miss, made slowly and carefully from the photos you have, with their name, a date that matters and your words. A private memory page holds their photos, videos and voice.",
    img: "/renders/memorial.webp",
    seoTitle: "Pet Memorial Gifts India | Personalised Memorial Pet Figurine",
    seoDescription: "Personalised pet memorial gifts made in India: a hand-painted figurine of your dog or cat with their name, dates and message, plus a private memory page. Unlimited gentle revisions.",
    points: ["One artist with you throughout", "Unlimited gentle revisions until it feels right", "Name, meaningful date and message", "Private memory page for photos, videos and voice"],
    editions: ["forever-in-our-hearts-edition", "forever-edition"],
    faqs: [8, 2, 5, 6],
  },
  "personalised-pet-gifts": {
    title: "Personalised pet gifts",
    h1: ["The most personal gift", "for a pet lover."],
    intro: "For birthdays, gotcha days, anniversaries or just because. Gift someone a hand-painted miniature of their pet, sculpted from photos, in a premium gift box with no prices inside.",
    img: "/renders/together.webp",
    seoTitle: "Personalised Pet Gifts India | Custom Pet Figurine Gift",
    seoDescription: "Personalised pet gifts made in India: 3D printed, hand-painted figurines of their dog or cat, or of them together. Gift boxed, tracked delivery across India.",
    points: ["Gift-boxed with no prices inside", "Add a gift card message", "Pet-and-owner Together Edition", "Tracked delivery across India"],
    editions: ["together-edition", "forever-edition", "personality-edition"],
    faqs: [0, 3, 7, 6],
  },
};

export function generateStaticParams() {
  return Object.keys(PAGES).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const p = PAGES[(await params).slug];
  if (!p) return {};
  return { title: p.seoTitle, description: p.seoDescription, alternates: { canonical: `/gifts/${(await params).slug}` }, openGraph: { title: p.seoTitle, description: p.seoDescription, images: [{ url: p.img }] } };
}

export default async function GiftLanding({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = PAGES[slug];
  if (!p) notFound();
  const products = (await getProducts()).filter((x) => p.editions.includes(x.slug));
  const faqs = p.faqs.map((i) => FAQS[i]).filter(Boolean);
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd(faqs)) }} />
      <section className="mx-auto grid max-w-7xl items-center gap-10 px-4 pb-16 pt-8 sm:px-6 lg:grid-cols-2 lg:px-8">
        <div>
          <p className="eyebrow">{p.title}</p>
          <h1 className="mt-4 text-[2.5rem] leading-[1.06] sm:text-6xl">
            {p.h1[0]} <em className="italic-soft text-clay">{p.h1[1]}</em>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-soft">{p.intro}</p>
          <ul className="mt-6 space-y-2 text-ink-soft">
            {p.points.map((t) => (
              <li key={t} className="flex gap-3">
                <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-clay" aria-hidden />
                {t}
              </li>
            ))}
          </ul>
          <Link href={`/create${slug === "pet-memorial-gifts" ? "?edition=forever-in-our-hearts-edition" : ""}`} className="btn btn-primary mt-8 h-13 px-8 text-base">
            Start with their story
          </Link>
        </div>
        <div className="relative aspect-square overflow-hidden rounded-[2rem] bg-sand">
          <Image src={p.img} alt={`${p.title}: illustrative render`} fill priority sizes="(min-width:1024px) 50vw, 100vw" className="object-contain p-8" />
          <span className="render-tag absolute left-4 top-4">Illustrative studio render</span>
        </div>
      </section>
      <section className="bg-sand/45">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl">Editions to consider</h2>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((x) => (
              <EditionCard key={x.id} p={x} />
            ))}
          </div>
        </div>
      </section>
      <section className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_2fr] lg:px-8">
        <h2 className="text-3xl sm:text-4xl">Questions</h2>
        <Faq items={faqs} />
      </section>
    </>
  );
}
