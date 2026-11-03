import { z } from "zod";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Please keep this under ${max} characters.`)
    .optional()
    .transform((v) => (v ? v : undefined));

export const ANIMAL_TYPES = ["Dog", "Cat", "Rabbit", "Bird", "Other"] as const;

export const petSchema = z.object({
  petName: z.string().trim().min(1, "What's their name?").max(40),
  animalType: z.enum(ANIMAL_TYPES, { message: "Choose the kind of animal." }),
  breed: z.string().trim().min(1, "Tell us their breed, or 'Indie' / 'Not sure'.").max(60),
  petAge: optionalText(30),
  photoIds: z.array(z.uuid()).min(3, "Please add at least 3 photos.").max(5, "Up to 5 photos, please."),
});

export const storySchema = z.object({
  smile: optionalText(600),
  toy: optionalText(200),
  sleeping: optionalText(300),
  personality: optionalText(800),
  nickname: optionalText(120),
  freezeMoment: optionalText(800),
});

export const personaliseSchema = z.object({
  productSlug: z.string().min(1, "Choose an edition."),
  variantId: z.uuid({ message: "Choose a size." }),
  poseOptionId: z.uuid().optional(),
  baseOptionId: z.uuid().optional(),
  poseNotes: optionalText(400),
  engravedName: z.string().trim().min(1, "What should we engrave?").max(24, "Engravings fit up to 24 characters."),
  message: optionalText(140),
  importantDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .or(z.literal("").transform(() => undefined)),
  importantDateLabel: optionalText(40),
  ownerNotes: optionalText(600),
  ownerPhotoIds: z.array(z.uuid()).max(3, "Up to 3 photos of you, please.").default([]),
  specialInstructions: optionalText(1000),
  wantsMemoryPage: z.boolean().default(true),
});

export const deliverySchema = z.object({
  shipName: z.string().trim().min(2, "Who should we deliver to?").max(80),
  shipPhone: z
    .string()
    .trim()
    .transform((v) => v.replace(/[\s-]/g, ""))
    .pipe(z.string().regex(/^(\+91)?[6-9]\d{9}$/, "Enter a 10-digit Indian mobile number.")),
  shipLine1: z.string().trim().min(3, "House / flat and street, please.").max(120),
  shipLine2: optionalText(120),
  shipCity: z.string().trim().min(2, "City?").max(60),
  shipState: z.string().trim().min(2, "State?").max(60),
  shipPincode: z.string().trim().regex(/^[1-9]\d{5}$/, "A 6-digit PIN code."),
  isGift: z.boolean().default(false),
  giftNote: optionalText(300),
});

export const orderInputSchema = z.object({
  idempotencyKey: z.string().min(16).max(64),
  pet: petSchema,
  story: storySchema,
  personalise: personaliseSchema,
  delivery: deliverySchema,
});
export type OrderInput = z.infer<typeof orderInputSchema>;

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Your name, please.").max(80),
  email: z.email("That email doesn't look right.").transform((v) => v.toLowerCase().trim()),
  phone: z
    .string()
    .trim()
    .transform((v) => v.replace(/[\s-]/g, ""))
    .pipe(z.string().regex(/^(\+91)?[6-9]\d{9}$/, "Enter a 10-digit Indian mobile number."))
    .optional()
    .or(z.literal("").transform(() => undefined)),
  password: z.string().min(8, "At least 8 characters.").max(200),
});

export const loginSchema = z.object({
  email: z.email().transform((v) => v.toLowerCase().trim()),
  password: z.string().min(1).max(200),
});

export function firstError(e: z.ZodError): string {
  return e.issues[0]?.message ?? "Please check the form.";
}

export function fieldErrors(e: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const i of e.issues) {
    const k = i.path.join(".");
    if (!out[k]) out[k] = i.message;
  }
  return out;
}
