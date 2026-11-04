/**
 * End-to-end QA run against a live server + database.
 *   1. npm run dev   (or npm run build && npm start)
 *   2. npm run test:e2e
 * Uses RAZORPAY_WEBHOOK_SECRET from .env to exercise the webhook (no real Razorpay keys needed).
 * Screenshots land in tests/e2e/screens.
 */
import "dotenv/config";
import { chromium, type Browser, type BrowserContext, type Page } from "playwright";
import sharp from "sharp";
import { createHmac, randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { execSync } from "node:child_process";
import { Pool } from "pg";

const BASE = process.env.E2E_BASE ?? "http://localhost:3001";
const OUT = "tests/e2e/screens";
const ADMIN = { email: process.env.ADMIN_EMAIL!, password: process.env.ADMIN_PASSWORD! };
const db = new Pool({ connectionString: process.env.DATABASE_URL });
const results: { name: string; ok: boolean; detail?: string }[] = [];

function check(name: string, ok: boolean, detail?: string) {
  results.push({ name, ok, detail });
  console.log(`${ok ? "✓" : "✗"} ${name}${detail && !ok ? `: ${detail}` : ""}`);
}
let failShots = 0;
async function step(name: string, fn: () => Promise<void>, page?: Page) {
  try {
    await fn();
  } catch (e) {
    check(name, false, (e as Error).message.split("\n").slice(0, 3).join(" "));
    if (page) await page.screenshot({ path: `${OUT}/FAIL-${++failShots}.png`, fullPage: true }).catch(() => {});
  }
}
const shot = (p: Page, name: string, full = false) => p.screenshot({ path: `${OUT}/${name}.png`, fullPage: full, timeout: 120_000 });

async function makeFixtures() {
  await mkdir("tests/e2e/fixtures", { recursive: true });
  const colors = [
    [201, 152, 104],
    [180, 140, 100],
    [222, 200, 170],
    [150, 110, 80],
  ];
  const files: string[] = [];
  for (const [i, [r, g, b]] of colors.entries()) {
    const f = `tests/e2e/fixtures/pet-${i}.jpg`;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900"><rect width="1200" height="900" fill="rgb(${r},${g},${b})"/><circle cx="600" cy="420" r="260" fill="rgb(${r - 40},${g - 40},${b - 40})"/><text x="600" y="840" font-size="60" text-anchor="middle" fill="#fff">test photo ${i + 1}</text></svg>`;
    await sharp(Buffer.from(svg)).jpeg({ quality: 85 }).withMetadata({ exif: { IFD0: { Make: "TestCam" } } }).toFile(f);
    files.push(f);
  }
  await writeFile("tests/e2e/fixtures/not-an-image.jpg", "this is plain text pretending to be a jpeg");
  await writeFile("tests/e2e/fixtures/evil.svg", `<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>`);
  await sharp({ create: { width: 120, height: 120, channels: 3, background: "#c99" } }).jpeg().toFile("tests/e2e/fixtures/tiny.jpg");
  // A stand-in "bark": bursts of filtered noise, as an AAC voice-note file.
  execSync(
    `ffmpeg -loglevel error -y -f lavfi -i "anoisesrc=d=2.4:c=pink:a=0.6" -af "volume='if(lt(mod(t,0.6),0.18),1,if(lt(mod(t,0.6),0.25),0.3,0.02))':eval=frame,highpass=f=300,lowpass=f=2500" -c:a aac tests/e2e/fixtures/bark.m4a`,
  );
  return files;
}

async function api(ctx: BrowserContext, path: string, init: { method?: string; json?: unknown; origin?: string | null } = {}) {
  const headers: Record<string, string> = {};
  if (init.origin !== null) headers.origin = init.origin ?? BASE;
  const res = await ctx.request.fetch(`${BASE}${path}`, {
    method: init.method ?? (init.json ? "POST" : "GET"),
    headers: { ...headers, ...(init.json ? { "content-type": "application/json" } : {}) },
    data: init.json ? JSON.stringify(init.json) : undefined,
    maxRedirects: 0,
  });
  let body: unknown = null;
  try {
    body = await res.json();
  } catch {}
  return { status: res.status(), body: body as Record<string, any> };
}

async function waitDb(sql: string, params: unknown[], want: string, ms = 20000) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    const v = (await db.query(sql, params)).rows[0]?.v;
    if (v === want) return;
    await new Promise((r) => setTimeout(r, 300));
  }
  throw new Error(`timed out waiting for ${want}`);
}

