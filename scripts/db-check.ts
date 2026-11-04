/**
 * Diagnoses the local database setup in plain language.
 *   npm run db:check
 */
import "dotenv/config";
import { Pool } from "pg";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("✗ DATABASE_URL is missing from .env");
  process.exit(1);
}
let shown = url;
try {
  const u = new URL(url);
  if (u.password) u.password = "****";
  shown = u.toString();
} catch {}
console.log(`Using DATABASE_URL = ${shown}`);

const pool = new Pool({ connectionString: url, connectionTimeoutMillis: 5000 });
try {
  const v = await pool.query("select version() as v, current_database() as db, current_user as u");
  console.log(`✓ Connected: database "${v.rows[0].db}" as "${v.rows[0].u}"`);
  console.log(`  ${String(v.rows[0].v).split(",")[0]}`);
  const t = await pool.query("select table_name from information_schema.tables where table_schema='public' order by 1");
  const tables = t.rows.map((r) => r.table_name);
  const needed = ["users", "products", "orders", "settings", "uploads", "memory_pages"];
  const missing = needed.filter((n) => !tables.includes(n));
  if (missing.length) {
    console.log(`✗ Tables missing: ${missing.join(", ")}`);
    console.log("  → Run: npm run db:migrate && npm run db:seed && npm run admin:create");
    process.exitCode = 1;
  } else {
    const p = await pool.query("select count(*)::int n from products");
    const a = await pool.query("select email from users where role='ADMIN'");
    console.log(`✓ All tables present. Editions: ${p.rows[0].n}. Admins: ${a.rows.map((r) => r.email).join(", ") || "none"}`);
    if (!p.rows[0].n) console.log("  → Run: npm run db:seed");
    if (!a.rows.length) console.log("  → Run: npm run admin:create");
    if (p.rows[0].n && a.rows.length) console.log("Everything looks good. Restart `npm run dev` if it was already running.");
  }
} catch (e) {
  const err = e as { code?: string; message: string };
  console.log(`✗ Can't use the database: ${err.message}`);
  if (err.code === "28P01") {
    console.log("  → Wrong password, or you're reaching a different Postgres than the Docker one.");
    console.log("    Check DATABASE_URL is postgres://pawsome:pawsome@127.0.0.1:54329/pawsome,");
    console.log("    then: docker compose down -v && docker compose up -d");
  } else if (err.code === "ECONNREFUSED" || /timeout/i.test(err.message)) {
    console.log("  → Nothing is listening there. Is Docker Desktop running? Then: docker compose up -d");
  } else if (err.code === "3D000") {
    console.log("  → That database doesn't exist. With Docker: docker compose down -v && docker compose up -d");
  }
  process.exitCode = 1;
} finally {
  await pool.end();
}
