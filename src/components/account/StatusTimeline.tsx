import { CUSTOMER_STAGES, STATUS_META } from "@/lib/lifecycle";
import type { OrderStatus } from "@/lib/db/schema";

export function StatusBadge({ status }: { status: OrderStatus }) {
  const tone =
    status === "CANCELLED"
      ? "bg-[#f1dcd5] text-[#8a3b2a]"
      : status === "PREVIEW_SENT" || status === "CUSTOMER_APPROVAL_PENDING"
        ? "bg-clay text-white"
        : status === "DELIVERED"
          ? "bg-sage text-white"
          : "bg-sand text-ink-soft";
  return <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${tone}`}>{STATUS_META[status].label}</span>;
}

export function StatusTimeline({ status }: { status: OrderStatus }) {
  const stage = STATUS_META[status].stage;
  if (stage < 0) return null;
  return (
    <ol className="grid grid-cols-5 gap-1.5" aria-label="Order progress">
      {CUSTOMER_STAGES.map((label, i) => {
        const done = i < stage || status === "DELIVERED";
        const current = i === stage && status !== "DELIVERED";
        return (
          <li key={label} aria-current={current ? "step" : undefined}>
            <span className={`block h-1.5 rounded-full ${done ? "bg-sage" : current ? "bg-clay" : "bg-oat"}`} />
            <span className={`mt-2 block text-[0.7rem] sm:text-xs ${current ? "font-semibold text-ink" : done ? "text-ink-soft" : "text-ink-mute"}`}>{label}</span>
          </li>
        );
      })}
    </ol>
  );
}
