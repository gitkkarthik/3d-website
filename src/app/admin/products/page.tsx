import { getProducts } from "@/lib/catalog";
import { ProductEditor } from "@/components/admin/ProductEditor";
import { formatINR } from "@/lib/money";

export default async function AdminProducts() {
  const products = await getProducts({ includeInactive: true });
  return (
    <div>
      <h1 className="text-3xl">Products & pricing</h1>
      <p className="mt-1 text-ink-soft">All prices shown in the shop come from here. Orders keep the price they were placed at.</p>
      <div className="mt-6 space-y-3">
        {products.map((p) => (
          <div key={p.id}>
            <p className="mb-1 px-1 text-xs text-ink-mute">
              {p.variants.filter((v) => v.active).length} active sizes · {formatINR(p.fromPaise)} – {formatINR(p.toPaise)}
            </p>
            <ProductEditor
              product={{ ...p }}
              variants={p.variants.map((v) => ({ id: v.id, name: v.name, description: v.description, pricePaise: v.pricePaise, active: v.active }))}
              options={[...p.poses, ...p.bases].map((o) => ({ id: o.id, kind: o.kind, label: o.label, description: o.description, priceDeltaPaise: o.priceDeltaPaise, active: o.active }))}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
