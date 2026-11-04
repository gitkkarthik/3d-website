# Pawsome Memories

> Not just a miniature. A little piece of them, forever.

A personalised pet-memory gifting platform for India. Customers share photos and stories of their pet, choose an edition, approve an artist-made design preview, pay, and receive a hand-finished 3D-printed keepsake. Eligible editions include a private digital memory page.

This is a complete MVP: storefront, a 5-step customisation wizard with secure photo uploads, order lifecycle with design approval, Razorpay-ready payments, private memory pages, and a studio admin dashboard.

> The previous contents of this repository (a Vite garment showcase) are unrelated to this product and remain in `main`'s git history.

---

## Stack

| Concern | Choice |
| --- | --- |
| App | Next.js 15 (App Router, Server Components, Server Actions), React 19, TypeScript |
| Styling | Tailwind CSS v4, self-hosted Fraunces + Instrument Sans (no external font requests) |
| Database | PostgreSQL + Drizzle ORM, SQL migrations in `drizzle/` |
| Auth | Email + password (scrypt), DB-backed sessions in httpOnly cookies, role-based (`CUSTOMER` / `ADMIN`) |
| Files | Private storage driver: local disk or any S3-compatible bucket (AWS S3, Cloudflare R2, Supabase Storage). Images validated and re-encoded with `sharp` |
| Payments | Razorpay (REST + HMAC verification + webhook). Manual/offline payments recorded by admin |
| Email | Resend (optional). In-app notifications always |
| 3D | three.js / react-three-fiber procedural "studio sculpt" figurines, used for illustrative renders and the live engraving sketch |
| Tests | Vitest (unit) + Playwright (end-to-end against a live server + DB) |

## Pages

