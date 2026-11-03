import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { db, schema } from "./db";

export type PublicReview = {
  id: string;
  rating: number;
  title: string | null;
  body: string;
  displayName: string;
  petName: string | null;
  city: string | null;
  productName: string;
  createdAt: Date;
};

/** Only reviews written by customers on delivered orders AND published by the studio. */
export async function getPublishedReviews(opts: { productId?: string; featuredOnly?: boolean; limit?: number } = {}): Promise<PublicReview[]> {
  const rows = await db
    .select({
      id: schema.reviews.id,
      rating: schema.reviews.rating,
      title: schema.reviews.title,
      body: schema.reviews.body,
      displayName: schema.reviews.displayName,
      petName: schema.reviews.petName,
      city: schema.reviews.city,
      productName: schema.products.name,
      createdAt: schema.reviews.createdAt,
    })
    .from(schema.reviews)
    .innerJoin(schema.products, eq(schema.products.id, schema.reviews.productId))
    .where(
      and(
        eq(schema.reviews.status, "PUBLISHED"),
        opts.productId ? eq(schema.reviews.productId, opts.productId) : undefined,
        opts.featuredOnly ? eq(schema.reviews.featured, true) : undefined,
      ),
    )
    .orderBy(desc(schema.reviews.featured), desc(schema.reviews.createdAt))
    .limit(opts.limit ?? 12);
  return rows;
}
