import Link from "next/link";
import { count, desc, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { MemoryControls } from "@/components/admin/SmallActions";

export default async function AdminMemories() {
  const pages = await db
    .select({ p: schema.memoryPages, email: schema.users.email, number: schema.orders.number })
    .from(schema.memoryPages)
    .innerJoin(schema.users, eq(schema.users.id, schema.memoryPages.userId))
    .leftJoin(schema.orders, eq(schema.orders.id, schema.memoryPages.orderId))
    .orderBy(desc(schema.memoryPages.createdAt));
  const counts = await db.select({ id: schema.uploads.memoryPageId, n: count() }).from(schema.uploads).groupBy(schema.uploads.memoryPageId);
  const n = (id: string) => Number(counts.find((c) => c.id === id)?.n ?? 0);
  return (
    <div>
      <h1 className="text-3xl">Memory pages</h1>
      <p className="mt-1 text-ink-soft">Customer-owned and private by default. Only open or delete a page when a customer asks you to.</p>
      {pages.length === 0 ? (
        <div className="card mt-6 p-10 text-center text-ink-soft">No memory pages yet. They&apos;re created with Forever, Together and Memorial orders.</div>
      ) : (
        <div className="card mt-6 overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-line text-ink-mute">
              <tr><th className="p-4 font-medium">Pet</th><th className="p-4 font-medium">Owner</th><th className="p-4 font-medium">Order</th><th className="p-4 font-medium">Visibility</th><th className="p-4 font-medium">Files</th><th className="p-4 font-medium">Actions</th></tr>
            </thead>
            <tbody>
              {pages.map(({ p, email, number }) => (
                <tr key={p.id} className="border-b border-line last:border-0">
                  <td className="p-4 font-medium">{p.petName}{p.isMemorial && <span className="chip ml-2">memorial</span>}</td>
                  <td className="p-4">{email}</td>
                  <td className="p-4">{number && p.orderId ? <Link className="underline" href={`/admin/orders/${p.orderId}`}>{number}</Link> : "–"}</td>
                  <td className="p-4">{p.visibility === "PRIVATE" ? "Private" : "Link-shared"}</td>
                  <td className="p-4">{n(p.id)}</td>
                  <td className="p-4"><MemoryControls id={p.id} visibility={p.visibility} petName={p.petName} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
