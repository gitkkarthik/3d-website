"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { adminDeleteMemoryAction, adminSetMemoryVisibilityAction, moderateReviewAction, saveSettingsAction, type AdminResult } from "@/app/admin/actions";

export function ReviewControls({ id, status, featured }: { id: string; status: "PENDING" | "PUBLISHED" | "HIDDEN"; featured: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const go = (s: typeof status, f: boolean) =>
    start(async () => {
      await moderateReviewAction(id, s, f);
      router.refresh();
    });
  return (
    <div className="flex flex-wrap gap-2">
      {status !== "PUBLISHED" && (
        <button className="btn btn-primary btn-sm" disabled={pending} onClick={() => go("PUBLISHED", false)}>
          Publish
        </button>
      )}
      {status === "PUBLISHED" && (
        <button className="btn btn-ghost btn-sm" disabled={pending} onClick={() => go("PUBLISHED", !featured)}>
          {featured ? "Unfeature" : "Feature on home"}
        </button>
      )}
      {status !== "HIDDEN" && (
        <button className="btn btn-ghost btn-sm" disabled={pending} onClick={() => go("HIDDEN", false)}>
          Hide
        </button>
      )}
    </div>
  );
}

export function MemoryControls({ id, visibility, petName }: { id: string; visibility: "PRIVATE" | "LINK"; petName: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [r, setR] = useState<AdminResult | null>(null);
  return (
    <div className="flex flex-wrap items-center gap-2">
      {visibility === "LINK" && (
        <button
          className="btn btn-ghost btn-sm"
          disabled={pending}
          onClick={() =>
            start(async () => {
              setR(await adminSetMemoryVisibilityAction(id, "PRIVATE"));
              router.refresh();
            })
          }
        >
          Make private
        </button>
      )}
      <button
        className="btn btn-sm bg-[#a3402c] text-white"
        disabled={pending}
        onClick={() => {
          if (!confirm(`Permanently delete ${petName}'s memory page and all its files? Only do this at the customer's request.`)) return;
          start(async () => {
            setR(await adminDeleteMemoryAction(id));
            router.refresh();
          });
        }}
      >
        Delete permanently
      </button>
      {r && <span className={`text-xs ${r.ok ? "text-sage" : "text-[#a3402c]"}`}>{r.ok ? r.message : r.error}</span>}
    </div>
  );
}

export function SettingsForm({ initial }: { initial: { shippingFee: string; freeAbove: string; contactEmail: string; contactWhatsapp: string; manualPaymentInstructions: string } }) {
  const router = useRouter();
  const [f, setF] = useState(initial);
  const [pending, start] = useTransition();
  const [r, setR] = useState<AdminResult | null>(null);
  return (
    <form
      className="card grid max-w-2xl gap-4 p-6"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const res = await saveSettingsAction(f);
          setR(res);
          if (res.ok) router.refresh();
        });
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm">
          <span className="field-label">Shipping fee (₹)</span>
          <input className="input" inputMode="decimal" value={f.shippingFee} onChange={(e) => setF({ ...f, shippingFee: e.target.value })} />
          <span className="field-hint">0 for free shipping</span>
        </label>
        <label className="text-sm">
          <span className="field-label">Free shipping above (₹)</span>
          <input className="input" inputMode="decimal" value={f.freeAbove} onChange={(e) => setF({ ...f, freeAbove: e.target.value })} />
          <span className="field-hint">Leave blank to disable</span>
        </label>
        <label className="text-sm">
          <span className="field-label">Contact email</span>
          <input className="input" type="email" value={f.contactEmail} onChange={(e) => setF({ ...f, contactEmail: e.target.value })} />
        </label>
        <label className="text-sm">
          <span className="field-label">WhatsApp number</span>
          <input className="input" value={f.contactWhatsapp} onChange={(e) => setF({ ...f, contactWhatsapp: e.target.value })} />
        </label>
      </div>
      <label className="text-sm">
        <span className="field-label">Payment instructions (shown when online payment is off)</span>
        <textarea className="input" rows={4} value={f.manualPaymentInstructions} onChange={(e) => setF({ ...f, manualPaymentInstructions: e.target.value })} />
      </label>
      <div className="flex items-center gap-3">
        <button className="btn btn-primary btn-sm" disabled={pending}>
          Save settings
        </button>
        {r && <span className={`text-sm ${r.ok ? "text-sage" : "text-[#a3402c]"}`}>{r.ok ? r.message : r.error}</span>}
      </div>
    </form>
  );
}
