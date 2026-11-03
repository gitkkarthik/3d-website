import { FAQS } from "@/lib/content";

export function Faq({ items = FAQS }: { items?: { q: string; a: string }[] }) {
  return (
    <div className="divide-y divide-line border-y border-line">
      {items.map((f) => (
        <details key={f.q} className="group py-1">
          <summary className="flex cursor-pointer list-none items-start justify-between gap-6 py-5 text-left [&::-webkit-details-marker]:hidden">
            <span className="font-display text-lg leading-snug text-ink sm:text-xl">{f.q}</span>
            <span className="mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-full border border-oat text-ink-soft transition-transform duration-300 group-open:rotate-45" aria-hidden>
              +
            </span>
          </summary>
          <p className="max-w-2xl pb-6 pr-10 leading-relaxed text-ink-soft">{f.a}</p>
        </details>
      ))}
    </div>
  );
}

export function faqJsonLd(items = FAQS) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
}
