import type { Metadata } from "next";
import { CreateWizard } from "@/components/wizard/CreateWizard";
import type { WizardProduct } from "@/components/wizard/types";
import { getCurrentUser } from "@/lib/auth";
import { getProducts, getSettings } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Create your pet keepsake",
  description: "Share your pet's photos and story, choose an edition, and personalise your keepsake. You'll approve the design before we make it.",
  alternates: { canonical: "/create" },
};

export default async function CreatePage({ searchParams }: { searchParams: Promise<{ edition?: string; name?: string }> }) {
  const sp = await searchParams;
  const [products, settings, user] = await Promise.all([getProducts(), getSettings(), getCurrentUser()]);
  const wizardProducts: WizardProduct[] = products.map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    tagline: p.tagline,
    includes: p.includes,
    includesMemoryPage: p.includesMemoryPage,
    includesOwner: p.includesOwner,
    isMemorial: p.isMemorial,
    renderKey: p.renderKey,
    leadTimeMinDays: p.leadTimeMinDays,
    leadTimeMaxDays: p.leadTimeMaxDays,
    fromPaise: p.fromPaise,
    toPaise: p.toPaise,
    variants: p.variants.map(({ id, name, description, pricePaise }) => ({ id, name, description, pricePaise })),
    poses: p.poses.map(({ id, label, description, priceDeltaPaise }) => ({ id, label, description, priceDeltaPaise })),
    bases: p.bases.map(({ id, label, description, priceDeltaPaise }) => ({ id, label, description, priceDeltaPaise })),
  }));
  const edition = products.some((p) => p.slug === sp.edition) ? sp.edition : undefined;
  return (
    <CreateWizard
      products={wizardProducts}
      settings={{ shippingFeePaise: settings.shippingFeePaise, freeShippingAbovePaise: settings.freeShippingAbovePaise }}
      user={user ? { name: user.name, phone: user.phone } : null}
      initialEdition={edition}
      initialName={sp.name?.slice(0, 40)}
    />
  );
}
