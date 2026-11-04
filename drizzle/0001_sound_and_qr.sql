ALTER TYPE "public"."upload_kind" ADD VALUE 'PET_SOUND' BEFORE 'PREVIEW';--> statement-breakpoint
ALTER TABLE "memory_pages" ADD COLUMN "qr_token" text;--> statement-breakpoint
ALTER TABLE "memory_pages" ADD COLUMN "qr_enabled" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "uploads" ADD COLUMN "waveform" jsonb;--> statement-breakpoint
ALTER TABLE "uploads" ADD COLUMN "duration_sec" integer;--> statement-breakpoint
ALTER TABLE "memory_pages" ADD CONSTRAINT "memory_pages_qr_token_unique" UNIQUE("qr_token");--> statement-breakpoint
UPDATE "memory_pages" SET "qr_token" = substr(replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', ''), 1, 22) WHERE "qr_token" IS NULL;--> statement-breakpoint
UPDATE "products" SET "includes_memory_page" = true WHERE "slug" = 'personality-edition';--> statement-breakpoint
UPDATE "products" SET "includes" = jsonb_build_array('Their real sound engraved as a waveform, with a QR code: scan it and hear them') || "includes" WHERE NOT ("includes" @> '["Their real sound engraved as a waveform, with a QR code: scan it and hear them"]'::jsonb);