async function moveStatus(p: Page, label: string) {
  await p.getByLabel("Next status").selectOption({ label });
  await p.getByRole("button", { name: "Move" }).click();
  await p.getByText("Status updated and customer notified.").waitFor({ timeout: 15000 });
  await p.waitForTimeout(400);
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const photos = await makeFixtures();
  const browser: Browser = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
  const stamp = Date.now();
  const custA = { name: "Asha Rao", email: `asha+${stamp}@example.com`, password: "a-strong-pass-1", phone: "9876543210" };
  const custB = { name: "Bilal Khan", email: `bilal+${stamp}@example.com`, password: "another-pass-22" };

  /* ───────────── Customer A: the full wizard on a phone ───────────── */
  const ctxA = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const a = await ctxA.newPage();
  const consoleErrors: string[] = [];
  a.on("pageerror", (e) => consoleErrors.push(e.message));
  let orderId = "";

  await step("wizard: complete flow on mobile", async () => {
    await a.goto(`${BASE}/create?name=Bruno`);
    await a.getByRole("heading", { name: /Let.s meet Bruno/ }).waitFor();
    check("wizard: name carried over from hero", (await a.locator("#petName").inputValue()) === "Bruno");

    // Validation: can't continue empty
    await a.getByRole("button", { name: /Continue/ }).click();
    check("wizard: blocks step 1 without photos/animal", await a.getByText("Please add at least 3 photos.").isVisible());

    await a.getByRole("radio", { name: "Dog" }).click();
    await a.locator("#breed").fill("Indie / Desi");
    await a.locator("#petAge").fill("4 years");

    // Invalid uploads
    await a.locator("#photos").setInputFiles("tests/e2e/fixtures/not-an-image.jpg");
    await a.getByText("Please upload a JPG, PNG, WebP or HEIC photo.").waitFor({ timeout: 15000 });
    check("upload: rejects text file disguised as .jpg", true);
    await a.getByRole("button", { name: "Dismiss" }).first().click();
    await a.locator("#photos").setInputFiles("tests/e2e/fixtures/evil.svg");
    await a.getByText("Please upload a JPG, PNG, WebP or HEIC photo.").waitFor({ timeout: 15000 });
    check("upload: rejects SVG (script vector)", true);
    await a.getByRole("button", { name: "Dismiss" }).first().click();
    await a.locator("#photos").setInputFiles("tests/e2e/fixtures/tiny.jpg");
    await a.getByText(/quite small/).waitFor({ timeout: 15000 });
    check("upload: rejects too-small photo with a helpful message", true);
    await a.getByRole("button", { name: "Dismiss" }).first().click();

    // Multiple valid uploads at once
    await a.locator("#photos").setInputFiles(photos.slice(0, 3));
    await a.getByText("3 of 3–5").waitFor({ timeout: 30000 });
    check("upload: 3 photos uploaded together with previews", (await a.locator('img[alt^="Photo "]').count()) === 3);
    // Remove one and replace
    await a.getByRole("button", { name: "Remove photo 3" }).click();
    await a.getByText("2 of 3–5").waitFor();
    await a.locator("#photos").setInputFiles(photos.slice(3, 4));
    await a.getByText("3 of 3–5").waitFor({ timeout: 30000 });
    check("upload: remove + re-add works", true);
    await shot(a, "01-wizard-step1-mobile", true);

    await a.getByRole("button", { name: /Continue/ }).click();
    await a.getByRole("heading", { name: /their story/i }).waitFor();
    // Their sound: upload a voice note; it's analysed in the browser and uploaded with its waveform.
    await a.locator('input[type=file][accept^="audio"]').first().setInputFiles("tests/e2e/fixtures/bark.m4a");
    await a.getByText("Bruno's sound", { exact: true }).first().waitFor({ timeout: 30000 });
    check("sound: voice note added in the wizard with its waveform", true);
    await a.locator("#smile").fill("He sneezes every single time he's excited to see us.");
    await a.locator("#toy").fill("A one-eared green crocodile called Mr Croc");
    await a.locator("#nickname").fill("Laddoo, Chotu");
    await a.locator("#freezeMoment").fill("Sunday mornings, when he climbs onto the bed and sighs like he owns the place.");
    await shot(a, "02-wizard-story-mobile", true);
    check("wizard: story card shows customer's words", await a.getByText("also known as Laddoo, Chotu").first().isVisible());

    await a.getByRole("button", { name: /Continue/ }).click();
    await a.getByRole("radio", { name: /Forever Edition/ }).click();
    await a.getByRole("button", { name: /Continue/ }).click();
    check("wizard: requires a size", await a.getByText("Choose a size.").isVisible());
    await a.getByRole("radio", { name: /Classic · about 10 cm tall/ }).click();
    await a.getByRole("button", { name: /Continue/ }).click();

    await a.getByRole("heading", { name: /Make it/ }).waitFor();
    await a.getByRole("radio", { name: /Sitting proudly/ }).click();
    await a.getByRole("radio", { name: /Walnut plinth/ }).click();
    await a.locator("#engravedName").fill("Bruno");
    await a.locator("#message").fill("Best boy, always");
    await a.locator("#special").fill("His left ear flops; the right one stands up.");
    await a.waitForTimeout(2500);
    await a.locator(".render-tag", { hasText: "Style sketch" }).scrollIntoViewIfNeeded();
    await shot(a, "03-wizard-personalise-mobile", false);
    await a.getByRole("button", { name: /Continue/ }).click();

    await a.getByRole("heading", { name: /Everything we know about/ }).waitFor();
    check("wizard: honest artist-preview message shown", await a.getByText("Our artists will prepare your personalised design and send you a preview for approval before production.").isVisible());
    await a.locator("#shipName").fill(custA.name);
    await a.locator("#shipPhone").fill(custA.phone);
    await a.locator("#shipLine1").fill("Flat 4B, 12 MG Road");
    await a.locator("#shipCity").fill("Pune");
    await a.locator("#shipState").selectOption("Maharashtra");
    await a.locator("#shipPincode").fill("411001");
    check("wizard: place order disabled until signed in", await a.getByRole("button", { name: /Place order/ }).isDisabled());

    // Registration inline
    await a.locator("#auth-name").fill(custA.name);
    await a.locator("#auth-email").fill(custA.email);
    await a.locator("#auth-password").fill("short");
    await a.getByRole("button", { name: "Create account & continue" }).click();
    await a.getByText("At least 8 characters.").last().waitFor();
    check("register: rejects weak password", true);
    await a.locator("#auth-password").fill(custA.password);
    await a.getByRole("button", { name: "Create account & continue" }).click();
    await a.getByRole("button", { name: /Place order · ₹1,999/ }).waitFor({ state: "visible" });
    await a.waitForFunction(() => !(document.querySelector("button.btn-clay") as HTMLButtonElement)?.disabled);
    check("register: inline account creation", true);
    await shot(a, "04-wizard-review-mobile", true);

    await a.getByRole("button", { name: /Place order/ }).click();
    await a.waitForURL(/\/account\/orders\/[0-9a-f-]+\?placed=1/, { timeout: 30000 });
    orderId = a.url().split("/orders/")[1].split("?")[0];
    check("order: placed and redirected to order page", !!orderId);
    await a.getByText("We can’t wait to meet").or(a.getByText("We can't wait to meet")).first().waitFor();
    await shot(a, "05-order-placed-mobile", true);
  }, a);

  if (!orderId) {
    console.error("Order wasn't created; aborting the rest of the run.");
    await browser.close();
    process.exit(1);
  }
  const [order] = (await db.query("select * from orders where id = $1", [orderId])).rows;
  await step("order: server-side data integrity", async () => {
    check("order: price computed on server (₹1,999)", order?.total_paise === 199900, String(order?.total_paise));
    check("order: starts unpaid and ORDER_RECEIVED", order?.payment_status === "PENDING" && order?.status === "ORDER_RECEIVED");
    const ph = await db.query("select count(*)::int n from uploads where order_id = $1 and kind='PET_PHOTO'", [orderId]);
    check("order: 3 photos attached", ph.rows[0].n === 3);
    const mp = await db.query("select visibility from memory_pages where order_id = $1", [orderId]);
    check("memory: page auto-created as PRIVATE for Forever Edition", mp.rows[0]?.visibility === "PRIVATE");
    const notif = await db.query("select count(*)::int n from notifications where order_id = $1", [orderId]);
    check("notify: confirmation notification created", notif.rows[0].n >= 1);
  });

  await step("order: duplicate submission is idempotent", async () => {
    // Re-submit the exact payload twice concurrently with a fresh key → one new order; repeat same key → same order.
    const photoIds = (await db.query("select id from uploads where order_id=$1 order by sort_order", [orderId])).rows.map((r) => r.id);
    const variant = order.variant_id;
    const key = randomUUID();
    const payload = (pIds: string[]) => ({
      idempotencyKey: key,
      pet: { petName: "Bruno", animalType: "Dog", breed: "Indie", photoIds: pIds },
      story: {},
      personalise: { productSlug: "forever-edition", variantId: variant, engravedName: "Bruno", wantsMemoryPage: false },
      delivery: { shipName: "Asha", shipPhone: "9876543210", shipLine1: "12 MG Road", shipCity: "Pune", shipState: "Maharashtra", shipPincode: "411001" },
    });
    // Photos already on an order can't be reused
    const reuse = await api(ctxA, "/api/orders", { json: payload(photoIds) });
    check("order: photos from another order can't be reused", reuse.status === 400, JSON.stringify(reuse.body));
    // Fresh photos for the duplicate test
    const fresh: string[] = [];
    for (const f of photos.slice(0, 3)) {
      const r = await ctxA.request.post(`${BASE}/api/uploads`, { headers: { origin: BASE }, multipart: { kind: "PET_PHOTO", file: { name: "p.jpg", mimeType: "image/jpeg", buffer: await sharp(f).toBuffer() } } });
      fresh.push((await r.json()).upload.id);
    }
    const [r1, r2] = await Promise.all([api(ctxA, "/api/orders", { json: payload(fresh) }), api(ctxA, "/api/orders", { json: payload(fresh) })]);
    const r3 = await api(ctxA, "/api/orders", { json: payload(fresh) });
    const ids = new Set([r1.body?.order?.id, r2.body?.order?.id, r3.body?.order?.id]);
    check("order: double-click / retry creates exactly one order", ids.size === 1 && r1.status === 200 && r2.status === 200, JSON.stringify([r1.status, r2.status, [...ids]]));
    check("order: retry reports duplicate", r3.body?.duplicate === true);
    // Tampered price fields are ignored (server recomputes)
    const tampered = await api(ctxA, "/api/orders", { json: { ...payload(fresh), idempotencyKey: randomUUID(), totalPaise: 100 } });
    check("order: client can't set price / reuse photos", tampered.status === 400);
    await db.query("update orders set status='CANCELLED', cancel_reason='e2e duplicate test' where id = $1", [r1.body.order.id]);
  });

  /* ───────────── Security: other customers, anonymous, CSRF ───────────── */
  const photoId = (await db.query("select id from uploads where order_id=$1 limit 1", [orderId])).rows[0].id;
  const ctxB = await browser.newContext();
  const anon = await browser.newContext();
  await step("permissions", async () => {
    const reg = await api(ctxB, "/api/auth/register", { json: custB });
    check("register: second customer via API", reg.status === 200);
    const dupe = await api(anon, "/api/auth/register", { json: { ...custB, name: "Someone Else" } });
    check("register: duplicate email refused", dupe.status === 409);
    const b = await ctxB.newPage();
    const res = await b.goto(`${BASE}/account/orders/${orderId}`);
    check("permissions: customer B can't view A's order (404)", res?.status() === 404);
    check("permissions: customer B can't fetch A's photo", (await api(ctxB, `/api/files/${photoId}`)).status === 404);
    check("permissions: anonymous can't fetch A's photo", (await api(anon, `/api/files/${photoId}`)).status === 404);
    check("permissions: B can't delete A's photo", (await api(ctxB, `/api/uploads?id=${photoId}`, { method: "DELETE" })).status === 404);
    check("permissions: owner can fetch own photo", (await api(ctxA, `/api/files/${photoId}?v=thumb`)).status === 200);
    const orig = await ctxA.request.get(`${BASE}/api/files/${photoId}?v=original`);
    check("files: original kept for artists", orig.status() === 200 && (await orig.body()).length > 0);
    const disp = await ctxA.request.get(`${BASE}/api/files/${photoId}`);
    const meta = await sharp(await disp.body()).metadata();
    check("files: display copy has EXIF stripped", !meta.exif && meta.format === "webp");
    const adminPage = await b.goto(`${BASE}/admin`);
    check("permissions: customer B redirected away from /admin", !b.url().includes("/admin") && adminPage?.status() === 200);
    const anonP = await anon.newPage();
    await anonP.goto(`${BASE}/admin`);
    check("permissions: anonymous sent to sign-in from /admin", anonP.url().includes("/signin"));
    await anonP.goto(`${BASE}/account`);
    check("permissions: anonymous sent to sign-in from /account", anonP.url().includes("/signin"));
    const csrf = await api(ctxA, "/api/orders", { json: {}, origin: "https://evil.example" });
    check("csrf: cross-origin POST refused", csrf.status === 403);
    const noOrigin = await api(ctxA, "/api/uploads?id=" + photoId, { method: "DELETE", origin: null });
    check("csrf: POST/DELETE without Origin refused", noOrigin.status === 403);
    const rzp = await api(ctxA, "/api/payments/razorpay/order", { json: { orderId } });
    check("payment: online payment honestly unavailable without keys (503)", rzp.status === 503);
    const login = await api(anon, "/api/auth/login", { json: { email: custA.email, password: "wrong-password" } });
    check("auth: wrong password rejected", login.status === 401);
  });

  /* ───────────── Admin workflow ───────────── */
  const ctxAdmin = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const ad = await ctxAdmin.newPage();
  await step("admin: workflow", async () => {
    const l = await api(ctxAdmin, "/api/auth/login", { json: ADMIN });
    check("admin: sign in", l.status === 200, JSON.stringify(l.body));
    await ad.goto(`${BASE}/admin`);
    await ad.getByRole("heading", { name: "Overview" }).waitFor();
    await shot(ad, "10-admin-overview", true);
    await ad.goto(`${BASE}/admin/orders/${orderId}`);
    await ad.getByText("Artist brief").waitFor();
    check("admin: sees customer story", await ad.getByText("He sneezes every single time").isVisible());
    // Production can't start
    const opts = await ad.getByLabel("Next status").locator("option").allTextContents();
    check("admin: no path to production before approval", !opts.some((o) => /Printing|Approved/.test(o)), opts.join(","));
    await moveStatus(ad, "Reviewing photos");
    await moveStatus(ad, "Design in progress");
    // Upload preview v1
    const panel = ad.locator("section", { has: ad.getByRole("heading", { name: "Send a design preview" }) });
    await panel.locator('input[type="file"]').setInputFiles(photos[0]);
    await panel.locator("img").first().waitFor({ timeout: 20000 });
    await panel.locator("textarea").fill("Here's Bruno v1. Ear position based on photo 2.");
    await panel.getByRole("button", { name: "Send preview to customer" }).click();
    await ad.getByText("Preview sent. The customer has been notified.").waitFor();
    check("admin: preview v1 sent", true);
    await shot(ad, "11-admin-order", true);
  });

  /* ───────────── Customer reviews preview ───────────── */
  await step("customer: request changes then approve", async () => {
    await a.goto(`${BASE}/account/orders/${orderId}`);
    await a.getByText("Version 1").waitFor();
    await a.waitForTimeout(800);
    const st = (await db.query("select status from orders where id=$1", [orderId])).rows[0].status;
    check("preview: viewing moves order to CUSTOMER_APPROVAL_PENDING", st === "CUSTOMER_APPROVAL_PENDING", st);
    await shot(a, "06-customer-preview-mobile", true);
    await a.getByRole("button", { name: "Request changes" }).click();
    await a.locator("#changes").fill("His nose is a bit darker, and the left ear should flop more.");
    await a.getByRole("button", { name: "Send to our artist" }).click();
    await a.getByText(/working on a new version|work on a new version/).first().waitFor();
    const st2 = (await db.query("select status from orders where id=$1", [orderId])).rows[0].status;
    check("preview: change request returns order to DESIGN_IN_PROGRESS", st2 === "DESIGN_IN_PROGRESS", st2);

    // Admin sends v2
    await ad.goto(`${BASE}/admin/orders/${orderId}`);
    check("admin: sees customer's change request", await ad.getByText("Customer: His nose is a bit darker").isVisible());
    const panel = ad.locator("section", { has: ad.getByRole("heading", { name: "Send a design preview" }) });
    await panel.locator('input[type="file"]').setInputFiles(photos[1]);
    await panel.locator("img").first().waitFor({ timeout: 20000 });
    await panel.getByRole("button", { name: "Send preview to customer" }).click();
    await ad.getByText("Preview sent. The customer has been notified.").waitFor();

    await a.goto(`${BASE}/account/orders/${orderId}`);
    await a.getByText("Version 2").waitFor();
    await a.getByRole("button", { name: /Approve/ }).first().click();
    await a.getByRole("button", { name: "Approve for production" }).click();
    await a.getByText(/Approved\. Thank you!|You approved this design/).first().waitFor();
    const o = (await db.query("select status, approved_at, approved_preview_id from orders where id=$1", [orderId])).rows[0];
    check("preview: approval recorded with timestamp", o.status === "APPROVED_FOR_PRODUCTION" && !!o.approved_at && !!o.approved_preview_id);
  });

  await step("admin: payment + production + shipping", async () => {
    await ad.goto(`${BASE}/admin/orders/${orderId}`);
    await ad.getByLabel("Next status").selectOption({ label: "Printing (blocked)" });
    check("guard: printing blocked until paid", await ad.getByText("Record payment before sending the order to the printer.").isVisible());
    const pay = ad.locator("section", { has: ad.getByRole("heading", { name: "Record offline payment" }) });
    await pay.getByLabel("Amount in rupees").fill("100");
    await pay.getByRole("button", { name: "Record payment received" }).click();
    await ad.getByText("The amount must match the order total").waitFor();
    check("payment: wrong manual amount refused", true);
    await pay.getByLabel("Amount in rupees").fill("1999");
    await pay.getByLabel("Reference").fill("UTR123456789");
    await pay.getByRole("button", { name: "Record payment received" }).click();
    await waitDb("select payment_status as v from orders where id=$1", [orderId], "PAID");
    check("payment: manual UPI payment recorded", (await db.query("select payment_status from orders where id=$1", [orderId])).rows[0].payment_status === "PAID");
    await ad.reload();
    await moveStatus(ad, "Printing");
    await moveStatus(ad, "Painting & finishing");
    await moveStatus(ad, "Quality check");
    await moveStatus(ad, "Packaged");
    await ad.getByLabel("Next status").selectOption({ label: "Shipped (blocked)" });
    check("guard: shipping blocked without tracking", await ad.getByText("Add the courier and tracking number").isVisible());
    // Costs
    await ad.getByPlaceholder("e.g. 650").fill("700");
    await ad.getByPlaceholder("e.g. 90").fill("120");
    await ad.getByPlaceholder("Production partner").fill("PrintLab Bengaluru");
    await ad.getByRole("button", { name: "Save costs" }).click();
    await ad.getByText("Costs saved.").waitFor();
    await ad.getByLabel("Courier").fill("Delhivery");
    await ad.getByLabel("Tracking number").fill("DLV123456789IN");
    await ad.getByLabel("Tracking link").fill("https://www.delhivery.com/track/package/DLV123456789IN");
    await ad.getByRole("button", { name: "Save shipping details" }).click();
    await ad.getByText("Shipping details saved.").waitFor();
    await ad.reload();
    await moveStatus(ad, "Shipped");
    await moveStatus(ad, "Delivered");
    await ad.getByText("1,179").first().waitFor();
    check("margin: gross margin computed (₹1,999 − ₹820 = ₹1,179)", true);
    // Internal note
    await ad.getByPlaceholder(/Production note/).fill("Painted with warm sienna base; QC passed.");
    await ad.getByRole("button", { name: "Add internal note" }).click();
    await ad.getByText("Internal note added.").waitFor();
    await shot(ad, "12-admin-order-delivered", true);
  });

  await step("customer: tracking, notifications, review", async () => {
    await a.goto(`${BASE}/account/orders/${orderId}`);
    check("tracking: customer sees tracking number", await a.getByText("DLV123456789IN").isVisible());
    check("privacy: internal notes hidden from customer", !(await a.getByText("warm sienna").isVisible()));
    await a.locator("#r-body").fill("It really looks like him, floppy ear and all. My mum cried.");
    await a.getByRole("button", { name: "Share review" }).click();
    await a.getByText(/Your review will appear once|waiting for our studio to check it/).first().waitFor();
    const n = (await db.query("select count(*)::int n from notifications where order_id=$1", [orderId])).rows[0].n;
    check("notify: customer notified through the lifecycle", n >= 10, String(n));
    await a.goto(`${BASE}/account`);
    await shot(a, "07-account-mobile", true);
    // Admin publishes review
    await ad.goto(`${BASE}/admin/reviews`);
    await ad.getByRole("button", { name: "Publish" }).first().click();
    await ad.waitForTimeout(800);
    const pg = await anon.newPage();
    await pg.goto(`${BASE}/editions/forever-edition`);
    check("reviews: published review appears on product page with 'Verified order'", await pg.getByText("My mum cried.").first().isVisible());
  });

  /* ───────────── Memory page privacy ───────────── */
  await step("sound + QR", async () => {
    const snd = (await db.query("select id, waveform, duration_sec from uploads where order_id=$1 and kind='PET_SOUND'", [orderId])).rows;
    check("sound: recording attached to the order with waveform + duration", snd.length === 1 && Array.isArray(snd[0].waveform) && snd[0].waveform.length >= 8 && snd[0].duration_sec >= 1, JSON.stringify(snd[0]?.duration_sec));
    const mp = (await db.query("select id, qr_token from memory_pages where order_id=$1", [orderId])).rows[0];
    check("qr: memory page has a permanent QR token", !!mp?.qr_token && mp.qr_token.length >= 16);
    const scanner = await anon.newPage();
    const r = await scanner.goto(`${BASE}/q/${mp.qr_token}`);
    check("qr: scanning opens the player even though the private link isn't shared", r?.status() === 200 && (await scanner.getByRole("button", { name: /Play/ }).count()) > 0);
    check("qr: scan page is noindex", (r?.headers()["x-robots-tag"] ?? "").includes("noindex"));
    await scanner.waitForTimeout(1200);
    await shot(scanner, "13-qr-player", false);
    check("qr: scanner can play the sound", (await api(anon, `/api/files/${snd[0].id}?q=${mp.qr_token}`)).status === 200);
    check("qr: sound not reachable without the code", (await api(anon, `/api/files/${snd[0].id}`)).status === 404);
    check("qr: a wrong code fails", (await api(anon, `/api/files/${snd[0].id}?q=${mp.qr_token.slice(0, -2)}xx`)).status === 404);
    const otherPhoto = (await db.query("select id from uploads where order_id=$1 and kind='PET_PHOTO' order by sort_order desc limit 1", [orderId])).rows[0].id;
    check("qr: the code doesn't unlock the customer's other order photos", (await api(anon, `/api/files/${otherPhoto}?q=${mp.qr_token}`)).status === 404);
    // Customer pauses scanning
    await a.goto(`${BASE}/account/memories/${mp.id}`);
    await a.getByLabel("Scanning the keepsake opens this page").uncheck();
    await a.getByText(/Scanning is paused/).waitFor();
    const r2 = await scanner.goto(`${BASE}/q/${mp.qr_token}`);
    check("qr: paused scanning shows a gentle resting page", r2?.status() === 200 && (await scanner.getByText("This keepsake is resting quietly.").count()) === 1);
    check("qr: paused scanning blocks the files", (await api(anon, `/api/files/${snd[0].id}?q=${mp.qr_token}`)).status === 404);
    await a.getByLabel("Scanning the keepsake opens this page").check();
    await a.getByText("Scanning is on.").waitFor();
    // Engraving file for production
    const eng = await ctxAdmin.request.get(`${BASE}/api/admin/engraving/${orderId}`);
    const svg = await eng.text();
    check("engraving: admin gets SVG with name, waveform and QR", eng.status() === 200 && svg.includes(">Bruno<") && (svg.match(/<rect /g) ?? []).length >= 8 && svg.includes("<path d="));
    check("engraving: customers can't download it", (await api(ctxA, `/api/admin/engraving/${orderId}`)).status === 404);
    // Download everything
    const zip = await ctxA.request.get(`${BASE}/api/memories/${mp.id}/export`);
    const zb = await zip.body();
    check("export: owner downloads a zip of everything", zip.status() === 200 && zb[0] === 0x50 && zb[1] === 0x4b);
    check("export: other customers can't", (await api(ctxB, `/api/memories/${mp.id}/export`)).status === 404);
  }, a);

  await step("memory pages", async () => {
    const mp = (await db.query("select id, slug from memory_pages where order_id=$1", [orderId])).rows[0];
    const anonPage = await anon.newPage();
    const r1 = await anonPage.goto(`${BASE}/m/${mp.slug}`);
    check("memory: private page is 404 to strangers", r1?.status() === 404);
    const r2 = await a.goto(`${BASE}/m/${mp.slug}`);
    check("memory: owner can view private page", r2?.status() === 200);
    check("memory: page sends noindex", (r2?.headers()["x-robots-tag"] ?? "").includes("noindex"));
    // Edit: upload a photo, set visibility
    await a.goto(`${BASE}/account/memories/${mp.id}`);
    const input = a.locator('input[type="file"][accept^="image/jpeg,image/png,image/webp"]');
    await input.setInputFiles(photos[2]);
    await a.locator('img[src*="v=thumb"]').first().waitFor({ timeout: 20000 });
    await a.locator("#m-story").fill("Bruno found us on a rainy July evening.\n\nHe never learned to fetch.");
    await a.getByRole("button", { name: "Save" }).click();
    await a.getByText("Saved.").waitFor();
    const memImg = (await db.query("select id from uploads where memory_page_id=$1 limit 1", [mp.id])).rows[0].id;
    await a.getByRole("radio", { name: /Anyone with the link/ }).click();
    await a.getByText("Anyone with the link can now view this page.").waitFor();
    await shot(a, "08-memory-editor-mobile", true);
    const r3 = await anonPage.goto(`${BASE}/m/${mp.slug}`);
    check("memory: shared page visible with link", r3?.status() === 200);
    await anonPage.waitForTimeout(1000);
    await shot(anonPage, "09-memory-page-shared", true);
    check("memory: shared media needs the page link", (await api(anon, `/api/files/${memImg}?m=${mp.slug}`)).status === 200 && (await api(anon, `/api/files/${memImg}`)).status === 404);
    const sharedOrig = await anon.request.get(`${BASE}/api/files/${memImg}?m=${mp.slug}&v=original`);
    check("memory: shared viewers never get the original file", sharedOrig.headers()["content-type"] === "image/webp");
    check("memory: guessing a wrong slug fails", (await api(anon, `/api/files/${memImg}?m=${mp.slug.slice(0, -1)}x`)).status === 404);
    // Reset link
    a.once("dialog", (d) => d.accept());
    await a.getByRole("button", { name: "New link" }).click();
    await a.getByText("New link created.").waitFor();
    const r4 = await anonPage.goto(`${BASE}/m/${mp.slug}`);
    check("memory: old link stops working after reset", r4?.status() === 404);
    // Delete
    await a.getByRole("button", { name: "Delete permanently…" }).click();
    await a.locator("#confirm-del").fill("Bruno");
    await a.getByRole("button", { name: "Delete forever" }).click();
    await a.waitForURL(/\/account$/);
    const gone = (await db.query("select count(*)::int n from memory_pages where id=$1", [mp.id])).rows[0].n === 0;
    const filesGone = (await db.query("select count(*)::int n from uploads where memory_page_id=$1", [mp.id])).rows[0].n === 0;
    check("memory: customer deletion removes page and files", gone && filesGone);
    check("memory: deleted media no longer served", (await api(ctxA, `/api/files/${memImg}`)).status === 404);
  });

  /* ───────────── Razorpay webhook (signed, no real keys needed) ───────────── */
  await step("payments: webhook", async () => {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret) return check("payments: webhook (skipped: no RAZORPAY_WEBHOOK_SECRET)", true);
    // A second, unpaid order for A
    const fresh: string[] = [];
    for (const f of photos.slice(0, 3)) {
      const r = await ctxA.request.post(`${BASE}/api/uploads`, { headers: { origin: BASE }, multipart: { kind: "PET_PHOTO", file: { name: "p.jpg", mimeType: "image/jpeg", buffer: await sharp(f).toBuffer() } } });
      fresh.push((await r.json()).upload.id);
    }
    const created = await api(ctxA, "/api/orders", {
      json: {
        idempotencyKey: randomUUID(),
        pet: { petName: "Mishti", animalType: "Cat", breed: "Indie cat", photoIds: fresh },
        story: {},
        personalise: { productSlug: "personality-edition", variantId: (await db.query("select v.id from product_variants v join products p on p.id=v.product_id where p.slug='personality-edition' order by v.sort_order limit 1")).rows[0].id, engravedName: "Mishti", wantsMemoryPage: false },
        delivery: { shipName: "Asha", shipPhone: "9876543210", shipLine1: "12 MG Road", shipCity: "Pune", shipState: "Maharashtra", shipPincode: "411001" },
      },
    });
    const oid = created.body.order.id;
    const total = (await db.query("select total_paise from orders where id=$1", [oid])).rows[0].total_paise;
    await db.query("insert into payments (order_id, provider, status, amount_paise, provider_order_id) values ($1,'RAZORPAY','CREATED',$2,$3)", [oid, total, `order_e2e_${stamp}`]);
    const send = (event: string, amount: number, sig?: string) => {
      const body = JSON.stringify({ event, payload: { payment: { entity: { id: `pay_e2e_${stamp}`, order_id: `order_e2e_${stamp}`, amount, status: "captured", method: "upi" } } } });
      return anon.request.post(`${BASE}/api/payments/razorpay/webhook`, { data: body, headers: { "content-type": "application/json", "x-razorpay-signature": sig ?? createHmac("sha256", secret).update(body).digest("hex") } });
    };
    check("webhook: bad signature rejected", (await send("payment.captured", total, "deadbeef")).status() === 401);
    await send("payment.failed", total);
    let st = (await db.query("select payment_status from orders where id=$1", [oid])).rows[0].payment_status;
    check("webhook: failed payment does not mark order paid", st === "PENDING", st);
    await send("payment.captured", total - 100);
    st = (await db.query("select payment_status from orders where id=$1", [oid])).rows[0].payment_status;
    check("webhook: amount mismatch does not mark order paid", st === "PENDING", st);
    await send("payment.captured", total);
    await send("payment.captured", total); // replay
    st = (await db.query("select payment_status from orders where id=$1", [oid])).rows[0].payment_status;
    const ev = (await db.query("select count(*)::int n from order_events where order_id=$1 and type='PAYMENT'", [oid])).rows[0].n;
    check("webhook: valid capture marks paid exactly once (idempotent)", st === "PAID" && ev === 1, `${st} ${ev}`);
  });

  /* ───────────── Public pages & responsive screenshots ───────────── */
  await step("public pages", async () => {
    const pages: [string, string][] = [
      ["/", "home"],
      ["/editions", "editions"],
      ["/editions/forever-in-our-hearts-edition", "edition-memorial"],
      ["/gifts/custom-cat-figurine", "landing-cat"],
    ];
    for (const vp of [
      { name: "mobile", width: 390, height: 844 },
      { name: "desktop", width: 1440, height: 900 },
    ]) {
      const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
      const p = await ctx.newPage();
      for (const [path, name] of pages) {
        await p.goto(`${BASE}${path}`, { waitUntil: "networkidle" });
        const overflow = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
        check(`responsive: no horizontal scroll on ${path} (${vp.name})`, overflow <= 1, `${overflow}px`);
        await p.waitForTimeout(1500);
        await shot(p, `20-${name}-${vp.name}`, false);
      }
      await ctx.close();
    }
    const html = await (await anon.request.get(`${BASE}/editions/forever-edition`)).text();
    check("seo: product JSON-LD present", html.includes('"@type":"Product"') && html.includes('"priceCurrency":"INR"'));
    check("seo: canonical + OG tags present", html.includes('rel="canonical"') && html.includes('property="og:title"'));
    const sm = await (await anon.request.get(`${BASE}/sitemap.xml`)).text();
    check("seo: sitemap lists editions but not memory pages", sm.includes("/editions/forever-edition") && !sm.includes("/m/"));
    const rb = await (await anon.request.get(`${BASE}/robots.txt`)).text();
    check("seo: robots disallows /m/, /admin, /account", rb.includes("Disallow: /m/") && rb.includes("Disallow: /admin"));
  });

  check("no uncaught browser errors during customer flow", consoleErrors.length === 0, consoleErrors.join(" | "));

  await browser.close();
  await db.end();
  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  await writeFile(`${OUT}/results.json`, JSON.stringify(results, null, 2));
  process.exit(failed.length ? 1 : 0);
}

main().catch(async (e) => {
  console.error(e);
  process.exit(1);
});
