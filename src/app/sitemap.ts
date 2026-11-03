import type { MetadataRoute } from "next";
import { getProducts } from "@/lib/catalog";
import { absoluteUrl } from "@/lib/site";

export const revalidate = 3600;

// Memory pages, accounts, the wizard's API and the studio are deliberately absent.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let products: { slug: string; updatedAt: Date }[] = [];
  try {
    products = await getProducts();
  } catch {}
  const now = new Date();
  return [
    { url: absoluteUrl("/"), lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: absoluteUrl("/editions"), lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    ...products.map((p) => ({ url: absoluteUrl(`/editions/${p.slug}`), lastModified: p.updatedAt, changeFrequency: "weekly" as const, priority: 0.9 })),
    ...["custom-dog-figurine", "custom-cat-figurine", "pet-memorial-gifts", "personalised-pet-gifts"].map((s) => ({ url: absoluteUrl(`/gifts/${s}`), lastModified: now, changeFrequency: "monthly" as const, priority: 0.8 })),
    { url: absoluteUrl("/create"), lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: absoluteUrl("/memory-pages"), lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    ...["privacy", "terms", "shipping-and-returns"].map((s) => ({ url: absoluteUrl(`/${s}`), lastModified: now, changeFrequency: "yearly" as const, priority: 0.3 })),
  ];
}
