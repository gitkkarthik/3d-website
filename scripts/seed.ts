/**
 * Seeds the catalogue (editions, sizes, poses, bases) and default settings.
 * Safe to re-run: existing products (matched by slug) are left untouched so
 * prices edited in the admin are never overwritten.
 */
import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq } from "drizzle-orm";
import { Pool } from "pg";
import * as schema from "../src/lib/db/schema";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });

const r = (rupees: number) => rupees * 100;

type Seed = {
  product: typeof schema.products.$inferInsert;
  variants: { name: string; description: string; price: number }[];
  poses: { label: string; description: string; delta?: number }[];
  bases: { label: string; description: string; delta?: number }[];
};

const commonPoses = [
  { label: "Sitting proudly", description: "Upright and attentive, the classic portrait pose." },
  { label: "Curled up asleep", description: "Their favourite nap position, peaceful and cosy." },
  { label: "With their favourite toy", description: "Mid-play, with a miniature of the toy they love." },
  { label: "Something only they do", description: "Describe their signature pose and we'll sculpt it." },
];

const seeds: Seed[] = [
  {
    product: {
      slug: "personality-edition",
      name: "Personality Edition",
      tagline: "Their quirks, their pose, their name.",
      description:
        "A hand-finished miniature of your pet in their signature pose, on a personalised base engraved with their name. The everyday keepsake for the pet who runs your home.",
      story:
        "Every pet has a thing. The head tilt when you say 'walk'. The way they sleep with one paw over their nose. The Personality Edition is about that thing, captured small enough to sit on your desk and big enough to make you smile every time you look up.",
      includes: [
        "Their real sound engraved as a waveform, with a QR code: scan it and hear them",
        "Hand-painted miniature of your pet",
        "Signature pose or favourite activity",
        "Personalised base engraved with their name",
        "Digital design preview for your approval",
        "Gift-ready keepsake box",
      ],
      leadTimeMinDays: 10,
      leadTimeMaxDays: 14,
      includesMemoryPage: true,
      renderKey: "dog-play",
      sortOrder: 1,
      seoTitle: "Personalised Dog & Cat Figurine | Custom Pet Miniature India",
      seoDescription:
        "A personalised 3D pet figurine sculpted from your photos, hand-painted and engraved with your pet's name. Approve the design before we make it. Made in India, from ₹999.",
    },
    variants: [
      { name: "Petite · about 7 cm tall", description: "Desk-sized and delightful.", price: 999 },
      { name: "Classic · about 10 cm tall", description: "Our most-chosen size, with finer detail.", price: 1499 },
    ],
    poses: commonPoses,
    bases: [
      { label: "Natural oak finish", description: "Warm, light wood tone." },
      { label: "Ivory stone finish", description: "Soft, minimal and calm." },
      { label: "Walnut finish", description: "Deep and rich.", delta: 0 },
    ],
  },
  {
    product: {
      slug: "forever-edition",
      name: "Forever Edition",
      tagline: "Every whisker. Every marking. Forever.",
      description:
        "Our most detailed figurine, sculpted at a larger scale so the markings, the expression and the little imperfections that make your pet them come through. Presented on a premium display base with your personal message, plus a private digital memory page for their photos, videos and voice notes.",
      story:
        "The Forever Edition is for the pet whose face you'd recognise anywhere. Our artists spend the most time here: matching coat colours to your photos, the exact shape of an ear, the patch over one eye. It comes with a private memory page, so the stories, videos and sounds live alongside the keepsake.",
      includes: [
        "Their real sound engraved as a waveform, with a QR code: scan it and hear them",
        "Higher-detail hand-painted figurine",
        "Premium display base",
        "Engraved name and personal message",
        "Private digital memory page (photos, videos, voice)",
        "Up to two rounds of design revisions",
        "Premium gift box with story card",
      ],
      leadTimeMinDays: 14,
      leadTimeMaxDays: 21,
      includesMemoryPage: true,
      renderKey: "dog-sitting",
      sortOrder: 2,
      seoTitle: "Custom 3D Printed Pet Figurine with Memory Page | Forever Edition",
      seoDescription:
        "A high-detail, hand-painted custom pet figurine on a premium base with your message, plus a private digital memory page. Personalised pet gifts made in India.",
    },
    variants: [
      { name: "Classic · about 10 cm tall", description: "Detailed and display-ready.", price: 1999 },
      { name: "Heirloom · about 13 cm tall", description: "More room for markings and expression.", price: 2799 },
      { name: "Grand · about 16 cm tall", description: "A centrepiece, with our finest detail.", price: 3499 },
    ],
    poses: commonPoses,
    bases: [
      { label: "Walnut plinth", description: "Rich wood tone with engraved brass-tone text." },
      { label: "Ivory marble finish", description: "Elegant, light and timeless." },
      { label: "Charcoal slate finish", description: "Modern, makes colours glow." },
    ],
  },
  {
    product: {
      slug: "together-edition",
      name: "Together Edition",
      tagline: "You and them, the way it really is.",
      description:
        "You and your pet, sculpted together in one figurine. Send us photos of both of you and tell us how you are together: the cuddle, the walk, the spot on the sofa. Includes a personalised base and a private digital memory page.",
      story:
        "Some bonds are best shown, not described. The Together Edition captures the two of you (or the whole family) in the pose that feels like home. It's the gift people keep on the bedside table.",
      includes: [
        "Their real sound engraved as a waveform, with a QR code: scan it and hear them",
        "Pet and owner sculpted together",
        "Customised pose that tells your story",
        "Personalised engraved base",
        "Private digital memory page",
        "Up to two rounds of design revisions",
        "Premium gift box",
      ],
      leadTimeMinDays: 18,
      leadTimeMaxDays: 25,
      includesMemoryPage: true,
      includesOwner: true,
      renderKey: "together",
      sortOrder: 3,
      seoTitle: "Pet and Owner Custom Figurine | Personalised Pet Gifts India",
      seoDescription:
        "A custom figurine of you and your pet together, sculpted from your photos and hand-painted. The most personal pet gift, with a private memory page. Made in India.",
    },
    variants: [
      { name: "You & your pet · about 12 cm", description: "One person and one pet.", price: 2499 },
      { name: "You & your pet · about 16 cm", description: "Larger, with more detail in faces and fur.", price: 3499 },
      { name: "Family · up to 2 people & 1 pet", description: "Bring the whole household together.", price: 4999 },
    ],
    poses: [
      { label: "Side by side", description: "Standing or sitting together." },
      { label: "The cuddle", description: "Pet in your arms or on your lap." },
      { label: "Out on a walk", description: "Mid-stride, leash and all." },
      { label: "Describe your moment", description: "Tell us your scene and we'll compose it." },
    ],
    bases: [
      { label: "Natural oak finish", description: "Warm, light wood tone." },
      { label: "Walnut plinth", description: "Rich and classic." },
      { label: "Ivory stone finish", description: "Soft, minimal and calm." },
    ],
  },
  {
    product: {
      slug: "forever-in-our-hearts-edition",
      name: "Forever in Our Hearts Edition",
      tagline: "For the ones who are always with us.",
      description:
        "A gentle memorial keepsake for a pet who has passed. Sculpted from your photos in a peaceful pose, with their name, a meaningful date and your message on the base, and a private memory page to hold their story. We take extra care with these, and there's never any rush.",
      story:
        "Losing a pet is losing family. This edition is made slowly and carefully, with a calm, peaceful pose and soft finish. You'll talk to the same artist throughout, and nothing is made until you feel it's right. Many families choose their pet asleep in their favourite spot.",
      includes: [
        "Their real sound engraved as a waveform, with a QR code: scan it and hear them",
        "Personalised memorial figurine",
        "Peaceful pose of your choosing",
        "Engraved name, meaningful date and message",
        "Private digital memory page",
        "Unlimited gentle revisions until it feels right",
        "Keepsake box with a handwritten card",
      ],
      leadTimeMinDays: 14,
      leadTimeMaxDays: 21,
      includesMemoryPage: true,
      isMemorial: true,
      renderKey: "dog-sleeping",
      sortOrder: 4,
      seoTitle: "Pet Memorial Gifts India | Personalised Memorial Pet Figurine",
      seoDescription:
        "A gentle, personalised memorial figurine of your pet, sculpted from your photos with their name, a meaningful date and your message, plus a private memory page.",
    },
    variants: [
      { name: "Classic · about 10 cm", description: "A quiet, personal keepsake.", price: 1999 },
      { name: "Heirloom · about 13 cm", description: "More detail, on a larger base.", price: 2999 },
      { name: "Heirloom with memorial plinth", description: "Raised plinth with space for a longer message.", price: 3999 },
    ],
    poses: [
      { label: "Peacefully asleep", description: "Curled in their favourite spot." },
      { label: "Sitting, looking up at you", description: "The way they waited for you." },
      { label: "Their happiest moment", description: "Describe it, and we'll sculpt it." },
    ],
    bases: [
      { label: "Ivory stone finish", description: "Soft and serene." },
      { label: "Walnut plinth", description: "Warm and classic." },
      { label: "Charcoal slate finish", description: "Calm and grounded." },
    ],
  },
];

for (const s of seeds) {
  const existing = await db.select().from(schema.products).where(eq(schema.products.slug, s.product.slug!));
  if (existing[0]) {
    console.log(`• ${s.product.slug} exists, skipping`);
    continue;
  }
  const [p] = await db.insert(schema.products).values(s.product).returning();
  await db.insert(schema.productVariants).values(
    s.variants.map((v, i) => ({ productId: p.id, name: v.name, description: v.description, pricePaise: r(v.price), sortOrder: i })),
  );
  await db.insert(schema.productOptions).values([
    ...s.poses.map((o, i) => ({ productId: p.id, kind: "POSE" as const, label: o.label, description: o.description, priceDeltaPaise: r(o.delta ?? 0), sortOrder: i })),
    ...s.bases.map((o, i) => ({ productId: p.id, kind: "BASE" as const, label: o.label, description: o.description, priceDeltaPaise: r(o.delta ?? 0), sortOrder: i })),
  ]);
  console.log(`✓ ${s.product.slug}`);
}

await pool.end();
