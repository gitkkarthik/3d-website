import "server-only";
import { and, asc, eq, inArray } from "drizzle-orm";
import { db, schema } from "./db";

export type Product = typeof schema.products.$inferSelect;
export type Variant = typeof schema.productVariants.$inferSelect;
export type Option = typeof schema.productOptions.$inferSelect;
export type ProductWithChoices = Product & { variants: Variant[]; poses: Option[]; bases: Option[]; fromPaise: number; toPaise: number };

export async function getProducts({ includeInactive = false } = {}): Promise<ProductWithChoices[]> {
  const products = await db
    .select()
    .from(schema.products)
    .where(includeInactive ? undefined : eq(schema.products.active, true))
    .orderBy(asc(schema.products.sortOrder));
  if (!products.length) return [];
  const ids = products.map((p) => p.id);
  const [variants, options] = await Promise.all([
    db.select().from(schema.productVariants).where(and(inArray(schema.productVariants.productId, ids), includeInactive ? undefined : eq(schema.productVariants.active, true))).orderBy(asc(schema.productVariants.sortOrder)),
    db.select().from(schema.productOptions).where(and(inArray(schema.productOptions.productId, ids), includeInactive ? undefined : eq(schema.productOptions.active, true))).orderBy(asc(schema.productOptions.sortOrder)),
  ]);
  return products.map((p) => {
    const v = variants.filter((x) => x.productId === p.id);
    const activePrices = v.filter((x) => x.active).map((x) => x.pricePaise);
    return {
      ...p,
      variants: v,
      poses: options.filter((o) => o.productId === p.id && o.kind === "POSE"),
      bases: options.filter((o) => o.productId === p.id && o.kind === "BASE"),
      fromPaise: activePrices.length ? Math.min(...activePrices) : 0,
      toPaise: activePrices.length ? Math.max(...activePrices) : 0,
    };
  });
}

export async function getProductBySlug(slug: string) {
  const all = await getProducts();
  return all.find((p) => p.slug === slug) ?? null;
}

/* ── Settings ── */
export type StudioSettings = {
  shippingFeePaise: number;
  freeShippingAbovePaise: number | null;
  contactEmail: string;
  contactWhatsapp: string;
  manualPaymentInstructions: string;
};

const DEFAULT_SETTINGS: StudioSettings = {
  shippingFeePaise: 0,
  freeShippingAbovePaise: null,
  contactEmail: "hello@pawsomememories.in",
  contactWhatsapp: "",
  manualPaymentInstructions:
    "Online payment isn't switched on yet. We'll message you within one working day with a UPI request or bank details. Your order is saved and our artist can begin reviewing your photos.",
};

export async function getSettings(): Promise<StudioSettings> {
  const rows = await db.select().from(schema.settings);
  const out: Record<string, unknown> = { ...DEFAULT_SETTINGS };
  for (const r of rows) out[r.key] = r.value;
  return out as StudioSettings;
}

export async function setSetting<K extends keyof StudioSettings>(key: K, value: StudioSettings[K]) {
  await db
    .insert(schema.settings)
    .values({ key, value: value as never })
    .onConflictDoUpdate({ target: schema.settings.key, set: { value: value as never, updatedAt: new Date() } });
}

export function shippingFor(subtotalPaise: number, s: StudioSettings) {
  if (s.freeShippingAbovePaise != null && subtotalPaise >= s.freeShippingAbovePaise) return 0;
  return s.shippingFeePaise;
}
