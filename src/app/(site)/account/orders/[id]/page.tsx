import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { requireUserPage } from "@/lib/auth";
import { getOrderDetail } from "@/lib/orders";
import { getSettings } from "@/lib/catalog";
import { STATUS_META } from "@/lib/lifecycle";
import { formatINR } from "@/lib/money";
import { razorpayConfig } from "@/lib/razorpay";
import { StatusBadge, StatusTimeline } from "@/components/account/StatusTimeline";
import { PreviewDecision } from "@/components/account/PreviewDecision";
import { PayPanel } from "@/components/account/PayPanel";
import { ReviewForm } from "@/components/account/ReviewForm";

export const metadata: Metadata = { title: "Your order", robots: { index: false } };
export const dynamic = "force-dynamic";

const STORY_LABELS: Record<string, string> = {
  smile: "Always makes us smile",
  toy: "Favourite toy",
  sleeping: "Sleeps like",
  personality: "Personality",
  nickname: "Nicknames",
  freezeMoment: "The moment to freeze forever",
};

export default async function OrderPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ placed?: string }> }) {
  const { id } = await params;
  const { placed } = await searchParams;
  const user = await requireUserPage(`/account/orders/${id}`);
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const detail = await getOrderDetail(id);
  // Customers only ever see their own orders. A wrong id is simply "not found".
  if (!detail || detail.order.userId !== user.id) notFound();
  const { order: o, photos, previews, events, memory } = detail;
  const [settings, review] = await Promise.all([
    getSettings(),
    db.select({ id: schema.reviews.id, status: schema.reviews.status }).from(schema.reviews).where(eq(schema.reviews.orderId, o.id)),
  ]);
  const rzp = razorpayConfig();
  const pendingPreview = previews.find((p) => p.decision === "PENDING");
  const approved = previews.find((p) => p.decision === "APPROVED");
  const shownPreview = pendingPreview ?? approved ?? previews[0];
  const petPhotos = photos.filter((p) => p.caption !== "owner");
  const ownerPhotos = photos.filter((p) => p.caption === "owner");
  const publicEvents = events.filter((e) => e.visibleToCustomer);

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-6 sm:px-6 lg:px-8">
      <Link href="/account" className="text-sm text-ink-mute hover:text-ink">
        ← My keepsakes
      </Link>

      {placed && (
        <div className="mt-6 overflow-hidden rounded-[1.5rem] bg-night p-7 text-ivory sm:p-10">
          <p className="eyebrow !text-clay-soft">Order {o.number} received</p>
          <p className="mt-3 font-display text-3xl leading-tight sm:text-4xl">
            Thank you. We can&apos;t wait to meet <em className="italic-soft text-[#e7c3a5]">{o.petName}</em>.
          </p>
          <p className="mt-3 max-w-2xl text-[#d8cdc1]">
            Our artist will study your photos and story and send you a design preview here, usually within 3–5 working days. Nothing is made until you approve it.
          </p>
        </div>
      )}

      <header className="mt-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl sm:text-5xl">{o.petName}</h1>
          <p className="mt-2 text-ink-soft">
            {o.snapshot.productName} · {o.snapshot.variantName}
          </p>
          <p className="mt-1 text-sm text-ink-mute">
            Order {o.number} · placed {o.createdAt.toLocaleDateString("en-IN", { dateStyle: "medium" })}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusBadge status={o.status} />
          {o.paymentStatus === "PAID" ? <span className="chip !bg-sage-soft !text-sage">Paid</span> : o.status !== "CANCELLED" && <span className="chip !bg-[#f6e6d9] !text-clay">Payment pending</span>}
        </div>
      </header>

      <div className="mt-6 max-w-2xl">
        <StatusTimeline status={o.status} />
        <p className="mt-4 text-ink-soft">{STATUS_META[o.status].customer}</p>
        {o.status === "CANCELLED" && o.cancelReason && <p className="mt-1 text-sm text-ink-mute">Reason: {o.cancelReason}</p>}
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-8">
          {o.paymentStatus !== "PAID" && o.status !== "CANCELLED" && (
            <PayPanel orderId={o.id} amountLabel={formatINR(o.totalPaise)} online={!!rzp} testMode={!!rzp?.testMode} manualInstructions={settings.manualPaymentInstructions} />
          )}

          {/* Design preview */}
          <section id="preview" className="scroll-mt-24" aria-labelledby="preview-h">
            <h2 id="preview-h" className="text-2xl">
              Design preview
            </h2>
            {!shownPreview ? (
              <div className="card paper-grain mt-4 p-6">
                <p className="font-display text-lg">Your artist is working on it</p>
                <p className="mt-1 text-sm leading-relaxed text-ink-soft">
                  Our artists will prepare your personalised design and send you a preview for approval before production. We&apos;ll notify you by email and here.
                </p>
              </div>
            ) : (
              <div className="card mt-4 overflow-hidden">
                <div className={`grid gap-1 ${shownPreview.uploadIds.length > 1 ? "grid-cols-2" : ""}`}>
                  {shownPreview.uploadIds.map((uid) => (
                    <a key={uid} href={`/api/files/${uid}`} target="_blank" rel="noreferrer" className="block bg-sand">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={`/api/files/${uid}`} alt={`Design preview version ${shownPreview.version}`} className="aspect-square w-full object-contain" />
                    </a>
                  ))}
                </div>
                <div className="p-5 sm:p-6">
                  <p className="text-sm text-ink-mute">
                    Version {shownPreview.version} · {shownPreview.createdAt.toLocaleDateString("en-IN", { dateStyle: "medium" })}
                  </p>
                  {shownPreview.artistNote && <p className="mt-2 font-display text-lg italic leading-relaxed">&ldquo;{shownPreview.artistNote}&rdquo;</p>}
                  <div className="mt-5">
                    {pendingPreview && (o.status === "PREVIEW_SENT" || o.status === "CUSTOMER_APPROVAL_PENDING") ? (
                      <PreviewDecision orderId={o.id} previewId={pendingPreview.id} petName={o.petName} markViewed={o.status === "PREVIEW_SENT"} />
                    ) : shownPreview.decision === "APPROVED" ? (
                      <p className="rounded-2xl bg-sage-soft p-4 text-sm">
                        You approved this design on {shownPreview.decidedAt?.toLocaleDateString("en-IN", { dateStyle: "medium" })}
                        {shownPreview.decidedVia === "ADMIN_RECORDED" ? " (recorded by our studio from your message)" : ""}.
                      </p>
                    ) : (
                      <p className="rounded-2xl bg-sand p-4 text-sm">You asked for changes. Our artist is working on a new version.</p>
                    )}
                  </div>
                </div>
                {previews.length > 1 && (
                  <details className="border-t border-line px-5 py-4 sm:px-6">
                    <summary className="cursor-pointer text-sm font-medium">Earlier versions ({previews.length - 1})</summary>
                    <ul className="mt-3 space-y-3">
                      {previews
                        .filter((p) => p.id !== shownPreview.id)
                        .map((p) => (
                          <li key={p.id} className="flex gap-3 text-sm">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={`/api/files/${p.uploadIds[0]}?v=thumb`} alt="" className="h-14 w-14 rounded-lg object-cover" />
                            <div>
                              <p>Version {p.version}</p>
                              {p.customerFeedback && <p className="text-ink-soft">Your feedback: {p.customerFeedback}</p>}
                            </div>
                          </li>
                        ))}
                    </ul>
                  </details>
                )}
              </div>
            )}
          </section>

          {/* Shipping */}
          {(o.status === "SHIPPED" || o.status === "DELIVERED") && (
            <section aria-labelledby="ship-h" className="card p-6">
              <h2 id="ship-h" className="text-2xl">
                Tracking
              </h2>
              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-ink-mute">Courier</dt>
                  <dd className="font-medium">{o.courier}</dd>
                </div>
                <div>
                  <dt className="text-ink-mute">Tracking number</dt>
                  <dd className="font-medium">{o.trackingNumber}</dd>
                </div>
              </dl>
              {o.trackingUrl && /^https:\/\//.test(o.trackingUrl) && (
                <a href={o.trackingUrl} target="_blank" rel="noreferrer noopener" className="btn btn-ghost btn-sm mt-4">
                  Track your parcel ↗
                </a>
              )}
            </section>
          )}

          {o.status === "DELIVERED" && review.length === 0 && <ReviewForm orderId={o.id} defaultName={user.name.split(" ")[0]} petName={o.petName} />}
          {review.length > 0 && <p className="text-sm text-ink-mute">Thank you for your review{review[0].status === "PENDING" ? ". It's waiting for our studio to check it." : "."}</p>}

          {/* What you told us */}
          <section aria-labelledby="details-h">
            <h2 id="details-h" className="text-2xl">
              What you shared
            </h2>
            <div className="card mt-4 p-5 sm:p-6">
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                {petPhotos.map((p) => (
                  <a key={p.id} href={`/api/files/${p.id}`} target="_blank" rel="noreferrer">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/api/files/${p.id}?v=thumb`} alt="" className="aspect-square w-full rounded-lg object-cover" />
                  </a>
                ))}
              </div>
              {ownerPhotos.length > 0 && (
                <>
                  <p className="mt-4 text-sm text-ink-mute">Photos of you</p>
                  <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-5">
                    {ownerPhotos.map((p) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img key={p.id} src={`/api/files/${p.id}?v=thumb`} alt="" className="aspect-square w-full rounded-lg object-cover" />
                    ))}
                  </div>
                </>
              )}
              <dl className="mt-6 grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
                <Item k="Animal" v={`${o.breed} ${o.animalType.toLowerCase()}${o.petAge ? `, ${o.petAge}` : ""}`} />
                <Item k="Pose" v={o.snapshot.poseLabel} />
                <Item k="Base" v={o.snapshot.baseLabel} />
                <Item k="Engraving" v={o.engravedName} />
                {o.importantDate && <Item k={o.importantDateLabel || "Date"} v={new Date(o.importantDate).toLocaleDateString("en-IN", { dateStyle: "medium" })} />}
                {o.message && <Item k="Message" v={o.message} />}
                {o.poseNotes && <Item k="Pose notes" v={o.poseNotes} wide />}
                {o.ownerNotes && <Item k="About you" v={o.ownerNotes} wide />}
                {o.specialInstructions && <Item k="Special instructions" v={o.specialInstructions} wide />}
              </dl>
              {Object.entries(o.story).some(([, v]) => v) && (
                <div className="mt-6 space-y-3 border-t border-line pt-5">
                  {Object.entries(o.story)
                    .filter(([, v]) => v)
                    .map(([k, v]) => (
                      <div key={k}>
                        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-clay">{STORY_LABELS[k] ?? k}</p>
                        <p className="mt-0.5 font-display text-[1.02rem] leading-relaxed">{v}</p>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          {memory && (
            <div className="rounded-[1.25rem] bg-sage-soft/70 p-6">
              <p className="font-display text-xl">{o.petName}&apos;s memory page</p>
              <p className="mt-1 text-sm text-ink-soft">Add photos, videos and voice notes whenever you like. Private unless you share it.</p>
              <div className="mt-4 flex gap-2">
                <Link href={`/account/memories/${memory.id}`} className="btn btn-primary btn-sm">
                  Add memories
                </Link>
                <Link href={`/m/${memory.slug}`} className="btn btn-ghost btn-sm">
                  View
                </Link>
              </div>
            </div>
          )}

          <div className="card p-6">
            <p className="font-display text-lg">Summary</p>
            <dl className="mt-4 space-y-1.5 text-sm">
              <div className="flex justify-between">
                <dt className="text-ink-soft">{o.snapshot.variantName}</dt>
                <dd>{formatINR(o.unitPricePaise)}</dd>
              </div>
              {o.optionsPricePaise > 0 && (
                <div className="flex justify-between">
                  <dt className="text-ink-soft">Options</dt>
                  <dd>{formatINR(o.optionsPricePaise)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-ink-soft">Delivery</dt>
                <dd>{o.shippingPaise ? formatINR(o.shippingPaise) : "Free"}</dd>
              </div>
              <div className="flex justify-between border-t border-line pt-2 font-medium">
                <dt>Total</dt>
                <dd className="font-display text-lg">{formatINR(o.totalPaise)}</dd>
              </div>
            </dl>
          </div>

          <div className="card p-6 text-sm">
            <p className="font-display text-lg">Delivering to</p>
            <address className="mt-3 not-italic leading-relaxed text-ink-soft">
              {o.shipName}
              <br />
              {o.shipLine1}
              {o.shipLine2 && (
                <>
                  <br />
                  {o.shipLine2}
                </>
              )}
              <br />
              {o.shipCity}, {o.shipState} {o.shipPincode}
              <br />
              {o.shipPhone}
            </address>
            {o.isGift && <p className="mt-3 text-ink-mute">Gift wrapped, no prices in the box{o.giftNote ? `. Card: "${o.giftNote}"` : ""}</p>}
          </div>

          <div className="card p-6">
            <p className="font-display text-lg">History</p>
            <ol className="mt-4 space-y-4 border-l border-line pl-4">
              {publicEvents.map((e) => (
                <li key={e.id} className="relative text-sm">
                  <span className="absolute -left-[1.32rem] top-1.5 h-2 w-2 rounded-full bg-clay-soft" aria-hidden />
                  <p className="text-ink">{e.toStatus ? STATUS_META[e.toStatus].label : e.type === "PAYMENT" ? "Payment" : "Update"}</p>
                  {e.message && <p className="text-ink-soft">{e.message}</p>}
                  <p className="text-xs text-ink-mute">{e.createdAt.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</p>
                </li>
              ))}
            </ol>
          </div>
          <p className="text-sm text-ink-mute">
            Questions? Email <a className="underline" href={`mailto:${settings.contactEmail}`}>{settings.contactEmail}</a> and mention {o.number}.
          </p>
        </aside>
      </div>
    </div>
  );
}

function Item({ k, v, wide }: { k: string; v?: string | null; wide?: boolean }) {
  return (
    <div className={wide ? "sm:col-span-2" : ""}>
      <dt className="text-ink-mute">{k}</dt>
      <dd className="mt-0.5">{v || "–"}</dd>
    </div>
  );
}
