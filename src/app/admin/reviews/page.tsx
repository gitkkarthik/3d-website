import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { Stars } from "@/components/site/Reviews";
import { ReviewControls } from "@/components/admin/SmallActions";

export default async function AdminReviews() {
  const rows = await db
    .select({ r: schema.reviews, product: schema.products.name, number: schema.orders.number })
    .from(schema.reviews)
    .innerJoin(schema.products, eq(schema.products.id, schema.reviews.productId))
    .innerJoin(schema.orders, eq(schema.orders.id, schema.reviews.orderId))
    .orderBy(desc(schema.reviews.createdAt));
  return (
    <div>
      <h1 className="text-3xl">Reviews</h1>
      <p className="mt-1 text-ink-soft">Reviews can only be written by customers on delivered orders. Publish, feature or hide them; text is never edited.</p>
      {rows.length === 0 ? (
        <div className="card mt-6 p-10 text-center text-ink-soft">No reviews yet. Customers are invited to review once an order is delivered.</div>
      ) : (
        <ul className="mt-6 space-y-3">
          {rows.map(({ r, product, number }) => (
            <li key={r.id} className="card p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <Stars n={r.rating} />
                  <span className={`chip ${r.status === "PUBLISHED" ? "!bg-sage-soft !text-sage" : r.status === "PENDING" ? "!bg-[#f6e6d9] !text-clay" : ""}`}>{r.status.toLowerCase()}</span>
                  {r.featured && <span className="chip">featured</span>}
                </div>
                <Link href={`/admin/orders/${r.orderId}`} className="text-sm text-ink-mute underline">{number} · {product}</Link>
              </div>
              {r.title && <p className="mt-3 font-display text-lg">{r.title}</p>}
              <p className="mt-1 text-ink-soft">{r.body}</p>
              <p className="mt-2 text-sm text-ink-mute">{r.displayName}{r.city ? `, ${r.city}` : ""} · {r.createdAt.toLocaleDateString("en-IN")}</p>
              <div className="mt-4"><ReviewControls id={r.id} status={r.status} featured={r.featured} /></div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
