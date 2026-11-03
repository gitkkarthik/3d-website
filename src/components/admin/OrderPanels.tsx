"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import {
  addNoteAction,
  cancelAction,
  recordDecisionAction,
  recordPaymentAction,
  saveCostsAction,
  saveShippingAction,
  sendPreviewAction,
  transitionAction,
  type AdminResult,
} from "@/app/admin/actions";
import { uploadOne } from "@/components/wizard/PhotoUploader";

function useAction() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [res, setRes] = useState<AdminResult | null>(null);
  const run = (fn: () => Promise<AdminResult>, after?: () => void) =>
    start(async () => {
      const r = await fn();
      setRes(r);
      if (r.ok) {
        after?.();
        router.refresh();
      }
    });
  const msg = res ? <p className={`mt-2 text-sm ${res.ok ? "text-sage" : "text-[#a3402c]"}`} role={res.ok ? "status" : "alert"}>{res.ok ? (res.message ?? "Saved.") : res.error}</p> : null;
  return { pending, run, msg };
}

export function Panel({ title, children, tone }: { title: string; children: React.ReactNode; tone?: "warn" }) {
  return (
    <section className={`rounded-[1.25rem] p-5 ${tone === "warn" ? "bg-[#fbeee6] shadow-[0_0_0_1px_#efd3c3]" : "bg-paper shadow-[0_0_0_1px_var(--color-line)]"}`}>
      <h2 className="font-display text-lg">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

export function StatusControl({ orderId, options }: { orderId: string; options: { value: string; label: string; blocked?: string }[] }) {
  const { pending, run, msg } = useAction();
  const [to, setTo] = useState(options.find((o) => !o.blocked)?.value ?? "");
  const [note, setNote] = useState("");
  if (!options.length) return <p className="text-sm text-ink-mute">No manual moves from here. Use the preview & approval tools.</p>;
  const sel = options.find((o) => o.value === to);
  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-2 sm:flex-row">
        <select className="input !py-2 text-sm" value={to} onChange={(e) => setTo(e.target.value)} aria-label="Next status">
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
              {o.blocked ? " (blocked)" : ""}
            </option>
          ))}
        </select>
        <button type="button" className="btn btn-primary btn-sm shrink-0" disabled={pending || !!sel?.blocked} onClick={() => run(() => transitionAction(orderId, to, note), () => setNote(""))}>
          {pending ? "Updating…" : "Move"}
        </button>
      </div>
      {sel?.blocked && <p className="text-sm text-clay">{sel.blocked}</p>}
      <input className="input !py-2 text-sm" placeholder="Note shown to customer (optional)" value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} />
      {msg}
    </div>
  );
}

export function PreviewSender({ orderId, canSend }: { orderId: string; canSend: boolean }) {
  const { pending, run, msg } = useAction();
  const input = useRef<HTMLInputElement>(null);
  const [ids, setIds] = useState<{ id: string; preview: string }[]>([]);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  if (!canSend) return <p className="text-sm text-ink-mute">Previews can be sent while photos are under review or the design is in progress.</p>;
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {ids.map((p) => (
          <div key={p.id} className="relative h-20 w-20 overflow-hidden rounded-lg bg-sand">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.preview} alt="" className="h-full w-full object-cover" />
            <button type="button" className="absolute right-1 top-1 rounded bg-paper/90 px-1 text-xs" onClick={() => setIds((x) => x.filter((y) => y.id !== p.id))} aria-label="Remove">
              ✕
            </button>
          </div>
        ))}
        <button type="button" className="h-20 w-20 rounded-lg border-[1.5px] border-dashed border-oat text-xs text-ink-soft" onClick={() => input.current?.click()} disabled={busy}>
          {busy ? "Uploading…" : "+ Render"}
        </button>
        <input
          ref={input}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="sr-only"
          onChange={async (e) => {
            const files = Array.from(e.target.files ?? []);
            e.target.value = "";
            setBusy(true);
            setErr(null);
            for (const f of files) {
              try {
                const u = await uploadOne(f, "PREVIEW", () => {}, { orderId });
                setIds((x) => [...x, { id: u.id, preview: URL.createObjectURL(f) }]);
              } catch (er) {
                setErr((er as Error).message);
              }
            }
            setBusy(false);
          }}
        />
      </div>
      <textarea className="input text-sm" rows={2} placeholder="Note from the artist to the customer (optional)" value={note} onChange={(e) => setNote(e.target.value)} maxLength={1000} />
      {err && <p className="text-sm text-[#a3402c]">{err}</p>}
      <button
        type="button"
        className="btn btn-clay btn-sm"
        disabled={pending || !ids.length || busy}
        onClick={() =>
          run(
            () => sendPreviewAction(orderId, ids.map((x) => x.id), note),
            () => {
              setIds([]);
              setNote("");
            },
          )
        }
      >
        {pending ? "Sending…" : `Send preview to customer`}
      </button>
      {msg}
    </div>
  );
}

export function RecordDecision({ orderId, previewId, version }: { orderId: string; previewId: string; version: number }) {
  const { pending, run, msg } = useAction();
  const [note, setNote] = useState("");
  return (
    <div className="space-y-2">
      <p className="text-sm text-ink-soft">If the customer replied outside the site (WhatsApp, phone, email), record it here for v{version}. It&apos;s logged with your name.</p>
      <input className="input !py-2 text-sm" placeholder="e.g. Approved on WhatsApp, 3 Nov 4:10pm" value={note} onChange={(e) => setNote(e.target.value)} maxLength={1000} />
      <div className="flex gap-2">
        <button type="button" className="btn btn-primary btn-sm" disabled={pending} onClick={() => run(() => recordDecisionAction(orderId, previewId, "APPROVED", note))}>
          Record approval
        </button>
        <button type="button" className="btn btn-ghost btn-sm" disabled={pending} onClick={() => run(() => recordDecisionAction(orderId, previewId, "CHANGES_REQUESTED", note))}>
          Record change request
        </button>
      </div>
      {msg}
    </div>
  );
}

