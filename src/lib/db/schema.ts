import {
  pgTable,
  pgEnum,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  uniqueIndex,
  index,
  date,
} from "drizzle-orm/pg-core";

/* ───────────────────────────── Enums ───────────────────────────── */

export const roleEnum = pgEnum("role", ["CUSTOMER", "ADMIN"]);

export const ORDER_STATUSES = [
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
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];
export const orderStatusEnum = pgEnum("order_status", ORDER_STATUSES);

export const paymentStatusEnum = pgEnum("payment_status", ["PENDING", "PAID", "FAILED", "REFUNDED"]);
export type PaymentStatus = (typeof paymentStatusEnum.enumValues)[number];

export const optionKindEnum = pgEnum("option_kind", ["POSE", "BASE"]);

export const uploadKindEnum = pgEnum("upload_kind", [
  "PET_PHOTO",
  "PREVIEW",
  "MEMORY_IMAGE",
  "MEMORY_VIDEO",
  "MEMORY_AUDIO",
]);
export type UploadKind = (typeof uploadKindEnum.enumValues)[number];

export const previewDecisionEnum = pgEnum("preview_decision", ["PENDING", "APPROVED", "CHANGES_REQUESTED"]);

export const paymentProviderEnum = pgEnum("payment_provider", ["RAZORPAY", "MANUAL"]);
export const paymentRecordStatusEnum = pgEnum("payment_record_status", ["CREATED", "CAPTURED", "FAILED", "REFUNDED"]);

export const reviewStatusEnum = pgEnum("review_status", ["PENDING", "PUBLISHED", "HIDDEN"]);
export const visibilityEnum = pgEnum("memory_visibility", ["PRIVATE", "LINK"]);

