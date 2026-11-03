"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  ["/admin", "Overview"],
  ["/admin/orders", "Orders"],
  ["/admin/products", "Products & pricing"],
  ["/admin/reviews", "Reviews"],
  ["/admin/memories", "Memory pages"],
  ["/admin/customers", "Customers"],
  ["/admin/settings", "Settings"],
] as const;

export function AdminNav() {
  const path = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto px-3 pb-2 lg:px-5" aria-label="Studio">
      {LINKS.map(([href, label]) => {
        const active = href === "/admin" ? path === "/admin" : path.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm transition-colors ${active ? "bg-ink text-ivory" : "text-ink-soft hover:bg-sand"}`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
