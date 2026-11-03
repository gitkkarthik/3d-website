import Image from "next/image";
import Link from "next/link";
import { formatINR } from "@/lib/money";
import { RENDER_FOR } from "@/lib/content";
import type { ProductWithChoices } from "@/lib/catalog";

export function EditionCard({ p, index }: { p: ProductWithChoices; index?: number }) {
  const img = RENDER_FOR[p.slug]?.main ?? "/renders/forever.webp";
  return (
    <Link
      href={`/editions/${p.slug}`}
      className="group flex flex-col overflow-hidden rounded-[1.5rem] bg-paper shadow-[0_0_0_1px_var(--color-line)] transition-shadow duration-500 hover:shadow-[0_0_0_1px_var(--color-oat),0_24px_50px_-28px_rgb(70_45_25/0.45)]"
    >
      <div className={`relative aspect-[4/3.4] overflow-hidden ${p.isMemorial ? "bg-[#ece7df]" : "bg-sand"}`}>
        <Image
          src={img}
          alt={`${p.name}: illustrative render`}
          fill
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
          className="object-contain p-4 transition-transform duration-[900ms] ease-[var(--ease-soft)] group-hover:scale-[1.035]"
        />
        <span className="render-tag absolute left-3 top-3">Render</span>
        {index != null && <span className="absolute right-4 top-3 font-display text-sm text-ink-mute">0{index + 1}</span>}
      </div>
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <h3 className="text-[1.45rem] leading-tight">{p.name}</h3>
        <p className="mt-1.5 text-[0.95rem] text-ink-soft">{p.tagline}</p>
        <ul className="mt-4 space-y-1.5 text-sm text-ink-soft">
          {p.includes.slice(0, 3).map((i) => (
            <li key={i} className="flex gap-2">
              <span className="mt-[0.55rem] h-1 w-1 shrink-0 rounded-full bg-clay" aria-hidden />
              {i}
            </li>
          ))}
        </ul>
        <div className="mt-auto flex items-end justify-between pt-6">
          <p className="text-sm text-ink-mute">
            {p.fromPaise === p.toPaise ? "" : "From "}
            <span className="font-display text-xl text-ink">{formatINR(p.fromPaise)}</span>
          </p>
          <span className="text-sm font-medium text-ink transition-transform duration-300 group-hover:translate-x-0.5">
            Explore <span aria-hidden>→</span>
          </span>
        </div>
      </div>
    </Link>
  );
}
