import Link from "next/link";
import { and, count, desc, eq, gte, ne, sql } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { formatINR } from "@/lib/money";
import { STATUS_META } from "@/lib/lifecycle";
import { ORDER_STATUSES } from "@/lib/db/schema";
import { StatusBadge } from "@/components/account/StatusTimeline";
import { razorpayConfig } from "@/lib/razorpay";

export default async function AdminOverview() {
  const o = schema.orders;
  const paidLive = and(eq(o.paymentStatus, "PAID"), ne(o.status, "CANCELLED"));
  // All day-bucketing is in India time, regardless of the server's timezone.
  const todayIST = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
  const dayKeys = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(`${todayIST}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() - (29 - i));
    return d.toISOString().slice(0, 10);
  });
  const since = new Date(`${dayKeys[0]}T00:00:00+05:30`);

  const [[totals], byStatus, byEdition, daily, recent, [margin]] = await Promise.all([
    db
      .select({
        orders: count(),
        revenue: sql<number>`coalesce(sum(${o.totalPaise}) filter (where ${o.paymentStatus} = 'PAID' and ${o.status} <> 'CANCELLED'), 0)`,
        paidOrders: sql<number>`count(*) filter (where ${o.paymentStatus} = 'PAID' and ${o.status} <> 'CANCELLED')`,
        awaitingPayment: sql<number>`count(*) filter (where ${o.paymentStatus} <> 'PAID' and ${o.status} <> 'CANCELLED')`,
        pendingApproval: sql<number>`count(*) filter (where ${o.status} in ('PREVIEW_SENT','CUSTOMER_APPROVAL_PENDING'))`,
        newOrders: sql<number>`count(*) filter (where ${o.status} = 'ORDER_RECEIVED')`,
        inProduction: sql<number>`count(*) filter (where ${o.status} in ('APPROVED_FOR_PRODUCTION','PRINTING','PAINTING_AND_FINISHING','QUALITY_CHECK','PACKAGED'))`,
      })
      .from(o),
    db.select({ status: o.status, n: count() }).from(o).groupBy(o.status),
    db
      .select({ name: sql<string>`${o.snapshot}->>'productName'`, n: count(), revenue: sql<number>`coalesce(sum(${o.totalPaise}),0)` })
      .from(o)
      .where(paidLive)
      .groupBy(sql`${o.snapshot}->>'productName'`)
      .orderBy(desc(sql`coalesce(sum(${o.totalPaise}),0)`)),
    db
      .select({ day: sql<string>`to_char(${o.createdAt} at time zone 'Asia/Kolkata', 'YYYY-MM-DD')`, n: count(), revenue: sql<number>`coalesce(sum(${o.totalPaise}) filter (where ${o.paymentStatus} = 'PAID'),0)` })
      .from(o)
      .where(and(gte(o.createdAt, since), ne(o.status, "CANCELLED")))
      .groupBy(sql`1`),
    db.select().from(o).orderBy(desc(o.createdAt)).limit(8),
    db
      .select({
        n: count(),
        revenue: sql<number>`coalesce(sum(${o.totalPaise}),0)`,
        cost: sql<number>`coalesce(sum(${o.productionCostPaise} + coalesce(${o.shippingCostPaise},0)),0)`,
      })
      .from(o)
      .where(and(paidLive, sql`${o.productionCostPaise} is not null`)),
  ]);

  const revenue = Number(totals.revenue);
  const paidOrders = Number(totals.paidOrders);
  const marginPaise = Number(margin.revenue) - Number(margin.cost);
  const marginPct = Number(margin.revenue) ? Math.round((marginPaise / Number(margin.revenue)) * 100) : null;
  const statusCount = Object.fromEntries(byStatus.map((r) => [r.status, Number(r.n)]));
  const maxStatus = Math.max(1, ...byStatus.map((r) => Number(r.n)));

  const days = dayKeys.map((key) => {
    const row = daily.find((r) => r.day === key);
    const label = new Date(`${key}T00:00:00Z`).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "UTC" });
    return { key, label, n: Number(row?.n ?? 0), revenue: Number(row?.revenue ?? 0) };
  });
  const maxDay = Math.max(1, ...days.map((d) => d.n));
  const rzp = razorpayConfig();

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-3xl">Overview</h1>
        <p className="text-sm text-ink-mute">
          Payments: {rzp ? (rzp.testMode ? "Razorpay TEST mode" : "Razorpay live") : "manual only (Razorpay not configured)"} · Email: {process.env.RESEND_API_KEY ? "Resend" : "logged to console (dev)"}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Tile label="Revenue (paid)" value={formatINR(revenue)} sub={`${paidOrders} paid order${paidOrders === 1 ? "" : "s"}`} />
        <Tile label="Average order" value={paidOrders ? formatINR(Math.round(revenue / paidOrders)) : "–"} sub="Paid orders only" />
        <Tile label="Gross margin" value={marginPct == null ? "–" : `${marginPct}%`} sub={marginPct == null ? "Record production costs on orders" : `${formatINR(marginPaise)} on ${margin.n} costed order${Number(margin.n) === 1 ? "" : "s"}`} />
        <Tile label="All orders" value={String(totals.orders)} sub={`${totals.awaitingPayment} awaiting payment`} />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <ActionTile href="/admin/orders?status=ORDER_RECEIVED" label="New orders to review" n={Number(totals.newOrders)} />
        <ActionTile href="/admin/orders?status=awaiting" label="Waiting on customer approval" n={Number(totals.pendingApproval)} />
        <ActionTile href="/admin/orders?status=production" label="In production" n={Number(totals.inProduction)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section className="card p-5 sm:p-6" aria-labelledby="daily-h">
          <h2 id="daily-h" className="font-display text-xl">
            Orders per day
          </h2>
          <p className="text-sm text-ink-mute">Last 30 days, excluding cancelled</p>
          <div className="mt-6 flex h-40 items-end gap-[2px]" role="img" aria-label={`Orders per day over the last 30 days; total ${days.reduce((a, d) => a + d.n, 0)}`}>
            {days.map((d) => (
              <div key={d.key} className="group relative flex h-full flex-1 items-end">
                <div className="w-full rounded-t-[4px] bg-clay-soft transition-colors group-hover:bg-clay" style={{ height: d.n ? `${Math.max(4, (d.n / maxDay) * 100)}%` : "2px", opacity: d.n ? 1 : 0.35 }} />
                <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-night px-2.5 py-1.5 text-xs text-ivory group-hover:block">
                  {d.label}: {d.n} order{d.n === 1 ? "" : "s"}
                  {d.revenue ? ` · ${formatINR(d.revenue)} paid` : ""}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between text-xs text-ink-mute">
            <span>{days[0].label}</span>
            <span>{days[29].label}</span>
          </div>
        </section>

        <section className="card p-5 sm:p-6" aria-labelledby="edition-h">
          <h2 id="edition-h" className="font-display text-xl">
            Revenue by edition
          </h2>
          {byEdition.length === 0 ? (
            <p className="mt-4 text-sm text-ink-mute">No paid orders yet.</p>
          ) : (
            <table className="mt-4 w-full text-sm">
              <tbody>
                {byEdition.map((e) => (
                  <tr key={e.name} className="border-b border-line last:border-0">
                    <td className="py-2.5">{e.name}</td>
                    <td className="py-2.5 text-right text-ink-mute">{e.n}</td>
                    <td className="py-2.5 text-right font-medium">{formatINR(Number(e.revenue))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <section className="card p-5 sm:p-6" aria-labelledby="status-h">
          <h2 id="status-h" className="font-display text-xl">
            Orders by status
          </h2>
          <ul className="mt-4 space-y-2">
            {ORDER_STATUSES.map((s) => (
              <li key={s}>
                <Link href={`/admin/orders?status=${s}`} className="grid grid-cols-[10rem_1fr_2rem] items-center gap-3 text-sm hover:text-ink">
                  <span className="truncate text-ink-soft">{STATUS_META[s].label}</span>
                  <span className="h-2 rounded-full bg-sand">
                    <span className="block h-2 rounded-full bg-clay-soft" style={{ width: `${((statusCount[s] ?? 0) / maxStatus) * 100}%` }} />
                  </span>
                  <span className="text-right tabular-nums">{statusCount[s] ?? 0}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="card p-5 sm:p-6" aria-labelledby="recent-h">
          <div className="flex items-center justify-between">
            <h2 id="recent-h" className="font-display text-xl">
              Recent orders
            </h2>
            <Link href="/admin/orders" className="text-sm underline underline-offset-4">
              All orders
            </Link>
          </div>
          {recent.length === 0 ? (
            <p className="mt-4 text-sm text-ink-mute">No orders yet. They&apos;ll appear here the moment a customer places one.</p>
          ) : (
            <ul className="mt-3 divide-y divide-line">
              {recent.map((r) => (
                <li key={r.id}>
                  <Link href={`/admin/orders/${r.id}`} className="flex items-center justify-between gap-3 py-3 text-sm hover:bg-sand/40">
                    <span className="min-w-0">
                      <span className="font-medium">{r.petName}</span> <span className="text-ink-mute">· {r.number}</span>
                      <span className="block truncate text-ink-mute">{r.snapshot.productName}</span>
                    </span>
                    <span className="flex shrink-0 flex-col items-end gap-1">
                      <StatusBadge status={r.status} />
                      <span className="text-xs text-ink-mute">
                        {formatINR(r.totalPaise)} · {r.paymentStatus === "PAID" ? "paid" : "unpaid"}
                      </span>
                    </span>
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

function Tile({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="card p-5">
      <p className="text-sm text-ink-mute">{label}</p>
      <p className="mt-2 font-display text-3xl tabular-nums">{value}</p>
      <p className="mt-1 text-xs text-ink-mute">{sub}</p>
    </div>
  );
}

function ActionTile({ href, label, n }: { href: string; label: string; n: number }) {
  return (
    <Link href={href} className={`flex items-center justify-between rounded-[1.25rem] p-5 transition-colors ${n ? "bg-ink text-ivory hover:bg-[#3d3733]" : "bg-paper text-ink-soft shadow-[0_0_0_1px_var(--color-line)]"}`}>
      <span className="text-sm">{label}</span>
      <span className="font-display text-3xl tabular-nums">{n}</span>
    </Link>
  );
}
