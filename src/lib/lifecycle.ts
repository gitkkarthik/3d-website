import type { OrderStatus, PaymentStatus } from "./db/schema";

/** Customer-facing language for each status. Honest about what is manual. */
export const STATUS_META: Record<OrderStatus, { label: string; customer: string; stage: number }> = {
  ORDER_RECEIVED: { label: "Order received", customer: "We have your order and your photos.", stage: 0 },
  PHOTOS_REVIEW: { label: "Reviewing photos", customer: "Our artist is studying your photos and story.", stage: 0 },
  DESIGN_IN_PROGRESS: { label: "Design in progress", customer: "Your pet's design is being sculpted by hand.", stage: 1 },
  PREVIEW_SENT: { label: "Preview ready", customer: "Your design preview is ready for you to review.", stage: 1 },
  CUSTOMER_APPROVAL_PENDING: { label: "Awaiting your approval", customer: "We're waiting for your approval before we make it.", stage: 1 },
  APPROVED_FOR_PRODUCTION: { label: "Approved for production", customer: "You approved the design. It's queued for making.", stage: 2 },
  PRINTING: { label: "Printing", customer: "Your keepsake is being 3D printed.", stage: 2 },
  PAINTING_AND_FINISHING: { label: "Painting & finishing", customer: "Being hand-painted and finished.", stage: 2 },
  QUALITY_CHECK: { label: "Quality check", customer: "We're checking every detail against your photos.", stage: 2 },
  PACKAGED: { label: "Packaged", customer: "Wrapped and ready to leave the studio.", stage: 3 },
  SHIPPED: { label: "Shipped", customer: "On its way to you.", stage: 3 },
  DELIVERED: { label: "Delivered", customer: "Delivered. We hope it feels like them.", stage: 4 },
  CANCELLED: { label: "Cancelled", customer: "This order was cancelled.", stage: -1 },
};

export const CUSTOMER_STAGES = ["Received", "Design", "Making", "On its way", "Home"] as const;

const PRODUCTION: OrderStatus[] = [
  "APPROVED_FOR_PRODUCTION",
  "PRINTING",
  "PAINTING_AND_FINISHING",
  "QUALITY_CHECK",
  "PACKAGED",
  "SHIPPED",
  "DELIVERED",
];

export function isProductionStatus(s: OrderStatus) {
  return PRODUCTION.includes(s);
}

/**
 * Transitions an admin may make with the generic "move to" control.
 * Preview → approval transitions are deliberately absent: they only happen through
 * the preview upload and approval flows, which record who approved what and when.
 */