/* ───────────────────────────── Identity ───────────────────────────── */

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  phone: text("phone"),
  passwordHash: text("password_hash").notNull(),
  role: roleEnum("role").notNull().default("CUSTOMER"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const sessions = pgTable(
  "sessions",
  {
    // sha256 of the cookie token — the raw token never touches the database.
    id: text("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("sessions_user_idx").on(t.userId)],
);

/* ───────────────────────────── Catalogue ───────────────────────────── */

export const products = pgTable("products", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  tagline: text("tagline").notNull(),
  description: text("description").notNull(),
  story: text("story").notNull(),
  includes: jsonb("includes").$type<string[]>().notNull().default([]),
  leadTimeMinDays: integer("lead_time_min_days").notNull().default(12),
  leadTimeMaxDays: integer("lead_time_max_days").notNull().default(18),
  includesMemoryPage: boolean("includes_memory_page").notNull().default(false),
  includesOwner: boolean("includes_owner").notNull().default(false),
  isMemorial: boolean("is_memorial").notNull().default(false),
  renderKey: text("render_key").notNull().default("dog-sitting"),
  seoTitle: text("seo_title"),
  seoDescription: text("seo_description"),
  active: boolean("active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const productVariants = pgTable("product_variants", {
  id: uuid("id").primaryKey().defaultRandom(),
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  pricePaise: integer("price_paise").notNull(),
  active: boolean("active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const productOptions = pgTable("product_options", {
  id: uuid("id").primaryKey().defaultRandom(),
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  kind: optionKindEnum("kind").notNull(),
  label: text("label").notNull(),
  description: text("description").notNull().default(""),
  priceDeltaPaise: integer("price_delta_paise").notNull().default(0),
  active: boolean("active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ───────────────────────────── Orders ───────────────────────────── */

export type StoryAnswers = {
  smile?: string;
  toy?: string;
  sleeping?: string;
  personality?: string;
  nickname?: string;
  freezeMoment?: string;
};

export type ProductSnapshot = {
  productName: string;
  productSlug: string;
  variantName: string;
  poseLabel: string | null;
  baseLabel: string | null;
};

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    number: text("number").notNull().unique(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    idempotencyKey: text("idempotency_key").notNull(),
    status: orderStatusEnum("status").notNull().default("ORDER_RECEIVED"),
    paymentStatus: paymentStatusEnum("payment_status").notNull().default("PENDING"),

    productId: uuid("product_id")
      .notNull()
      .references(() => products.id),
    variantId: uuid("variant_id")
      .notNull()
      .references(() => productVariants.id),
    poseOptionId: uuid("pose_option_id").references(() => productOptions.id),
    baseOptionId: uuid("base_option_id").references(() => productOptions.id),
    snapshot: jsonb("snapshot").$type<ProductSnapshot>().notNull(),

    // Pet
    petName: text("pet_name").notNull(),
    animalType: text("animal_type").notNull(),
    breed: text("breed").notNull(),
    petAge: text("pet_age"),
    story: jsonb("story").$type<StoryAnswers>().notNull().default({}),

    // Personalisation
    poseNotes: text("pose_notes"),
    engravedName: text("engraved_name").notNull(),
    message: text("message"),
    importantDate: date("important_date"),
    importantDateLabel: text("important_date_label"),
    ownerNotes: text("owner_notes"),
    specialInstructions: text("special_instructions"),
    wantsMemoryPage: boolean("wants_memory_page").notNull().default(false),

    // Pricing (snapshotted at order time, in paise)
    unitPricePaise: integer("unit_price_paise").notNull(),
    optionsPricePaise: integer("options_price_paise").notNull().default(0),
    shippingPaise: integer("shipping_paise").notNull().default(0),
    totalPaise: integer("total_paise").notNull(),

    // Delivery
    shipName: text("ship_name").notNull(),
    shipPhone: text("ship_phone").notNull(),
    shipLine1: text("ship_line1").notNull(),
    shipLine2: text("ship_line2"),
    shipCity: text("ship_city").notNull(),
    shipState: text("ship_state").notNull(),
    shipPincode: text("ship_pincode").notNull(),
    isGift: boolean("is_gift").notNull().default(false),
    giftNote: text("gift_note"),

    // Operations
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    approvedPreviewId: uuid("approved_preview_id"),
    productionCostPaise: integer("production_cost_paise"),
    shippingCostPaise: integer("shipping_cost_paise"),
    productionPartner: text("production_partner"),
    courier: text("courier"),
    trackingNumber: text("tracking_number"),
    trackingUrl: text("tracking_url"),
    shippedAt: timestamp("shipped_at", { withTimezone: true }),
    deliveredAt: timestamp("delivered_at", { withTimezone: true }),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
    cancelReason: text("cancel_reason"),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("orders_user_idem_idx").on(t.userId, t.idempotencyKey),
    index("orders_status_idx").on(t.status),
    index("orders_user_idx").on(t.userId),
  ],
);

export const orderEvents = pgTable(
  "order_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    type: text("type").notNull(), // STATUS_CHANGE | NOTE | PREVIEW | APPROVAL | CHANGES | PAYMENT | SHIPPING | COST
    fromStatus: orderStatusEnum("from_status"),
    toStatus: orderStatusEnum("to_status"),
    message: text("message"),
    visibleToCustomer: boolean("visible_to_customer").notNull().default(false),
    actorUserId: uuid("actor_user_id").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("order_events_order_idx").on(t.orderId)],
);

/* ───────────────────────────── Files ───────────────────────────── */

export const uploads = pgTable(
  "uploads",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    kind: uploadKindEnum("kind").notNull(),
    ownerUserId: uuid("owner_user_id").references(() => users.id, { onDelete: "cascade" }),
    // Anonymous wizard uploads are bound to an httpOnly draft cookie until the order is placed.
    draftToken: text("draft_token"),
    orderId: uuid("order_id").references(() => orders.id, { onDelete: "set null" }),
    memoryPageId: uuid("memory_page_id"),
    storageKey: text("storage_key").notNull(),
    displayKey: text("display_key"),
    thumbKey: text("thumb_key"),
    mimeType: text("mime_type").notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    width: integer("width"),
    height: integer("height"),
    originalName: text("original_name"),
    caption: text("caption"),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("uploads_order_idx").on(t.orderId),
    index("uploads_memory_idx").on(t.memoryPageId),
    index("uploads_draft_idx").on(t.draftToken),
  ],
);

export const designPreviews = pgTable(
  "design_previews",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    version: integer("version").notNull(),
    uploadIds: jsonb("upload_ids").$type<string[]>().notNull(),
    artistNote: text("artist_note"),
    decision: previewDecisionEnum("decision").notNull().default("PENDING"),
    customerFeedback: text("customer_feedback"),
    decidedAt: timestamp("decided_at", { withTimezone: true }),
    decidedVia: text("decided_via"), // CUSTOMER | ADMIN_RECORDED
    decidedBy: uuid("decided_by").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("design_previews_order_version_idx").on(t.orderId, t.version)],
);

export const payments = pgTable(
  "payments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    provider: paymentProviderEnum("provider").notNull(),
    status: paymentRecordStatusEnum("status").notNull().default("CREATED"),
    amountPaise: integer("amount_paise").notNull(),
    providerOrderId: text("provider_order_id"),
    providerPaymentId: text("provider_payment_id"),
    method: text("method"),
    reference: text("reference"),
    note: text("note"),
    recordedBy: uuid("recorded_by").references(() => users.id),
    raw: jsonb("raw"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("payments_provider_order_idx").on(t.providerOrderId),
    uniqueIndex("payments_provider_payment_idx").on(t.providerPaymentId),
    index("payments_order_idx").on(t.orderId),
  ],
);

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    orderId: uuid("order_id").references(() => orders.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    body: text("body").notNull(),
    href: text("href"),
    emailStatus: text("email_status").notNull().default("SKIPPED"), // SENT | LOGGED | FAILED | SKIPPED
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("notifications_user_idx").on(t.userId)],
);

/* ───────────────────────────── Reviews ───────────────────────────── */

export const reviews = pgTable("reviews", {
  id: uuid("id").primaryKey().defaultRandom(),
  // One review per delivered order: reviews can only come from real customers.
  orderId: uuid("order_id")
    .notNull()
    .unique()
    .references(() => orders.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id),
  rating: integer("rating").notNull(),
  title: text("title"),
  body: text("body").notNull(),
  displayName: text("display_name").notNull(),
  petName: text("pet_name"),
  city: text("city"),
  status: reviewStatusEnum("status").notNull().default("PENDING"),
  featured: boolean("featured").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ───────────────────────────── Memory pages ───────────────────────────── */

export type MemoryEntry = { title: string; body: string };
export type SpecialDate = { label: string; date: string };
export type VideoLink = { url: string; title?: string };

export const memoryPages = pgTable("memory_pages", {
  id: uuid("id").primaryKey().defaultRandom(),
  // 128-bit random, base64url. The only key to a shared page.
  slug: text("slug").notNull().unique(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  orderId: uuid("order_id")
    .unique()
    .references(() => orders.id, { onDelete: "set null" }),
  petName: text("pet_name").notNull(),
  profileUploadId: uuid("profile_upload_id"),
  subtitle: text("subtitle"),
  story: text("story"),
  memories: jsonb("memories").$type<MemoryEntry[]>().notNull().default([]),
  specialDates: jsonb("special_dates").$type<SpecialDate[]>().notNull().default([]),
  videoLinks: jsonb("video_links").$type<VideoLink[]>().notNull().default([]),
  message: text("message"),
  isMemorial: boolean("is_memorial").notNull().default(false),
  visibility: visibilityEnum("visibility").notNull().default("PRIVATE"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
