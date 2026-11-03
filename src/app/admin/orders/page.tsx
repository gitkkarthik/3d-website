import Link from "next/link";
import { and, desc, eq, ilike, inArray, or, type SQL } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { formatINR } from "@/lib/money";
import { ORDER_STATUSES, type OrderStatus } from "@/lib/db/schema";
import { STATUS_META } from "@/lib/lifecycle";
import { StatusBadge } from "@/components/account/StatusTimeline";

const GROUPS: Record<string, OrderStatus[]> = {
  awaiting: ["PREVIEW_SENT", "CUSTOMER_APPROVAL_PENDING"],
  production: ["APPROVED_FOR_PRODUCTION", "PRINTING", "PAINTING_AND_FINISHING", "QUALITY_CHECK", "PACKAGED"],
  open: ORDER_STATUSES.filter((s) => s !== "DELIVERED" && s !== "CANCELLED"),
};

export default async function AdminOrders({ searchParams }: { searchParams: Promise<{ status?: string; q?: string; pay?: string }> }) {
  const sp = await searchParams;
  const o = schema.orders;
  const where: SQL[] = [];
  if (sp.status && GROUPS[sp.status]) where.push(inArray(o.status, GROUPS[sp.status]));
  else if (sp.status && ORDER_STATUSES.includes(sp.status as OrderStatus)) where.push(eq(o.status, sp.status as OrderStatus));
  if (sp.pay === "unpaid") where.push(inArray(o.paymentStatus, ["PENDING", "FAILED"]));
  const q = sp.q?.trim();
  if (q) {
    const like = `%${q.replace(/[%_]/g, "")}%`;
    where.push(or(ilike(o.number, like), ilike(o.petName, like), ilike(schema.users.email, like), ilike(schema.users.name, like), ilike(o.shipPhone, like))!);
  }
  const rows = await db
    .select({ o, email: schema.users.email, name: schema.users.name })
    .from(o)
    .innerJoin(schema.users, eq(schema.users.id, o.userId))
    .where(where.length ? and(...where) : undefined)
    .orderBy(desc(o.createdAt))
    .limit(200);

  const tabs: [string, string][] = [
    ["", "All"],
    ["open", "Open"],
    ["ORDER_RECEIVED", "New"],
    ["awaiting", "Awaiting approval"],
    ["production", "In production"],
    ["SHIPPED", "Shipped"],
    ["DELIVERED", "Delivered"],
    ["CANCELLED", "Cancelled"],
  ];

  return (
    <div>
      <h1 className="text-3xl">Orders</h1>
      <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex gap-1 overflow-x-auto">
          {tabs.map(([v, l]) => (
            <Link key={v} href={`/admin/orders${v ? `?status=${v}` : ""}`} className={`shrink-0 rounded-full px-3 py-1.5 text-sm ${(sp.status ?? "") === v ? "bg-ink text-ivory" : "bg-paper text-ink-soft shadow-[0_0_0_1px_var(--color-line)]"}`}>
              {l}
            </Link>
          ))}
          <Link href="/admin/orders?pay=unpaid" className={`shrink-0 rounded-full px-3 py-1.5 text-sm ${sp.pay === "unpaid" ? "bg-clay text-white" : "bg-paper text-ink-soft shadow-[0_0_0_1px_var(--color-line)]"}`}>
            Unpaid
          </Link>
        </div>
        <form className="flex gap-2">
          {sp.status && <input type="hidden" name="status" value={sp.status} />}
          <input name="q" defaultValue={q} placeholder="Order no., pet, email, phone" className="input !py-2 text-sm lg:w-72" aria-label="Search orders" />
          <button className="btn btn-primary btn-sm">Search</button>
        </form>
      </div>
      {sp.status && ORDER_STATUSES.includes(sp.status as OrderStatus) && <p className="mt-3 text-sm text-ink-mute">Showing: {STATUS_META[sp.status as OrderStatus].label}</p>}

      {rows.length === 0 ? (
        <div className="card mt-6 p-10 text-center text-ink-soft">No orders match.</div>
      ) : (
        <div className="card mt-6 overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="border-b border-line text-ink-mute">
              <tr>
                <th className="p-4 font-medium">Order</th>
                <th className="p-4 font-medium">Pet</th>
                <th className="p-4 font-medium">Customer</th>
                <th className="p-4 font-medium">Edition</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 text-right font-medium">Total</th>
                <th className="p-4 font-medium">Placed</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ o: r, email, name }) => (
                <tr key={r.id} className="border-b border-line last:border-0 hover:bg-sand/40">
                  <td className="p-4">
                    <Link href={`/admin/orders/${r.id}`} className="font-medium underline-offset-4 hover:underline">
                      {r.number}
                    </Link>
                  </td>
                  <td className="p-4">{r.petName}</td>
                  <td className="p-4">
                    {name}
                    <span className="block text-xs text-ink-mute">{email}</span>
                  </td>
                  <td className="p-4">
                    {r.snapshot.productName}
                    <span className="block text-xs text-ink-mute">{r.snapshot.variantName}</span>
                  </td>
                  <td className="p-4">
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="p-4 text-right">
                    {formatINR(r.totalPaise)}
                    <span className={`block text-xs ${r.paymentStatus === "PAID" ? "text-sage" : "text-clay"}`}>{r.paymentStatus === "PAID" ? "Paid" : "Unpaid"}</span>
                  </td>
                  <td className="p-4 text-ink-mute">{r.createdAt.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