export const MANUAL_TRANSITIONS: Partial<Record<OrderStatus, OrderStatus[]>> = {
  ORDER_RECEIVED: ["PHOTOS_REVIEW"],
  PHOTOS_REVIEW: ["DESIGN_IN_PROGRESS"],
  DESIGN_IN_PROGRESS: [],
  PREVIEW_SENT: ["CUSTOMER_APPROVAL_PENDING", "DESIGN_IN_PROGRESS"],
  CUSTOMER_APPROVAL_PENDING: ["DESIGN_IN_PROGRESS"],
  APPROVED_FOR_PRODUCTION: ["PRINTING"],
  PRINTING: ["PAINTING_AND_FINISHING"],
  PAINTING_AND_FINISHING: ["QUALITY_CHECK"],
  QUALITY_CHECK: ["PACKAGED", "PRINTING"],
  PACKAGED: ["SHIPPED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};

const CANCELLABLE: OrderStatus[] = [
  "ORDER_RECEIVED",
  "PHOTOS_REVIEW",
  "DESIGN_IN_PROGRESS",
  "PREVIEW_SENT",
  "CUSTOMER_APPROVAL_PENDING",
  "APPROVED_FOR_PRODUCTION",
  "PRINTING",
  "PAINTING_AND_FINISHING",
  "QUALITY_CHECK",
  "PACKAGED",
];

export type TransitionContext = {
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  approvedPreviewId: string | null;
  approvedAt: Date | null;
  trackingNumber: string | null;
  courier: string | null;
};

export type TransitionResult = { ok: true } | { ok: false; reason: string };

/** Single source of truth for whether an order may move to `to`. Enforced server-side. */
export function canTransition(o: TransitionContext, to: OrderStatus, via: "manual" | "preview" | "approval" | "changes" = "manual"): TransitionResult {
  if (o.status === to) return { ok: false, reason: "The order is already in that status." };
  if (o.status === "CANCELLED" || o.status === "DELIVERED") return { ok: false, reason: "This order is closed." };

  if (to === "CANCELLED") {
    return CANCELLABLE.includes(o.status) ? { ok: true } : { ok: false, reason: "Shipped orders can't be cancelled." };
  }

  // Hard rule: nothing is produced without the customer's approval of a preview.
  if (isProductionStatus(to) && (!o.approvedPreviewId || !o.approvedAt)) {
    return { ok: false, reason: "Production can't start until the customer approves a design preview." };
  }

  if (via === "preview") {
    return ["PHOTOS_REVIEW", "DESIGN_IN_PROGRESS", "PREVIEW_SENT", "CUSTOMER_APPROVAL_PENDING"].includes(o.status) && to === "PREVIEW_SENT"
      ? { ok: true }
      : { ok: false, reason: "A preview can only be sent while the design is in progress." };
  }
  if (via === "approval") {
    return ["PREVIEW_SENT", "CUSTOMER_APPROVAL_PENDING"].includes(o.status) && to === "APPROVED_FOR_PRODUCTION"
      ? { ok: true }
      : { ok: false, reason: "There's no preview waiting for approval." };
  }
  if (via === "changes") {
    return ["PREVIEW_SENT", "CUSTOMER_APPROVAL_PENDING"].includes(o.status) && to === "DESIGN_IN_PROGRESS"
      ? { ok: true }
      : { ok: false, reason: "There's no preview waiting for feedback." };
  }

  const allowed = MANUAL_TRANSITIONS[o.status] ?? [];
  if (!allowed.includes(to)) {
    return { ok: false, reason: `Can't move from ${STATUS_META[o.status].label} to ${STATUS_META[to].label}.` };
  }
  if (to === "PRINTING" && o.paymentStatus !== "PAID") {
    return { ok: false, reason: "Record payment before sending the order to the printer." };
  }
  if (to === "SHIPPED" && (!o.trackingNumber || !o.courier)) {
    return { ok: false, reason: "Add the courier and tracking number before marking as shipped." };
  }
  return { ok: true };
}

/** Which notifications a customer should get for a status change. */
export function customerMessageFor(to: OrderStatus, petName: string): { title: string; body: string } | null {
  switch (to) {
    case "PHOTOS_REVIEW":
      return { title: `We're getting to know ${petName}`, body: "Our artist has started studying your photos and story." };
    case "DESIGN_IN_PROGRESS":
      return { title: `${petName}'s design is underway`, body: "Our artist is sculpting the design. We'll send a preview for your approval." };
    case "PREVIEW_SENT":
      return { title: `${petName}'s preview is ready`, body: "Please take a look and approve it, or tell us what to change. Nothing is made until you approve." };
    case "APPROVED_FOR_PRODUCTION":
      return { title: "Approved. Thank you!", body: `${petName}'s keepsake is now queued for production.` };
    case "PRINTING":
      return { title: `${petName} is being printed`, body: "The first physical form of your keepsake is taking shape." };
    case "PAINTING_AND_FINISHING":
      return { title: "Hand-painting has begun", body: `Our painters are bringing ${petName}'s colours and markings to life.` };
    case "QUALITY_CHECK":
      return { title: "Final quality check", body: "We're checking every detail against your photos." };
    case "PACKAGED":
      return { title: "Wrapped with care", body: `${petName}'s keepsake is packed and ready to leave the studio.` };
    case "SHIPPED":
      return { title: "It's on its way", body: "Your keepsake has shipped. Tracking details are on your order page." };
    case "DELIVERED":
      return { title: "Delivered", body: `We hope ${petName}'s keepsake feels just like them.` };
    case "CANCELLED":
      return { title: "Your order was cancelled", body: "If you didn't expect this, just reply and we'll help." };
    default:
      return null;
  }
}
