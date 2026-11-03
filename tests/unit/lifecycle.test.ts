import { describe, expect, it } from "vitest";
import { canTransition, type TransitionContext } from "@/lib/lifecycle";

const base: TransitionContext = { status: "ORDER_RECEIVED", paymentStatus: "PENDING", approvedPreviewId: null, approvedAt: null, trackingNumber: null, courier: null };
const approved = { ...base, approvedPreviewId: "p1", approvedAt: new Date() };

describe("order lifecycle", () => {
  it("allows the normal early path", () => {
    expect(canTransition(base, "PHOTOS_REVIEW").ok).toBe(true);
    expect(canTransition({ ...base, status: "PHOTOS_REVIEW" }, "DESIGN_IN_PROGRESS").ok).toBe(true);
  });

  it("never lets production start without an approved preview", () => {
    for (const to of ["APPROVED_FOR_PRODUCTION", "PRINTING", "PAINTING_AND_FINISHING", "QUALITY_CHECK", "PACKAGED", "SHIPPED", "DELIVERED"] as const) {
      for (const from of ["DESIGN_IN_PROGRESS", "PREVIEW_SENT", "CUSTOMER_APPROVAL_PENDING", "APPROVED_FOR_PRODUCTION"] as const) {
        expect(canTransition({ ...base, status: from, paymentStatus: "PAID" }, to).ok).toBe(false);
      }
    }
  });

  it("doesn't allow a manual jump to approved — approval must go through the approval flow", () => {
    expect(canTransition({ ...approved, status: "CUSTOMER_APPROVAL_PENDING" }, "APPROVED_FOR_PRODUCTION", "manual").ok).toBe(false);
    expect(canTransition({ ...approved, status: "CUSTOMER_APPROVAL_PENDING" }, "APPROVED_FOR_PRODUCTION", "approval").ok).toBe(true);
  });

  it("requires payment before printing", () => {
    const r = canTransition({ ...approved, status: "APPROVED_FOR_PRODUCTION" }, "PRINTING");
    expect(r.ok).toBe(false);
    expect(canTransition({ ...approved, status: "APPROVED_FOR_PRODUCTION", paymentStatus: "PAID" }, "PRINTING").ok).toBe(true);
  });

  it("requires tracking before shipping", () => {
    const packed = { ...approved, status: "PACKAGED" as const, paymentStatus: "PAID" as const };
    expect(canTransition(packed, "SHIPPED").ok).toBe(false);
    expect(canTransition({ ...packed, courier: "Delhivery", trackingNumber: "123" }, "SHIPPED").ok).toBe(true);
  });

  it("prevents skipping steps", () => {
    expect(canTransition(base, "SHIPPED").ok).toBe(false);
    expect(canTransition({ ...approved, status: "PRINTING", paymentStatus: "PAID" }, "PACKAGED").ok).toBe(false);
  });

  it("closes delivered and cancelled orders; can't cancel once shipped", () => {
    expect(canTransition({ ...approved, status: "DELIVERED" }, "CANCELLED").ok).toBe(false);
    expect(canTransition({ ...base, status: "CANCELLED" }, "PHOTOS_REVIEW").ok).toBe(false);
    expect(canTransition({ ...approved, status: "SHIPPED" }, "CANCELLED").ok).toBe(false);
    expect(canTransition({ ...base, status: "DESIGN_IN_PROGRESS" }, "CANCELLED").ok).toBe(true);
  });

  it("previews can only be sent during design", () => {
    expect(canTransition({ ...base, status: "DESIGN_IN_PROGRESS" }, "PREVIEW_SENT", "preview").ok).toBe(true);
    expect(canTransition({ ...approved, status: "PRINTING" }, "PREVIEW_SENT", "preview").ok).toBe(false);
  });
});
