import { desc, eq, sql } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { formatINR } from "@/lib/money";

export default async function AdminCustomers() {
  const u = schema.users;
  const o = schema.orders;
  const rows = await db
    .select({
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      role: u.role,
      createdAt: u.createdAt,
      orders: sql<number>`count(${o.id})`,
      spent: sql<number>`coalesce(sum(${o.totalPaise}) filter (where ${o.paymentStatus} = 'PAID' and ${o.status} <> 'CANCELLED'), 0)`,
      last: sql<Date | null>`max(${o.createdAt})`,
    })
    .from(u)
    .leftJoin(o, eq(o.userId, u.id))
    .groupBy(u.id)
    .orderBy(desc(u.createdAt))
    .limit(500);
  return (
    <div>
      <h1 className="text-3xl">Customers</h1>
      <div className="card mt-6 overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-line text-ink-mute">
            <tr><th className="p-4 font-medium">Name</th><th className="p-4 font-medium">Email</th><th className="p-4 font-medium">Phone</th><th className="p-4 text-right font-medium">Orders</th><th className="p-4 text-right font-medium">Paid</th><th className="p-4 font-medium">Joined</th></tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-line last:border-0">
                <td className="p-4">{r.name}{r.role === "ADMIN" && <span className="chip ml-2">studio</span>}</td>
                <td className="p-4"><a className="underline" href={`mailto:${r.email}`}>{r.email}</a></td>
                <td className="p-4">{r.phone ?? "–"}</td>
                <td className="p-4 text-right">{Number(r.orders)}</td>
                <td className="p-4 text-right">{formatINR(Number(r.spent))}</td>
                <td className="p-4 text-ink-mute">{r.createdAt.toLocaleDateString("en-IN")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
