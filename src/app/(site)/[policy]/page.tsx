import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSettings } from "@/lib/catalog";

/**
 * Plain-language policies. These are sensible starting points for a small Indian
 * D2C studio — have them reviewed by a lawyer before launch.
 */
const POLICIES: Record<string, { title: string; body: (email: string) => React.ReactNode }> = {
  privacy: {
    title: "Privacy",
    body: (email) => (
      <>
        <p>We make keepsakes from some of the most personal things people own: photos and memories of a loved pet. We treat them that way.</p>
        <h2>What we collect</h2>
        <ul>
          <li>Your name, email, phone number and delivery address, to make and deliver your order.</li>
          <li>The photos, stories and preferences you share, so our artists can design your keepsake.</li>
          <li>Anything you add to a memory page (photos, videos, voice recordings, text).</li>
          <li>Payment confirmations from Razorpay. We never see or store your card or UPI details.</li>
        </ul>
        <h2>How we protect it</h2>
        <ul>
          <li>Photos and media are stored in private storage, never in a public folder or bucket. Every file request is checked against who is asking.</li>
          <li>Location and camera data embedded in photos is stripped from every version shown in a browser. The untouched original is kept only for our artists.</li>
          <li>Memory pages are private by default, excluded from search engines, and reachable only by a long random link if you choose to share.</li>
        </ul>
        <h2>Who sees it</h2>
        <p>
          You, our studio team, and, for production only, our 3D printing and painting partners, who receive the approved design, not your account details. We
          never sell your data and never use your photos in marketing without your written permission.
        </p>
        <h2>Your choices</h2>
        <p>
          You can delete a memory page yourself at any time. To delete your account and order photos, email <a href={`mailto:${email}`}>{email}</a>. We keep
          basic order and payment records for as long as Indian tax law requires.
        </p>
      </>
    ),
  },
  terms: {
    title: "Terms",
    body: (email) => (
      <>
        <p>By placing an order you agree to these terms. They&apos;re written to be read.</p>
        <h2>Made to order</h2>
        <p>Every keepsake is made for you from your photos. A real artist designs it and we send you a preview. Production starts only after you approve it.</p>
        <h2>Likeness</h2>
        <p>
          Figurines are stylised, hand-painted miniatures. We work hard to capture your pet, and you can request revisions before approving. Small variations in
          paint and finish are part of handmade work. Images on our website are illustrative studio renders unless clearly marked otherwise.
        </p>
        <h2>Your photos</h2>
        <p>You confirm you have the right to share the photos you upload. You keep all rights to them; you give us permission to use them only to make your order.</p>
        <h2>Prices & payment</h2>
        <p>Prices are in Indian rupees and include applicable taxes unless stated. Your order price is fixed when you place it.</p>
        <h2>Contact</h2>
        <p>
          <a href={`mailto:${email}`}>{email}</a>
        </p>
      </>
    ),
  },
  "shipping-and-returns": {
    title: "Shipping & returns",
    body: (email) => (
      <>
        <h2>Timelines</h2>
        <p>
          Your first design preview usually arrives within 3–5 working days. After you approve it, each edition page shows how long making and delivery take,
          typically 10–25 days depending on the edition.
        </p>
        <h2>Shipping</h2>
        <p>We ship across India with tracked courier in protective packaging. Tracking appears on your order page as soon as it ships.</p>
        <h2>Cancellations & refunds</h2>
        <ul>
          <li>Before you approve your design: cancel any time for a full refund.</li>
          <li>After approval: because materials and artist time are committed to a one-of-a-kind piece, we can&apos;t accept returns for change of mind.</li>
          <li>Arrived damaged? Send us a photo within 48 hours of delivery and we&apos;ll remake it at no cost.</li>
        </ul>
        <p>
          Refunds go back to the original payment method within 5–7 working days. Write to <a href={`mailto:${email}`}>{email}</a> with your order number.
        </p>
      </>
    ),
  },
};

export function generateStaticParams() {
  return Object.keys(POLICIES).map((policy) => ({ policy }));
}
export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ policy: string }> }): Promise<Metadata> {
  const p = POLICIES[(await params).policy];
  return p ? { title: p.title, alternates: { canonical: `/${(await params).policy}` } } : {};
}

export default async function PolicyPage({ params }: { params: Promise<{ policy: string }> }) {
  const p = POLICIES[(await params).policy];
  if (!p) notFound();
  const { contactEmail } = await getSettings();
  return (
    <article className="prose-warm mx-auto max-w-2xl px-4 pb-24 pt-10 sm:px-6">
      <h1 className="text-5xl">{p.title}</h1>
      <div className="mt-8 [&_a]:underline">{p.body(contactEmail)}</div>
    </article>
  );
}
