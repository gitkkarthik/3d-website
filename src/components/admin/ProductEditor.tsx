"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { saveOptionAction, saveProductAction, saveVariantAction, type AdminResult } from "@/app/admin/actions";

type V = { id: string; name: string; description: string; pricePaise: number; active: boolean };
type O = { id: string; kind: "POSE" | "BASE"; label: string; description: string; priceDeltaPaise: number; active: boolean };
type P = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  story: string;
  includes: string[];
  leadTimeMinDays: number;
  leadTimeMaxDays: number;
  active: boolean;
  includesMemoryPage: boolean;
  seoTitle: string | null;
  seoDescription: string | null;
};

function Msg({ r }: { r: AdminResult | null }) {
  if (!r) return null;
  return <span className={`text-sm ${r.ok ? "text-sage" : "text-[#a3402c]"}`}>{r.ok ? (r.message ?? "Saved") : r.error}</span>;
}

export function ProductEditor({ product, variants, options }: { product: P; variants: V[]; options: O[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [r, setR] = useState<AdminResult | null>(null);
  const [f, setF] = useState({
    name: product.name,
    tagline: product.tagline,
    description: product.description,
    story: product.story,
    includes: product.includes.join("\n"),
    leadTimeMinDays: String(product.leadTimeMinDays),
    leadTimeMaxDays: String(product.leadTimeMaxDays),
    active: product.active,
    includesMemoryPage: product.includesMemoryPage,
    seoTitle: product.seoTitle ?? "",
    seoDescription: product.seoDescription ?? "",
  });

  return (
    <details className="card group overflow-hidden" open={false}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 [&::-webkit-details-marker]:hidden">
        <span>
          <span className="font-display text-xl">{product.name}</span>
          <span className="ml-2 text-sm text-ink-mute">/editions/{product.slug}</span>
          {!product.active && <span className="chip ml-2">Hidden</span>}
        </span>
        <span className="text-sm text-ink-soft group-open:hidden">Edit</span>
      </summary>
      <div className="space-y-8 border-t border-line p-5">
        <section>
          <h3 className="font-medium">Sizes & prices</h3>
          <p className="text-sm text-ink-mute">Prices are in rupees. Changing a price never changes orders already placed.</p>
          <div className="mt-3 space-y-2">
            {variants.map((v) => (
              <VariantRow key={v.id} productId={product.id} v={v} />
            ))}
            <VariantRow productId={product.id} />
          </div>
        </section>

        {(["POSE", "BASE"] as const).map((kind) => (
          <section key={kind}>
            <h3 className="font-medium">{kind === "POSE" ? "Poses" : "Bases"}</h3>
            <div className="mt-3 space-y-2">
              {options
                .filter((o) => o.kind === kind)
                .map((o) => (
                  <OptionRow key={o.id} productId={product.id} o={o} kind={kind} />
                ))}
              <OptionRow productId={product.id} kind={kind} />
            </div>
          </section>
        ))}

        <section className="grid gap-3 sm:grid-cols-2">
          <h3 className="font-medium sm:col-span-2">Edition details</h3>
          <L label="Name">
            <input className="input !py-2 text-sm" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
          </L>
          <L label="Tagline">
            <input className="input !py-2 text-sm" value={f.tagline} onChange={(e) => setF({ ...f, tagline: e.target.value })} />
          </L>
          <L label="Description" wide>
            <textarea className="input text-sm" rows={3} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />
          </L>
          <L label="Story paragraph" wide>
            <textarea className="input text-sm" rows={3} value={f.story} onChange={(e) => setF({ ...f, story: e.target.value })} />
          </L>
          <L label="What's included (one per line)" wide>
            <textarea className="input text-sm" rows={5} value={f.includes} onChange={(e) => setF({ ...f, includes: e.target.value })} />
          </L>
          <L label="Delivery after approval: min days">
            <input className="input !py-2 text-sm" inputMode="numeric" value={f.leadTimeMinDays} onChange={(e) => setF({ ...f, leadTimeMinDays: e.target.value })} />
          </L>
          <L label="Max days">
            <input className="input !py-2 text-sm" inputMode="numeric" value={f.leadTimeMaxDays} onChange={(e) => setF({ ...f, leadTimeMaxDays: e.target.value })} />
          </L>
          <L label="SEO title">
            <input className="input !py-2 text-sm" value={f.seoTitle} onChange={(e) => setF({ ...f, seoTitle: e.target.value })} />
          </L>
          <L label="SEO description">
            <input className="input !py-2 text-sm" value={f.seoDescription} onChange={(e) => setF({ ...f, seoDescription: e.target.value })} />
          </L>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={f.active} onChange={(e) => setF({ ...f, active: e.target.checked })} /> Visible in the shop
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={f.includesMemoryPage} onChange={(e) => setF({ ...f, includesMemoryPage: e.target.checked })} /> Includes a memory page
          </label>
          <div className="flex items-center gap-3 sm:col-span-2">
            <button
              type="button"
              className="btn btn-primary btn-sm"
              disabled={pending}
              onClick={() =>
                start(async () => {
                  const res = await saveProductAction(product.id, f);
                  setR(res);
                  if (res.ok) router.refresh();
                })
              }
            >
              Save edition
            </button>
            <Msg r={r} />
          </div>
        </section>
      </div>
    </details>
  );
}

function L({ label, children, wide }: { label: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <label className={`block text-xs text-ink-mute ${wide ? "sm:col-span-2" : ""}`}>
      {label}
      <div className="mt-1 text-ink">{children}</div>
    </label>
  );
}

function VariantRow({ productId, v }: { productId: string; v?: V }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [r, setR] = useState<AdminResult | null>(null);
  const [f, setF] = useState({ name: v?.name ?? "", description: v?.description ?? "", price: v ? String(v.pricePaise / 100) : "", active: v?.active ?? true });
  return (
    <div className={`grid items-center gap-2 rounded-xl p-2 sm:grid-cols-[1.4fr_1.4fr_7rem_auto_auto] ${v ? "bg-sand/40" : "border border-dashed border-oat"}`}>
      <input className="input !py-1.5 text-sm" placeholder={v ? "" : "New size name"} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} aria-label="Size name" />
      <input className="input !py-1.5 text-sm" placeholder="Description" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} aria-label="Size description" />
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-ink-mute">₹</span>
        <input className="input !py-1.5 !pl-7 text-sm" inputMode="decimal" value={f.price} onChange={(e) => setF({ ...f, price: e.target.value })} aria-label="Price in rupees" />
      </div>
      <label className="flex items-center gap-1.5 text-xs">
        <input type="checkbox" checked={f.active} onChange={(e) => setF({ ...f, active: e.target.checked })} /> Active
      </label>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="btn btn-primary btn-sm"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const res = await saveVariantAction(v?.id ?? null, productId, f);
              setR(res);
              if (res.ok) {
                if (!v) setF({ name: "", description: "", price: "", active: true });
                router.refresh();
              }
            })
          }
        >
          {v ? "Save" : "Add"}
        </button>
        <Msg r={r && !r.ok ? r : null} />
      </div>
    </div>
  );
}

