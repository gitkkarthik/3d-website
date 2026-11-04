import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq, inArray } from "drizzle-orm";
import { isLocalUrl, scanUrl } from "@/lib/qr";
import { db, schema } from "@/lib/db";
import { getOrderDetail } from "@/lib/orders";
import { canTransition, MANUAL_TRANSITIONS, STATUS_META } from "@/lib/lifecycle";
import { formatINR } from "@/lib/money";
import { StatusBadge } from "@/components/account/StatusTimeline";
import { CancelForm, CostsForm, NoteForm, Panel, PaymentForm, PreviewSender, RecordDecision, ShippingForm, StatusControl } from "@/components/admin/OrderPanels";

const STORY_LABELS: Record<string, string> = {
  smile: "Makes them smile",
  toy: "Favourite toy",
  sleeping: "Sleeping position",
  personality: "Personality",
  nickname: "Nicknames",
  freezeMoment: "Moment to freeze",
};

export default async function AdminOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const d = await getOrderDetail(id);
  if (!d) notFound();
  const { order: o, photos, previews, events, payments, memory } = d;
  const [customer] = await db.select().from(schema.users).where(eq(schema.users.id, o.userId));
  const sounds = await db.select().from(schema.uploads).where(and(eq(schema.uploads.orderId, o.id), eq(schema.uploads.kind, "PET_SOUND"))).orderBy(schema.uploads.sortOrder);
  const [qrPage] = memory ? await db.select({ qrToken: schema.memoryPages.qrToken, qrEnabled: schema.memoryPages.qrEnabled }).from(schema.memoryPages).where(eq(schema.memoryPages.id, memory.id)) : [];
  const memoryVoiceNotes = memory ? (await db.select({ id: schema.uploads.id }).from(schema.uploads).where(and(eq(schema.uploads.memoryPageId, memory.id), eq(schema.uploads.kind, "MEMORY_AUDIO")))).length : 0;
  const actorIds = [...new Set(events.map((e) => e.actorUserId).filter(Boolean))] as string[];
  const actors = actorIds.length ? await db.select({ id: schema.users.id, name: schema.users.name, role: schema.users.role }).from(schema.users).where(inArray(schema.users.id, actorIds)) : [];
  const actorName = (uid: string | null) => {
    const a = actors.find((x) => x.id === uid);
    return a ? (a.role === "ADMIN" ? `${a.name} (studio)` : "Customer") : "System";
  };

  const pending = previews.find((p) => p.decision === "PENDING");
  const options = (MANUAL_TRANSITIONS[o.status] ?? []).map((to) => {
    const c = canTransition(o, to);
    return { value: to, label: STATUS_META[to].label, blocked: c.ok ? undefined : c.reason };
  });
  const canSendPreview = ["PHOTOS_REVIEW", "DESIGN_IN_PROGRESS", "PREVIEW_SENT", "CUSTOMER_APPROVAL_PENDING"].includes(o.status);
  const cost = (o.productionCostPaise ?? 0) + (o.shippingCostPaise ?? 0);
  const marginPaise = o.productionCostPaise != null ? o.totalPaise - cost : null;
  const closed = o.status === "CANCELLED" || o.status === "DELIVERED";
  const petPhotos = photos.filter((p) => p.caption !== "owner");
  const ownerPhotos = photos.filter((p) => p.caption === "owner");

  return (
    <div>
      <Link href="/admin/orders" className="text-sm text-ink-mute hover:text-ink">
        ← Orders
      </Link>
      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl">
            {o.petName} <span className="text-ink-mute">· {o.number}</span>
          </h1>
          <p className="mt-1 text-ink-soft">
            {o.snapshot.productName} · {o.snapshot.variantName} · placed {o.createdAt.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusBadge status={o.status} />
          <span className={`chip ${o.paymentStatus === "PAID" ? "!bg-sage-soft !text-sage" : "!bg-[#f6e6d9] !text-clay"}`}>{o.paymentStatus === "PAID" ? "Paid" : `Payment ${o.paymentStatus.toLowerCase()}`}</span>
          {o.approvedAt ? <span className="chip !bg-sage-soft !text-sage">Approved {o.approvedAt.toLocaleDateString("en-IN")}</span> : <span className="chip">Not approved yet</span>}
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.45fr_1fr]">
        <div className="space-y-6">
          {/* Brief for the artist */}
          <section className="card p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl">Artist brief</h2>
              <span className="text-xs text-ink-mute">Click a photo for the full-resolution original</span>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-5">
              {petPhotos.map((p) => (
                <a key={p.id} href={`/api/files/${p.id}?v=original`} className="group relative block overflow-hidden rounded-lg bg-sand">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/api/files/${p.id}?v=thumb`} alt="" className="aspect-square w-full object-cover transition-transform group-hover:scale-105" />
                  <span className="absolute bottom-1 left-1 rounded bg-night/70 px-1.5 text-[0.6rem] text-ivory">
                    {p.width}×{p.height}
                  </span>
                </a>
              ))}
            </div>
            {ownerPhotos.length > 0 && (
              <>
                <p className="mt-4 text-sm font-medium">Owner photos</p>
                <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-5">
                  {ownerPhotos.map((p) => (
                    <a key={p.id} href={`/api/files/${p.id}?v=original`} className="block overflow-hidden rounded-lg bg-sand">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={`/api/files/${p.id}?v=thumb`} alt="" className="aspect-square w-full object-cover" />
                    </a>
                  ))}
                </div>
              </>
            )}
            <dl className="mt-5 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
              <Item k="Animal" v={`${o.animalType} · ${o.breed}`} />
              <Item k="Age" v={o.petAge} />
              <Item k="Pose" v={o.snapshot.poseLabel} />
              <Item k="Base" v={o.snapshot.baseLabel} />
              <Item k="Engraving" v={o.engravedName} />
              <Item k={o.importantDateLabel || "Date"} v={o.importantDate} />
              <Item k="Message" v={o.message} wide />
              <Item k="Pose notes" v={o.poseNotes} wide />
              <Item k="Owner notes" v={o.ownerNotes} wide />
              <Item k="Special instructions" v={o.specialInstructions} wide />
            </dl>
            <div className="mt-5 space-y-3 rounded-xl bg-sand/50 p-4">
              {Object.entries(o.story).filter(([, v]) => v).length === 0 ? (
                <p className="text-sm text-ink-mute">No story answers given.</p>
              ) : (
                Object.entries(o.story)
                  .filter(([, v]) => v)
                  .map(([k, v]) => (
                    <div key={k}>
                      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-clay">{STORY_LABELS[k] ?? k}</p>
                      <p className="mt-0.5 font-display leading-relaxed">{v}</p>
                    </div>
                  ))
              )}
            </div>
          </section>

          {/* Sound & engraving */}
          <section className="card p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-xl">Sound &amp; engraving</h2>
              <a href={`/api/admin/engraving/${o.id}`} className="btn btn-primary btn-sm">
                Download engraving file (SVG)
              </a>
            </div>
            {sounds.length === 0 ? (
              <p className="mt-3 text-sm text-ink-mute">
                No recording with the order.{" "}
                {memoryVoiceNotes > 0 ? `The customer has added ${memoryVoiceNotes} voice note(s) on their memory page; the first is used for the engraving.` : "Ask the customer for one before finalising the design; it can be added from their memory page."}
              </p>
            ) : (
              <ul className="mt-4 space-y-3">
                {sounds.map((snd, i) => (
                  <li key={snd.id} className="rounded-xl bg-sand/50 p-3 text-sm">
                    <p className="mb-2 font-medium">
                      {i === 0 ? "Engraved · " : ""}
                      {snd.caption ?? "Recording"} {snd.durationSec ? <span className="text-ink-mute">· {snd.durationSec}s</span> : null}
                    </p>
                    <audio controls preload="none" src={`/api/files/${snd.id}`} className="w-full" />
                  </li>
                ))}
              </ul>
            )}
            {qrPage?.qrToken && (
              <p className="mt-4 text-sm text-ink-soft">
                QR points to{" "}
                <a className="underline" href={scanUrl(qrPage.qrToken)} target="_blank" rel="noreferrer">
                  {scanUrl(qrPage.qrToken)}
                </a>
                {!qrPage.qrEnabled && " (scanning paused by the customer)"}
              </p>
            )}
            {isLocalUrl() && (
              <p className="mt-2 rounded-xl bg-[#fbeee6] p-3 text-sm text-clay">
                APP_URL is set to a local address. Set it to your real domain before engraving, or the printed QR won&apos;t work for customers.
              </p>
            )}
          </section>

          {/* Previews */}
          <section className="card p-5 sm:p-6">
            <h2 className="font-display text-xl">Design previews</h2>
            {previews.length === 0 ? (
              <p className="mt-2 text-sm text-ink-mute">No previews sent yet.</p>
            ) : (
              <ul className="mt-4 space-y-4">
                {previews.map((p) => (
                  <li key={p.id} className="rounded-xl bg-sand/40 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                      <span className="font-medium">Version {p.version}</span>
                      <span className={`chip ${p.decision === "APPROVED" ? "!bg-sage-soft !text-sage" : p.decision === "PENDING" ? "!bg-[#f6e6d9] !text-clay" : ""}`}>
                        {p.decision === "PENDING" ? "Awaiting customer" : p.decision === "APPROVED" ? `Approved${p.decidedVia === "ADMIN_RECORDED" ? " (recorded by studio)" : " by customer"}` : p.decidedVia === "SUPERSEDED" ? "Superseded" : "Changes requested"}
                      </span>
                    </div>
                    <div className="mt-3 flex gap-2">
                      {p.uploadIds.map((u) => (
                        <a key={u} href={`/api/files/${u}`} target="_blank" rel="noreferrer">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={`/api/files/${u}?v=thumb`} alt="" className="h-20 w-20 rounded-lg object-cover" />
                        </a>
                      ))}
                    </div>
                    {p.artistNote && <p className="mt-2 text-sm text-ink-soft">Artist: {p.artistNote}</p>}
                    {p.customerFeedback && <p className="mt-1 text-sm">Customer: {p.customerFeedback}</p>}
                    {p.decidedAt && <p className="mt-1 text-xs text-ink-mute">Decided {p.decidedAt.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</p>}
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Timeline */}
          <section className="card p-5 sm:p-6">
            <h2 className="font-display text-xl">Activity & production notes</h2>
            <ol className="mt-4 space-y-3">
              {events.map((e) => (
                <li key={e.id} className="flex gap-3 text-sm">
                  <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${e.visibleToCustomer ? "bg-clay-soft" : "bg-ink-mute"}`} aria-hidden />
                  <div>
                    <p>
                      {e.toStatus ? <strong className="font-medium">{STATUS_META[e.toStatus].label}</strong> : <strong className="font-medium">{e.type === "NOTE" ? (e.visibleToCustomer ? "Message to customer" : "Internal note") : e.type.toLowerCase()}</strong>}
                      {e.message ? ` · ${e.message}` : ""}
                    </p>
                    <p className="text-xs text-ink-mute">
                      {actorName(e.actorUserId)} · {e.createdAt.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                      {!e.visibleToCustomer && " · internal"}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <div className="space-y-4">
          {!closed && (
            <Panel title="Move order">
              <p className="mb-3 text-sm text-ink-soft">
                Now: <strong>{STATUS_META[o.status].label}</strong>
              </p>
              <StatusControl orderId={o.id} options={options} />
            </Panel>
          )}
          {!closed && (
            <Panel title="Send a design preview">
              <PreviewSender orderId={o.id} canSend={canSendPreview} />
            </Panel>
          )}
          {pending && (o.status === "PREVIEW_SENT" || o.status === "CUSTOMER_APPROVAL_PENDING") && (
            <Panel title="Record customer's response" tone="warn">
              <RecordDecision orderId={o.id} previewId={pending.id} version={pending.version} />
            </Panel>
          )}
          {o.paymentStatus !== "PAID" && o.status !== "CANCELLED" && (
            <Panel title="Record offline payment" tone="warn">
              <PaymentForm orderId={o.id} total={String(o.totalPaise / 100)} />
            </Panel>
          )}

          <Panel title="Money">
            <dl className="space-y-1.5 text-sm">
              <Line k="Keepsake" v={formatINR(o.unitPricePaise)} />
              {o.optionsPricePaise > 0 && <Line k="Options" v={formatINR(o.optionsPricePaise)} />}
              <Line k="Shipping charged" v={formatINR(o.shippingPaise)} />
              <Line k="Total" v={formatINR(o.totalPaise)} strong />
              <Line k="Manufacturing cost" v={o.productionCostPaise != null ? formatINR(o.productionCostPaise) : "–"} />
              <Line k="Shipping cost" v={o.shippingCostPaise != null ? formatINR(o.shippingCostPaise) : "–"} />
              <Line k="Gross margin" v={marginPaise != null ? `${formatINR(marginPaise)} (${Math.round((marginPaise / o.totalPaise) * 100)}%)` : "Add costs"} strong />
            </dl>
            {payments.length > 0 && (
              <ul className="mt-3 space-y-1 border-t border-line pt-3 text-xs text-ink-mute">
                {payments.map((p) => (
                  <li key={p.id}>
                    {p.provider} · {p.status} · {formatINR(p.amountPaise)} {p.method ? `· ${p.method}` : ""} {p.reference ? `· ${p.reference}` : ""} {p.providerPaymentId ? `· ${p.providerPaymentId}` : ""}
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-4 border-t border-line pt-4">
              <CostsForm orderId={o.id} initial={{ production: o.productionCostPaise != null ? String(o.productionCostPaise / 100) : "", shipping: o.shippingCostPaise != null ? String(o.shippingCostPaise / 100) : "", partner: o.productionPartner ?? "" }} />
            </div>
          </Panel>

          <Panel title="Shipping">
            <address className="mb-4 text-sm not-italic leading-relaxed text-ink-soft">
              {o.shipName} · {o.shipPhone}
              <br />
              {o.shipLine1}
              {o.shipLine2 ? `, ${o.shipLine2}` : ""}
              <br />
              {o.shipCity}, {o.shipState} {o.shipPincode}
              {o.isGift && (
                <>
                  <br />
                  <strong className="text-clay">Gift: no invoice in box.</strong> {o.giftNote && `Card: “${o.giftNote}”`}
                </>
              )}
            </address>
            <ShippingForm orderId={o.id} initial={{ courier: o.courier ?? "", trackingNumber: o.trackingNumber ?? "", trackingUrl: o.trackingUrl ?? "" }} />
          </Panel>

          <Panel title="Customer">
            <p className="text-sm">
              {customer?.name}
              <br />
              <a className="underline" href={`mailto:${customer?.email}`}>
                {customer?.email}
              </a>
              {customer?.phone && (
                <>
                  <br />
                  {customer.phone}
                </>
              )}
            </p>
            {memory && (
              <p className="mt-3 text-sm">
                Memory page: <Link href={`/account/memories/${memory.id}`} className="underline">manage</Link>
              </p>
            )}
          </Panel>

          <Panel title="Notes">
            <NoteForm orderId={o.id} />
          </Panel>

          {!closed && o.status !== "SHIPPED" && (
            <div className="px-1">
              <CancelForm orderId={o.id} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Item({ k, v, wide }: { k: string; v?: string | null; wide?: boolean }) {
  if (!v && wide) return null;
  return (
    <div className={wide ? "sm:col-span-3" : ""}>
      <dt className="text-ink-mute">{k}</dt>
      <dd className="mt-0.5">{v || "–"}</dd>
    </div>
  );
}

function Line({ k, v, strong }: { k: string; v: string; strong?: boolean }) {
  return (
    <div className={`flex justify-between gap-4 ${strong ? "font-medium" : ""}`}>
      <dt className={strong ? "" : "text-ink-soft"}>{k}</dt>
      <dd className="tabular-nums">{v}</dd>
    </div>
  );
}
