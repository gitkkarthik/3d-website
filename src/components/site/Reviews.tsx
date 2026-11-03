import type { PublicReview } from "@/lib/reviews";

export function Stars({ n }: { n: number }) {
  return (
    <span className="inline-flex gap-0.5 text-clay" aria-label={`${n} out of 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} width="14" height="14" viewBox="0 0 20 20" aria-hidden fill={i < n ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.3">
          <path d="m10 2.5 2.3 4.8 5.2.7-3.8 3.6.9 5.2L10 14.3l-4.6 2.5.9-5.2L2.5 8l5.2-.7L10 2.5Z" />
        </svg>
      ))}
    </span>
  );
}

export function ReviewList({ reviews, emptyTitle, emptyBody }: { reviews: PublicReview[]; emptyTitle: string; emptyBody: string }) {
  if (!reviews.length) {
    return (
      <div className="card paper-grain flex flex-col items-start gap-3 p-8 sm:p-10">
        <p className="font-display text-2xl text-ink">{emptyTitle}</p>
        <p className="max-w-xl text-ink-soft">{emptyBody}</p>
      </div>
    );
  }
  return (
    <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {reviews.map((r) => (
        <li key={r.id} className="card flex flex-col p-6">
          <Stars n={r.rating} />
          {r.title && <p className="mt-3 font-display text-lg">{r.title}</p>}
          <blockquote className="mt-2 flex-1 leading-relaxed text-ink-soft">&ldquo;{r.body}&rdquo;</blockquote>
          <p className="mt-5 text-sm text-ink">
            {r.displayName}
            {r.petName ? <span className="text-ink-mute"> · {r.petName}&apos;s family</span> : null}
            {r.city ? <span className="text-ink-mute"> · {r.city}</span> : null}
          </p>
          <p className="mt-1 text-xs text-ink-mute">Verified order · {r.productName}</p>
        </li>
      ))}
    </ul>
  );
}
