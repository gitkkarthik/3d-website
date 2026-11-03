/**
 * Creates (or promotes) an admin account.
 *   npm run admin:create                       → uses ADMIN_EMAIL / ADMIN_PASSWORD from .env
 *   npm run admin:create -- you@x.com 'secret' → explicit
 */
import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq } from "drizzle-orm";
import { Pool } from "pg";
import { scrypt, randomBytes } from "node:crypto";
import * as schema from "../src/lib/db/schema";

const [emailArg, pwArg] = process.argv.slice(2);
const email = (emailArg ?? process.env.ADMIN_EMAIL ?? "").toLowerCase().trim();
const password = pwArg ?? process.env.ADMIN_PASSWORD ?? "";
if (!email || password.length < 12) {
  console.error("Provide an email and a password of at least 12 characters.");
  process.exit(1);
}

const salt = randomBytes(16);
const key: Buffer = await new Promise((res, rej) =>
  scrypt(password.normalize("NFKC"), salt, 64, { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }, (e, k) => (e ? rej(e) : res(k))),
);
const passwordHash = ["scrypt", salt.toString("base64"), key.toString("base64")].join("$");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });
const [existing] = await db.select().from(schema.users).where(eq(schema.users.email, email));
if (existing) {
  await db.update(schema.users).set({ role: "ADMIN", passwordHash }).where(eq(schema.users.id, existing.id));
  console.log(`✓ ${email} promoted to admin (password updated)`);
} else {
  await db.insert(schema.users).values({ email, name: "Studio", passwordHash, role: "ADMIN" });
  console.log(`✓ admin ${email} created`);
}
await pool.end();
