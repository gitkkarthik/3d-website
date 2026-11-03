"use client";

import { useState, useTransition } from "react";
import { submitReviewAction } from "@/app/(site)/account/actions";

export function ReviewForm({ orderId, defaultName, petName }: { orderId: string; defaultName: string; petName: string }) {
  const [rating, setRating] = useState(5);
  const [res, setRes] = useState<{ ok: boolean; msg: string } | null>(null);
  const [pending, start] = useTransition();
  if (res?.ok) return <p className="rounded-2xl bg-sage-soft p-5" role="status">{res.msg}</p>;
  return (
    <form
      className="grid gap-4 rounded-[1.25rem] bg-paper p-6 shadow-[0_0_0_1px_var(--color-line)]"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = Object.fromEntries(new FormData(e.currentTarget));
        start(async () => {
          const r = await submitReviewAction(orderId, { ...fd, rating });
          setRes(r.ok ? { ok: true, msg: r.message ?? "Thank you." } : { ok: false, msg: r.error });
        });
      }}
    >
      <p className="font-display text-xl">How did we do with {petName}?</p>
      <div className="flex gap-1" role="radiogroup" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={`${n} star${n > 1 ? "s" : ""}`} onClick={() => setRating(n)} className="p-1 text-clay">
            <svg width="26" height="26" viewBox="0 0 20 20" fill={n <= rating ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.2" aria-hidden>
              <path d="m10 2.5 2.3 4.8 5.2.7-3.8 3.6.9 5.2L10 14.3l-4.6 2.5.9-5.2L2.5 8l5.2-.7L10 2.5Z" />
            </svg>
          </button>
        ))}
      </div>
      <div>
        <label htmlFor="r-title" className="field-label">
          Headline <span className="font-normal text-ink-mute">· optional</span>
        </label>
        <input id="r-title" name="title" className="input" maxLength={80} />
      </div>
      <div>
        <label htmlFor="r-body" className="field-label">
          Your review
        </label>
        <textarea id="r-body" name="body" className="input" rows={4} required minLength={10} maxLength={1500} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="r-name" className="field-label">
            Name to show
          </label>
          <input id="r-name" name="displayName" className="input" defaultValue={defaultName} maxLength={40} required />
        </div>
        <div>
          <label htmlFor="r-city" className="field-label">
            City <span className="font-normal text-ink-mute">· optional</span>
          </label>
          <input id="r-city" name="city" className="input" maxLength={40} />
        </div>
      </div>
      {res && !res.ok && <p className="text-sm text-[#a3402c]" role="alert">{res.msg}</p>}
      <button type="submit" className="btn btn-primary justify-self-start" disabled={pending}>
        {pending ? "Sending…" : "Share review"}
      </button>
      <p className="text-xs text-ink-mute">Reviews are checked by our studio before they appear. We never edit what you write.</p>
    </form>
  );
}
