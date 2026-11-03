import type { Metadata } from "next";
import Link from "next/link";
import { and, desc, eq, inArray } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { requireUserPage } from "@/lib/auth";
import { formatINR } from "@/lib/money";
import { StatusBadge } from "@/components/account/StatusTimeline";
import { markNotificationsReadAction } from "./actions";
import { SignOutButton } from "@/components/account/SignOutButton";

export const metadata: Metadata = { title: "My keepsakes", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const user = await requireUserPage("/account");
  const [orders, notes, memories] = await Promise.all([
    db.select().from(schema.orders).where(eq(schema.orders.userId, user.id)).orderBy(desc(schema.orders.createdAt)),
    db.select().from(schema.notifications).where(eq(schema.notifications.userId, user.id)).orderBy(desc(schema.notifications.createdAt)).limit(12),
    db.select().from(schema.memoryPages).where(eq(schema.memoryPages.userId, user.id)).orderBy(desc(schema.memoryPages.createdAt)),
  ]);
  const covers = orders.length
    ? await db
        .select({ id: schema.uploads.id, orderId: schema.uploads.orderId, sortOrder: schema.uploads.sortOrder })
        .from(schema.uploads)
        .where(and(inArray(schema.uploads.orderId, orders.map((o) => o.id)), eq(schema.uploads.kind, "PET_PHOTO"), eq(schema.uploads.sortOrder, 0)))
    : [];
  const coverFor = (id: string) => covers.find((c) => c.orderId === id)?.id;
  const unread = notes.filter((n) => !n.readAt).length;
  const needsAction = orders.filter((o) => o.status === "PREVIEW_SENT" || o.status === "CUSTOMER_APPROVAL_PENDING");

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-8 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">My keepsakes</p>
          <h1 className="mt-3 text-4xl sm:text-5xl">Hello, {user.name.split(" ")[0]}</h1>
        </div>
        <SignOutButton />
      </div>

      {needsAction.map((o) => (
        <Link key={o.id} href={`/account/orders/${o.id}#preview`} className="mt-8 flex items-center justify-between gap-4 rounded-[1.25rem] bg-clay p-5 text-white transition-colors hover:bg-[#864c2d] sm:p-6">
          <span>
            <span className="block font-display text-xl">{o.petName}&apos;s design is ready for you</span>
            <span className="mt-1 block text-sm text-white/85">Take a look and approve it, or tell us what to change.</span>
          </span>
          <span aria-hidden className="text-2xl">→</span>
        </Link>
      ))}

      <div className="mt-10 grid gap-10 lg:grid-cols-[1.6fr_1fr]">
        <section aria-labelledby="orders">
          <h2 id="orders" className="text-2xl">
            Orders
          </h2>
          {orders.length === 0 ? (
            <div className="card mt-5 p-8 text-center">
              <p className="font-display text-2xl">No keepsakes yet</p>
              <p className="mx-auto mt-2 max-w-sm text-ink-soft">When you&apos;re ready, tell us about your pet. It takes about five minutes.</p>
              <Link href="/create" className="btn btn-primary mt-6">
                Create your pet keepsake
              </Link>
            </div>
          ) : (
            <ul className="mt-5 space-y-3">
              {orders.map((o) => {
                const cover = coverFor(o.id);
                return (
                  <li key={o.id}>
                    <Link href={`/account/orders/${o.id}`} className="card flex items-center gap-4 p-4 transition-shadow hover:shadow-[0_0_0_1px_var(--color-ink-mute)] sm:p-5">
                      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-sand">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        {cover && <img src={`/api/files/${cover}?v=thumb`} alt="" className="h-full w-full object-cover" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-display text-lg leading-tight">{o.petName}</p>
                        <p className="truncate text-sm text-ink-soft">
                          {o.snapshot.productName} · {o.number}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <StatusBadge status={o.status} />
                          {o.paymentStatus !== "PAID" && o.status !== "CANCELLED" && <span className="chip !bg-[#f6e6d9] !text-clay">Payment pending</span>}
                        </div>
                      </div>
                      <p className="hidden font-display text-lg sm:block">{formatINR(o.totalPaise)}</p>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}

          {memories.length > 0 && (
            <>
              <h2 className="mt-12 text-2xl">Memory pages</h2>
              <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                {memories.map((m) => (
                  <li key={m.id} className="card flex flex-col p-5">
                    <p className="font-display text-xl">{m.petName}</p>
                    <p className="mt-1 text-sm text-ink-mute">{m.visibility === "PRIVATE" ? "Private: only you can see it" : "Shared with anyone who has the link"}</p>
                    <div className="mt-4 flex gap-2">
                      <Link href={`/account/memories/${m.id}`} className="btn btn-ghost btn-sm">
                        Edit
                      </Link>
                      <Link href={`/m/${m.slug}`} className="btn btn-primary btn-sm">
                        View page
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>

        <section aria-labelledby="updates">
          <div className="flex items-center justify-between">
            <h2 id="updates" className="text-2xl">
              Updates {unread > 0 && <span className="ml-1 align-middle text-sm font-sans text-clay">{unread} new</span>}
            </h2>
            {unread > 0 && (
              <form action={markNotificationsReadAction}>
                <button className="text-sm text-ink-soft underline underline-offset-4 hover:text-ink">Mark all read</button>
              </form>
            )}
          </div>
          {notes.length === 0 ? (
            <p className="mt-5 text-sm text-ink-mute">Updates about your orders will appear here and in your email.</p>
          ) : (
            <ul className="mt-5 space-y-2">
              {notes.map((n) => (
                <li key={n.id}>
                  <Link href={n.href ?? "#"} className={`block rounded-2xl p-4 transition-colors ${n.readAt ? "bg-transparent hover:bg-paper" : "bg-paper shadow-[0_0_0_1px_var(--color-line)]"}`}>
                    <p className="flex items-center gap-2 text-sm font-medium">
                      {!n.readAt && <span className="h-2 w-2 shrink-0 rounded-full bg-clay" aria-label="New" />}
                      {n.title}
                    </p>
                    <p className="mt-1 text-sm text-ink-soft">{n.body}</p>
                    <p className="mt-1.5 text-xs text-ink-mute">{n.createdAt.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