function OptionRow({ productId, o, kind }: { productId: string; o?: O; kind: "POSE" | "BASE" }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [r, setR] = useState<AdminResult | null>(null);
  const [f, setF] = useState({ label: o?.label ?? "", description: o?.description ?? "", delta: o ? String(o.priceDeltaPaise / 100) : "", active: o?.active ?? true });
  return (
    <div className={`grid items-center gap-2 rounded-xl p-2 sm:grid-cols-[1.2fr_1.6fr_7rem_auto_auto] ${o ? "bg-sand/40" : "border border-dashed border-oat"}`}>
      <input className="input !py-1.5 text-sm" placeholder={o ? "" : `New ${kind === "POSE" ? "pose" : "base"}`} value={f.label} onChange={(e) => setF({ ...f, label: e.target.value })} aria-label="Label" />
      <input className="input !py-1.5 text-sm" placeholder="Description" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} aria-label="Description" />
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-ink-mute">+₹</span>
        <input className="input !py-1.5 !pl-8 text-sm" inputMode="decimal" value={f.delta} onChange={(e) => setF({ ...f, delta: e.target.value })} aria-label="Extra price in rupees" />
      </div>
      <label className="flex items-center gap-1.5 text-xs">
        <input type="checkbox" checked={f.active} onChange={(e) => setF({ ...f, active: e.target.checked })} /> Active
      </label>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const res = await saveOptionAction(o?.id ?? null, productId, { kind, ...f });
              setR(res);
              if (res.ok) {
                if (!o) setF({ label: "", description: "", delta: "", active: true });
                router.refresh();
              }
            })
          }
        >
          {o ? "Save" : "Add"}
        </button>
        <Msg r={r && !r.ok ? r : null} />
      </div>
    </div>
  );
}
