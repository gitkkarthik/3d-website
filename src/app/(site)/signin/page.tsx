import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { SignInClient } from "./client";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

function safeNext(n?: string) {
  return n && n.startsWith("/") && !n.startsWith("//") ? n : "/account";
}

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ next?: string; mode?: string }> }) {
  const sp = await searchParams;
  const next = safeNext(sp.next);
  if (await getCurrentUser()) redirect(next);
  return (
    <div className="mx-auto grid max-w-5xl gap-12 px-4 pb-24 pt-10 sm:px-6 md:grid-cols-[1fr_1.1fr] lg:pt-16">
      <div>
        <p className="eyebrow">Welcome</p>
        <h1 className="mt-4 text-4xl leading-tight sm:text-5xl">
          Your keepsakes, <em className="italic-soft text-clay">all in one place.</em>
        </h1>
        <p className="mt-5 text-ink-soft">Follow your order, approve your pet&apos;s design, and add to their memory page.</p>
      </div>
      <div className="card p-6 sm:p-8">
        <SignInClient next={next} mode={sp.mode === "register" ? "register" : "signin"} />
      </div>
    </div>
  );
}
