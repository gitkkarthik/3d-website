"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Wordmark } from "./Wordmark";

const NAV = [
  { href: "/editions", label: "Editions" },
  { href: "/#how-it-works", label: "How it works" },
  { href: "/memory-pages", label: "Memory pages" },
  { href: "/#faq", label: "FAQ" },
];

export function SiteHeader({ signedIn, isAdmin, unread }: { signedIn: boolean; isAdmin: boolean; unread: number }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
  }, [open]);

  const inWizard = pathname.startsWith("/create");

  return (
    <header
      className={`sticky top-0 z-40 transition-[background-color,box-shadow] duration-300 ${
        scrolled || open ? "bg-ivory/92 shadow-[0_1px_0_var(--color-line)] backdrop-blur-md" : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Wordmark />
        <nav className="hidden items-center gap-8 md:flex" aria-label="Main">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="text-[0.92rem] text-ink-soft transition-colors hover:text-ink">
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <Link href="/admin" className="hidden text-sm text-ink-soft hover:text-ink sm:inline">
              Studio
            </Link>
          )}
          <Link
            href={signedIn ? "/account" : "/signin"}
            className="relative hidden h-10 items-center rounded-full px-3 text-[0.92rem] text-ink-soft hover:text-ink sm:inline-flex"
          >
            {signedIn ? "My keepsakes" : "Sign in"}
            {unread > 0 && (
              <span className="ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-clay px-1.5 text-[0.7rem] font-semibold text-white">
                {unread}
              </span>
            )}
          </Link>
          {!inWizard && (
            <Link href="/create" className="btn btn-primary btn-sm hidden sm:inline-flex">
              Create keepsake
            </Link>
          )}
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full md:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
          >
            <span className="relative block h-3 w-5">
              <span className={`absolute left-0 top-0 h-[1.5px] w-5 bg-ink transition-transform duration-300 ${open ? "translate-y-[5px] rotate-45" : ""}`} />
              <span className={`absolute bottom-0 left-0 h-[1.5px] w-5 bg-ink transition-transform duration-300 ${open ? "-translate-y-[6px] -rotate-45" : ""}`} />
            </span>
          </button>
        </div>
      </div>

      <div
        id="mobile-menu"
        className={`fixed inset-x-0 top-16 bottom-0 bg-ivory px-6 pb-10 pt-6 transition-[opacity,transform] duration-300 md:hidden ${
          open ? "opacity-100" : "pointer-events-none -translate-y-2 opacity-0"
        }`}
      >
        <nav className="flex flex-col" aria-label="Mobile">
          {[...NAV, { href: signedIn ? "/account" : "/signin", label: signedIn ? `My keepsakes${unread ? ` (${unread})` : ""}` : "Sign in" }, ...(isAdmin ? [{ href: "/admin", label: "Studio dashboard" }] : [])].map((n) => (
            <Link key={n.href} href={n.href} className="border-b border-line py-4 font-display text-2xl text-ink">
              {n.label}
            </Link>
          ))}
        </nav>
        <Link href="/create" className="btn btn-primary mt-8 w-full">
          Create your pet keepsake
        </Link>
      </div>
    </header>
  );
}
