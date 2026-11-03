"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

declare global {
  interface Window {
    Razorpay?: new (opts: Record<string, unknown>) => { open: () => void; on: (ev: string, cb: (r: { error?: { description?: string } }) => void) => void };
  }
}

function loadCheckout(): Promise<boolean> {
  if (window.Razorpay) return Promise.resolve(true);
  return new Promise((resolve) => {
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

export function PayPanel({ orderId, amountLabel, online, testMode, manualInstructions }: { orderId: string; amountLabel: string; online: boolean; testMode: boolean; manualInstructions: string }) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "busy" | "verifying" | "failed">("idle");
  const [msg, setMsg] = useState<string | null>(null);

  async function pay() {
    setState("busy");
    setMsg(null);
    const ok = await loadCheckout();
    if (!ok || !window.Razorpay) {
      setState("failed");
      setMsg("We couldn't load the payment window. Check your connection and try again.");
      return;
    }
    const res = await fetch("/api/payments/razorpay/order", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderId }) });
    const o = await res.json().catch(() => ({}));
    if (!res.ok) {
      setState("failed");
      setMsg(o.error ?? "Couldn't start payment.");
      return;
    }
    const rzp = new window.Razorpay({
      key: o.keyId,
      amount: o.amount,
      currency: o.currency,
      name: o.name,
      description: o.description,
      order_id: o.razorpayOrderId,
      prefill: o.prefill,
      theme: { color: "#2b2724" },
      modal: { ondismiss: () => setState("idle") },
      handler: async (r: Record<string, string>) => {
        setState("verifying");
        const v = await fetch("/api/payments/razorpay/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(r) });
        const vb = await v.json().catch(() => ({}));
        if (v.ok) {
          router.refresh();
        } else {
          setState("failed");
          setMsg(vb.error ?? "We couldn't confirm the payment yet. If money was deducted, it will be reconciled automatically. Please don't pay twice.");
        }
      },
    });
    rzp.on("payment.failed", (r) => {
      setState("failed");
      setMsg(r.error?.description ? `Payment didn't go through: ${r.error.description}` : "Payment didn't go through. You haven't been charged.");
    });
    rzp.open();
  }

  return (
    <div className="rounded-[1.25rem] bg-paper p-6 shadow-[0_0_0_1px_var(--color-line)]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-display text-xl">Payment</p>
        {online && testMode && <span className="chip !bg-[#fbe9c8] !text-[#7a5410]">Razorpay test mode: no real money moves</span>}
      </div>
      {online ? (
        <>
          <p className="mt-2 text-sm text-ink-soft">Pay securely with UPI, cards or netbanking via Razorpay. Our artist can begin as soon as you&apos;ve paid.</p>
          <button type="button" className="btn btn-clay mt-5 h-12 w-full sm:w-auto sm:px-10" onClick={pay} disabled={state === "busy" || state === "verifying"}>
            {state === "busy" ? "Opening secure payment…" : state === "verifying" ? "Confirming payment…" : `Pay ${amountLabel}`}
          </button>
        </>
      ) : (
        <>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">{manualInstructions}</p>
          <p className="mt-3 text-xs text-ink-mute">Your order shows &ldquo;Payment pending&rdquo; until our studio confirms we&apos;ve received it.</p>
        </>
      )}
      {msg && (
        <p className="mt-3 text-sm text-[#a3402c]" role="alert">
          {msg}
        </p>
      )}
    </div>
  );
}
