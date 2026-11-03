import Link from "next/link";

/** A small keepsake-tag mark + wordmark. Deliberately quiet: no paw prints. */
export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`group inline-flex items-center gap-2.5 ${className}`} aria-label="Pawsome Memories home">
      <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden className="text-clay transition-transform duration-500 group-hover:-rotate-6">
        <path
          d="M6 4.5h10.2c.5 0 1 .2 1.4.6l5.3 5.6c.7.8.7 2 0 2.8l-5.3 5.6c-.4.4-.9.6-1.4.6H6c-1.1 0-2-.9-2-2V6.5c0-1.1.9-2 2-2Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <circle cx="17.6" cy="12" r="1.6" fill="currentColor" />
        <path d="M8 10.2c.9-1.4 3-1.4 3.6.1.6-1.5 2.7-1.5 3.6-.1.7 1.3-.4 2.9-3.6 4.6C8.4 13.1 7.3 11.5 8 10.2Z" fill="currentColor" />
      </svg>
      <span className="font-display text-[1.2rem] leading-none tracking-tight text-ink" style={{ fontVariationSettings: '"SOFT" 100' }}>
        Pawsome <em className="italic-soft text-clay">Memories</em>
      </span>
    </Link>
  );
}
