import type { Metadata } from "next";
import Link from "next/link";
import { EditionCard } from "@/components/site/EditionCard";
import { getProducts } from "@/lib/catalog";
import { formatINR } from "@/lib/money";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Personalised Pet Figurine Editions",
  description:
    "Compare our personalised pet keepsakes: custom dog and cat figurines, pet-and-owner figurines and pet memorial gifts. Sculpted from your photos and hand-painted in India.",
  alternates: { canonical: "/editions" },
};

export default async function EditionsPage() {
  const products = await getProducts();
  return (
    <div className="mx-auto max-w-7xl px-4 pb-24 pt-10 sm:px-6 lg:px-8">
      <header className="max-w-3xl">
        <p className="eyebrow">Our collections</p>
        <h1 className="mt-4 text-5xl leading-tight sm:text-6xl">
          Choose how you&apos;d like <em className="italic-soft">to remember them</em>
        </h1>
        <p className="mt-5 text-lg text-ink-soft">
          Every edition is sculpted from your photos, approved by you, then printed and painted by hand.
        </p>
      </header>

      <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((p, i) => (
          <EditionCard key={p.id} p={p} index={i} />
        ))}
      </div>

      {/* Comparison */}
      <section className="mt-24" aria-labelledby="compare">
        <h2 id="compare" className="text-3xl sm:text-4xl">
          Side by side
        </h2>
        <div className="mt-8 overflow-x-auto rounded-[1.25rem] shadow-[0_0_0_1px_var(--color-line)]">
          <table className="w-full min-w-[720px] border-collapse bg-paper text-left text-sm">
            <thead>
              <tr className="border-b border-line">
                <th className="p-5 font-medium text-ink-mute">&nbsp;</th>
                {products.map((p) => (
                  <th key={p.id} className="p-5 align-bottom">
                    <span className="font-display text-lg font-normal">{p.name}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="text-ink-soft">
              <Row label="Price" cells={products.map((p) => `${formatINR(p.fromPaise)} – ${formatINR(p.toPaise)}`)} />
              <Row label="Sizes" cells={products.map((p) => `${p.variants.length} options`)} />
              <Row label="Pet & owner together" cells={products.map((p) => (p.includesOwner ? "Yes" : "–"))} />
              <Row label="Personal message" cells={products.map((p) => (p.slug === "personality-edition" ? "Name only" : "Yes"))} />
              <Row label="Digital memory page" cells={products.map((p) => (p.includesMemoryPage ? "Included" : "–"))} />
              <Row label="Design approval before making" cells={products.map(() => "Always")} />
              <Row label="Delivered after approval" cells={products.map((p) => `${p.leadTimeMinDays}–${p.leadTimeMaxDays} days`)} />
            </tbody>
          </table>
        </div>
        <div className="mt-10 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
          <Link href="/create" className="btn btn-primary">
            Start with your pet&apos;s story
          </Link>
          <p className="text-sm text-ink-mute">You can choose the edition after telling us about them.</p>
        </div>
      </section>
    </div>
  );
}

function Row({ label, cells }: { label: string; cells: string[] }) {
  return (
    <tr className="border-b border-line last:border-0">
      <th scope="row" className="p-5 font-medium text-ink">
        {label}
      </th>
      {cells.map((c, i) => (
        <td key={i} className="p-5">
          {c}
        </td>
      ))}
    </tr>
  );
}