**Customer**
- `/`: hero with live 3D keepsake (type your pet's name and it's engraved on the base), manifesto, how it works, editions, illustrative examples, memory pages, customer stories, why us, FAQ, final CTA
- `/editions`: collection + comparison table
- `/editions/[slug]`: four edition landing pages (gallery + interactive 3D, price, sizes, personalisation, what's included, timing, reviews, JSON-LD)
- `/create`: the 5-step wizard (meet your pet → their story → edition → personalise → preview & order)
- `/signin`, `/account`: orders, memory pages, notifications
- `/account/orders/[id]`: status timeline, payment, design preview approve / request changes, tracking, what you shared, history, review form
- `/account/memories/[id]`: memory page editor (photos, voice recording in-browser, videos/links, story, memories, dates, privacy, delete)
- `/m/[slug]`: the memory page itself (private by default, unguessable link, noindex, no-referrer)
- `/memory-pages`, `/gifts/{custom-dog-figurine, custom-cat-figurine, pet-memorial-gifts, personalised-pet-gifts}` (SEO landing pages), `/privacy`, `/terms`, `/shipping-and-returns`

**Studio (admin, server-side authorised)**
- `/admin`: revenue, AOV, gross margin, action queues, orders/day, revenue by edition, status breakdown, recent orders
- `/admin/orders` (filters + search) and `/admin/orders/[id]`: artist brief with original photos, guarded status moves, send preview versions, record off-site approvals, record offline payments, production/shipping costs & margin, shipping details, internal notes or messages to customer, cancel
- `/admin/products`: edit every price, size, pose, base and edition copy
- `/admin/reviews`, `/admin/memories`, `/admin/customers`, `/admin/settings`

## Order lifecycle

`ORDER_RECEIVED → PHOTOS_REVIEW → DESIGN_IN_PROGRESS → PREVIEW_SENT → CUSTOMER_APPROVAL_PENDING → APPROVED_FOR_PRODUCTION → PRINTING → PAINTING_AND_FINISHING → QUALITY_CHECK → PACKAGED → SHIPPED → DELIVERED` (+ `CANCELLED`)

Rules live in one place, `src/lib/lifecycle.ts`, and are enforced server-side in transactions with row locks (`src/lib/orders.ts`):
- **No production without approval.** Every production status requires an approved preview on record. `APPROVED_FOR_PRODUCTION` can only be reached through the approval flow (customer click, or studio-recorded approval with a note and the admin's id), never by a manual status change.
- Sending a preview → `PREVIEW_SENT`; the customer opening it → `CUSTOMER_APPROVAL_PENDING`; requesting changes → back to `DESIGN_IN_PROGRESS`; each version is kept.
- `PRINTING` requires payment; `SHIPPED` requires courier + tracking number. Steps can't be skipped. Shipped/delivered orders can't be cancelled.
- Every change writes an `order_events` row (customer-visible or internal) and notifies the customer in-app + email.

## Database schema

`src/lib/db/schema.ts` (migration: `drizzle/0000_init.sql`)

| Table | Purpose |
| --- | --- |
| `users`, `sessions` | accounts (role), hashed session tokens |
| `products`, `product_variants`, `product_options` | editions; sizes with price (paise); poses & bases with price deltas; all admin-editable |
| `settings` | shipping fee, free-shipping threshold, contact, manual payment instructions |
| `orders` | customer, pet, story (jsonb), personalisation, price snapshot, delivery, status, payment status, approval timestamp + preview id, manufacturing cost, shipping cost, partner, courier/tracking, idempotency key (unique per user) |
| `order_events` | full audit log, internal notes, customer-visible history |
| `uploads` | every stored file: kind, owner/draft token, order/memory page, storage keys (original/display/thumb), dimensions |
| `design_previews` | versioned previews, decision, feedback, who/when/how decided |
| `payments` | Razorpay and manual payments (amount, ids, method, reference, recorded by) |
| `notifications` | in-app notifications + email delivery status |
| `reviews` | one per delivered order, moderated (`PENDING/PUBLISHED/HIDDEN`), featured flag |
| `memory_pages` | slug (128-bit random), visibility (`PRIVATE/LINK`), story, memories, dates, video links, message |

All money is integer paise. Orders snapshot prices, so changing prices never changes placed orders.

## Run locally

Requirements: Node 20+, PostgreSQL 14+.

```bash
npm install
cp .env.example .env                     # set ADMIN_EMAIL, ADMIN_PASSWORD (DATABASE_URL matches docker-compose)
docker compose up -d                     # local Postgres on 127.0.0.1:54329 (or point DATABASE_URL at your own)
npm run db:migrate                       # apply migrations
npm run db:seed                          # 4 editions with sizes/poses/bases (safe to re-run)
npm run admin:create                     # creates/promotes ADMIN_EMAIL (password ≥ 12 chars)
npm run dev                              # http://localhost:3001 — studio at /admin
```

Other scripts: `npm run build && npm start` (production), `npm test` (unit), `npm run test:e2e` (needs a running server), `npm run renders` (regenerates `public/renders/*.webp` from the 3D scene; needs the dev server), `npm run db:generate` (new migration after schema changes).

## Environment variables

| Variable | Required | Notes |
| --- | --- | --- |
| `DATABASE_URL` | yes | Postgres connection string (Supabase/Neon/RDS all fine) |
| `APP_URL` | yes in prod | Public URL; used for sitemap, OG, emails, share links |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | for `admin:create` | Not read by the running app |
| `STORAGE_DRIVER` | no | `local` (default, `STORAGE_DIR`) or `s3` |
| `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` | if `s3` | **Bucket must be private.** Files are only served via `/api/files/[id]` after an authorisation check |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` | no | Absent → online payment is switched off and customers see your manual instructions. `rzp_test_…` keys → labelled test mode |
| `RAZORPAY_WEBHOOK_SECRET` | with Razorpay | Webhook signature secret |
| `RESEND_API_KEY`, `EMAIL_FROM` | no | Absent → emails are logged to the server console; in-app notifications still work |

## External services

1. **PostgreSQL**: e.g. Supabase (Project → Settings → Database → connection string, use the pooled URL on serverless) or Neon.
2. **Private file storage** (needed for any multi-instance or serverless deploy; local disk only suits a single VM):
   - Supabase: Storage → new **private** bucket → Settings → S3 access keys. `S3_ENDPOINT=https://<project>.supabase.co/storage/v1/s3`, `S3_REGION=<project region>`.
   - Cloudflare R2: create bucket (no public access) + API token. `S3_ENDPOINT=https://<account>.r2.cloudflarestorage.com`, `S3_REGION=auto`.
3. **Razorpay**: Dashboard → API keys (start with Test mode). Webhooks → URL `https://<APP_URL>/api/payments/razorpay/webhook`, events `payment.captured`, `payment.failed`, `order.paid`, set a secret → `RAZORPAY_WEBHOOK_SECRET`. Switch to live keys after KYC.
4. **Resend**: verify your sending domain, create an API key, set `EMAIL_FROM`.

## Deploy

- **Single VM / Render / Railway / Fly** (simplest): set env vars, `npm ci && npm run db:migrate && npm run build`, run `npm start`. Local storage works here if the disk is persistent; S3 is still recommended.
- **Vercel**: use `STORAGE_DRIVER=s3` (serverless has no persistent disk), a pooled Postgres URL, and run `npm run db:migrate` + `npm run admin:create` from your machine against the production DB. Uploads go through a route handler, so stay under the platform's request-body limit (Vercel: ~4.5 MB). For larger photos/videos on Vercel, switch to presigned direct-to-bucket uploads (see limitations).
- Run `npm run db:seed` once, then manage catalogue and prices in `/admin/products`.

## Security & privacy

- Admin is enforced in **every** server action/route (`requireAdmin()`), not just by hiding UI; customers only ever load their own orders (others 404).
- Uploads: magic-byte sniffing (never trusts extension/MIME), size limits (images 15 MB, audio 20 MB, video 80 MB), images decoded and re-encoded by sharp with metadata (incl. GPS) stripped for every browser-served copy; untouched originals kept for artists only; SVG/HTML/PDF rejected; per-visitor caps and rate limits.
- Anonymous wizard uploads are bound to an httpOnly draft cookie and only attach to an order owned by the same person.
- CSRF: same-origin check on all JSON/multipart routes; Server Actions use Next's built-in origin check.
- Payments: amounts always computed server-side; Razorpay checkout signature and webhook HMAC verified; webhook amount must match; idempotent; never marks unpaid orders paid.
- Duplicate submission: client idempotency key + unique index; concurrent double-submit returns the same order.
- Memory pages: private by default, 128-bit random slug, `noindex` + `X-Robots-Tag`, `Referrer-Policy: no-referrer`, excluded from sitemap/robots, link can be rotated, customer can permanently delete page and files.

## Tests

`npm test`: **18 unit tests, all passing**: lifecycle guards (no production before approval, payment before printing, tracking before shipping, no skipping), Razorpay signature verification, file sniffing, same-origin guard, video embed allow-list, validation (photos 3–5, engraving length, Indian phone/PIN), INR formatting.

`npm run test:e2e`: **83 checks, all passing against a production build** (`next build && next start`, Postgres 16, headless Chromium). Covers: mobile wizard end-to-end, inline registration, weak password, invalid uploads (text-as-jpg, SVG, too small), multiple upload/remove/replace, server-side pricing, duplicate and concurrent submission, photo reuse, cross-customer and anonymous access (orders, files, delete), admin/account redirects, CSRF, EXIF stripping, honest 503 when online payments are off, admin workflow, preview → changes → v2 → approval, payment and shipping guards, manual payment amount check, margin, notifications, internal-note privacy, review → moderation → product page, memory page privacy (private 404, link sharing, media requires link, no originals to viewers, link rotation, deletion), signed webhook (bad signature, failed payment, amount mismatch, capture, replay), no horizontal scroll on key pages (mobile + desktop), JSON-LD/canonical/OG, sitemap and robots.

**Not tested:** real Razorpay Checkout with live/test keys (no credentials available; the code path is built and the server side is tested via signed webhooks), real email delivery via Resend, S3 storage against a real bucket, iOS Safari/Android Chrome on physical devices, screen-reader walkthrough.

## Known limitations & next steps

- **Product imagery**: no photography of real keepsakes exists yet. All figurine images are procedural 3D studio renders, labelled "Illustrative" everywhere. Replace with real photos of your first pieces (with customer permission) as soon as you have them.
- **Reviews & stories**: deliberately empty until real delivered customers write them; nothing is seeded.
- **Policies** (`/privacy`, `/terms`, `/shipping-and-returns`) are plain-language drafts: have a lawyer review them (DPDP Act 2023, consumer protection) before launch.
- Rate limiting is in-memory (per instance). Use Redis/Upstash when you scale beyond one server.
- Uploads stream through the app server; for serverless hosts or large videos, move to presigned direct uploads.
- No password reset / email verification flow yet (add before scale; Resend is already wired).
- Refunds are issued in Razorpay/bank; the app records cancellations but doesn't call the refund API.
- No GST invoice generation, coupon codes, or courier API integration (tracking is entered manually), all intentionally out of MVP scope.
- Account deletion is by email request (memory pages are self-serve deletable).
- The `/render` route is an internal page used to generate stills; it's noindexed and harmless, but you may remove it in production.