export function NoteForm({ orderId }: { orderId: string }) {
  const { pending, run, msg } = useAction();
  const [text, setText] = useState("");
  const [visible, setVisible] = useState(false);
  return (
    <div className="space-y-2">
      <textarea className="input text-sm" rows={3} placeholder="Production note: partner, print settings, paint colours, issues…" value={text} onChange={(e) => setText(e.target.value)} maxLength={2000} />
      <label className="flex items-center gap-2 text-sm text-ink-soft">
        <input type="checkbox" checked={visible} onChange={(e) => setVisible(e.target.checked)} /> Send to customer (otherwise internal only)
      </label>
      <button type="button" className="btn btn-primary btn-sm" disabled={pending || !text.trim()} onClick={() => run(() => addNoteAction(orderId, text, visible), () => setText(""))}>
        {visible ? "Send message" : "Add internal note"}
      </button>
      {msg}
    </div>
  );
}

export function ShippingForm({ orderId, initial }: { orderId: string; initial: { courier: string; trackingNumber: string; trackingUrl: string } }) {
  const { pending, run, msg } = useAction();
  const [f, setF] = useState(initial);
  return (
    <div className="grid gap-2">
      <input className="input !py-2 text-sm" placeholder="Courier (e.g. Delhivery, Blue Dart)" value={f.courier} onChange={(e) => setF({ ...f, courier: e.target.value })} aria-label="Courier" />
      <input className="input !py-2 text-sm" placeholder="Tracking number" value={f.trackingNumber} onChange={(e) => setF({ ...f, trackingNumber: e.target.value })} aria-label="Tracking number" />
      <input className="input !py-2 text-sm" placeholder="Tracking link (https://…)" value={f.trackingUrl} onChange={(e) => setF({ ...f, trackingUrl: e.target.value })} aria-label="Tracking link" />
      <button type="button" className="btn btn-primary btn-sm justify-self-start" disabled={pending} onClick={() => run(() => saveShippingAction(orderId, f))}>
        Save shipping details
      </button>
      {msg}
    </div>
  );
}

export function CostsForm({ orderId, initial }: { orderId: string; initial: { production: string; shipping: string; partner: string } }) {
  const { pending, run, msg } = useAction();
  const [f, setF] = useState(initial);
  return (
    <div className="grid gap-2">
      <div className="grid grid-cols-2 gap-2">
        <label className="text-xs text-ink-mute">
          Manufacturing cost (₹)
          <input className="input mt-1 !py-2 text-sm" inputMode="decimal" value={f.production} onChange={(e) => setF({ ...f, production: e.target.value })} placeholder="e.g. 650" />
        </label>
        <label className="text-xs text-ink-mute">
          Shipping cost (₹)
          <input className="input mt-1 !py-2 text-sm" inputMode="decimal" value={f.shipping} onChange={(e) => setF({ ...f, shipping: e.target.value })} placeholder="e.g. 90" />
        </label>
      </div>
      <input className="input !py-2 text-sm" placeholder="Production partner" value={f.partner} onChange={(e) => setF({ ...f, partner: e.target.value })} aria-label="Production partner" />
      <button type="button" className="btn btn-primary btn-sm justify-self-start" disabled={pending} onClick={() => run(() => saveCostsAction(orderId, f))}>
        Save costs
      </button>
      {msg}
    </div>
  );
}

export function PaymentForm({ orderId, total }: { orderId: string; total: string }) {
  const { pending, run, msg } = useAction();
  const [f, setF] = useState({ amount: total, method: "UPI", reference: "" });
  return (
    <div className="grid gap-2">
      <p className="text-sm text-ink-soft">Only record money you have actually received and verified in your bank / UPI app.</p>
      <div className="grid grid-cols-2 gap-2">
        <input className="input !py-2 text-sm" inputMode="decimal" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} aria-label="Amount in rupees" />
        <select className="input !py-2 text-sm" value={f.method} onChange={(e) => setF({ ...f, method: e.target.value })} aria-label="Method">
          {["UPI", "Bank transfer", "Cash", "Card (offline)", "Other"].map((m) => (
            <option key={m}>{m}</option>
          ))}
        </select>
      </div>
      <input className="input !py-2 text-sm" placeholder="UTR / reference" value={f.reference} onChange={(e) => setF({ ...f, reference: e.target.value })} aria-label="Reference" />
      <button type="button" className="btn btn-primary btn-sm justify-self-start" disabled={pending} onClick={() => run(() => recordPaymentAction(orderId, f))}>
        Record payment received
      </button>
      {msg}
    </div>
  );
}

export function CancelForm({ orderId }: { orderId: string }) {
  const { pending, run, msg } = useAction();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  if (!open)
    return (
      <button type="button" className="text-sm text-[#a3402c] underline" onClick={() => setOpen(true)}>
        Cancel this order…
      </button>
    );
  return (
    <div className="grid gap-2">
      <input className="input !py-2 text-sm" placeholder="Reason (shown to the customer)" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={300} />
      <p className="text-xs text-ink-mute">Refunds are issued separately in Razorpay / your bank. Cancelling does not move money.</p>
      <button type="button" className="btn btn-sm justify-self-start bg-[#a3402c] text-white" disabled={pending} onClick={() => run(() => cancelAction(orderId, reason))}>
        Confirm cancellation
      </button>
      {msg}
    </div>
  );
}
