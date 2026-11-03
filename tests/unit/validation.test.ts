import { describe, expect, it } from "vitest";
import { deliverySchema, petSchema, personaliseSchema } from "@/lib/validation";
import { formatINR, rupeesToPaise } from "@/lib/money";

const id = () => crypto.randomUUID();

describe("wizard validation", () => {
  it("requires 3–5 photos", () => {
    const base = { petName: "Bruno", animalType: "Dog", breed: "Indie" };
    expect(petSchema.safeParse({ ...base, photoIds: [id(), id()] }).success).toBe(false);
    expect(petSchema.safeParse({ ...base, photoIds: [id(), id(), id()] }).success).toBe(true);
    expect(petSchema.safeParse({ ...base, photoIds: Array.from({ length: 6 }, id) }).success).toBe(false);
  });
  it("limits engraving length", () => {
    const p = { productSlug: "x", variantId: id(), engravedName: "A".repeat(25) };
    expect(personaliseSchema.safeParse(p).success).toBe(false);
    expect(personaliseSchema.safeParse({ ...p, engravedName: "Bruno" }).success).toBe(true);
  });
  it("validates Indian phone numbers and PIN codes", () => {
    const d = { shipName: "Asha", shipPhone: "98765 43210", shipLine1: "12 MG Road", shipCity: "Pune", shipState: "Maharashtra", shipPincode: "411001" };
    const ok = deliverySchema.safeParse(d);
    expect(ok.success && ok.data.shipPhone).toBe("9876543210");
    expect(deliverySchema.safeParse({ ...d, shipPhone: "12345" }).success).toBe(false);
    expect(deliverySchema.safeParse({ ...d, shipPincode: "011001" }).success).toBe(false);
  });
});

describe("money", () => {
  it("formats INR and converts rupees to paise", () => {
    expect(formatINR(149900)).toBe("₹1,499");
    expect(formatINR(10000000)).toBe("₹1,00,000");
    expect(rupeesToPaise("1,499")).toBe(149900);
    expect(rupeesToPaise("650.5")).toBe(65050);
    expect(() => rupeesToPaise("-5")).toThrow();
  });
});
