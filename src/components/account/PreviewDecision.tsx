"use client";

import { useEffect, useState, useTransition } from "react";
import { approvePreviewAction, requestChangesAction, markPreviewViewedAction } from "@/app/(site)/account/actions";

export function PreviewDecision({ orderId, previewId, petName, markViewed }: { orderId: string; previewId: string; petName: string; markViewed: boolean }) {
  const [mode, setMode] = useState<"idle" | "approve" | "changes">("idle");
  const [text, setText] = useState("");
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [pending, start] = useTransition();

  useEffect(() => {
    if (markViewed) markPreviewViewedAction(orderId).catch(() => {});
  }, [markViewed, orderId]);

  if (result?.ok) {
    return (
      <p className="rounded-2xl bg-sage-soft p-5 text-ink" role="status">
        {result.msg}
      </p>
    );
  }

  return (
    <div>
      {mode === "idle" && (
        <div className="flex flex-col gap-3 sm:flex-row">
          <button type="button" className="btn btn-primary h-12 sm:flex-1" onClick={() => setMode("approve")}>
            Yes, this is {petName}. Approve
          </button>
          <button type="button" className="btn btn-ghost h-12 sm:flex-1" onClick={() => setMode("changes")}>
            Request changes
          </button>
        </div>
      )}
      {mode !== "idle" && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            start(async () => {
              const r = mode === "approve" ? await approvePreviewAction(orderId, previewId, text) : await requestChangesAction(orderId, previewId, text);
              setResult(r.ok ? { ok: true, msg: r.message ?? "Done." } : { ok: false, msg: r.error });
            });
          }}
          className="rounded-2xl bg-paper p-5 shadow-[0_0_0_1px_var(--color-line)]"
        >
          {mode === "approve" ? (
            <>
              <p className="font-display text-lg">Approve this design for production?</p>
              <p className="mt-1 text-sm text-ink-soft">Once approved, we&apos;ll begin printing and hand-painting. Changes after this point may not be possible.</p>
              <label htmlFor="approve-note" className="field-label mt-4">
                A note for our artist <span className="font-normal text-ink-mute">· optional</span>
              </label>
              <textarea id="approve-note" className="input" rows={2} maxLength={1000} value={text} onChange={(e) => setText(e.target.value)} />
            </>
          ) : (
            <>
              <label htmlFor="changes" className="font-display text-lg">
                What isn&apos;t quite {petName} yet?
              </label>
              <p className="mt-1 text-sm text-ink-soft">Be as specific as you can, e.g. &ldquo;her nose is darker&rdquo; or &ldquo;his left ear flops more&rdquo;.</p>
              <textarea id="changes" className="input mt-3" rows={4} maxLength={2000} required value={text} onChange={(e) => setText(e.target.value)} />
            </>
          )}
          {result && !result.ok && (
            <p className="mt-3 text-sm text-[#a3402c]" role="alert">
              {result.msg}
            </p>
          )}
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <button type="submit" className={`btn ${mode === "approve" ? "btn-primary" : "btn-clay"}`} disabled={pending || (mode === "changes" && text.trim().length < 3)}>
              {pending ? "Saving…" : mode === "approve" ? "Approve for production" : "Send to our artist"}
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => setMode("idle")} disabled={pending}>
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
