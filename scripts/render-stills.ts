/**
 * Renders the illustrative catalogue stills from the live 3D scene.
 * Requires the dev server on :3000.  npm run renders
 */
import { chromium } from "playwright";
import sharp from "sharp";
import { mkdir } from "node:fs/promises";

const BASE = process.env.RENDER_BASE ?? "http://localhost:3000";
const shots: Record<string, Record<string, string>> = {
  "personality": { figure: "dog-play", coat: "tuxedo", base: "oak", name: "Bruno" },
  "personality-2": { figure: "dog-play", coat: "tuxedo", base: "oak", name: "Bruno", yaw: "-0.9" },
  "forever": { figure: "dog-sitting", coat: "fawn", base: "walnut", name: "Laddoo", line2: "Good boy, always" },
  "forever-2": { figure: "dog-sitting", coat: "fawn", base: "walnut", name: "Laddoo", line2: "Good boy, always", yaw: "0.9" },
  "together": { figure: "together", coat: "tuxedo", base: "oak", name: "Maya & Coco" },
  "together-2": { figure: "together", coat: "tuxedo", base: "oak", name: "Maya & Coco", yaw: "-0.7" },
  "memorial": { figure: "dog-sleeping", coat: "golden", base: "ivory", name: "Simba", line2: "2011 · 2024" },
  "memorial-2": { figure: "dog-sleeping", coat: "golden", base: "ivory", name: "Simba", line2: "2011 · 2024", yaw: "0.8" },
  "cat-tabby": { figure: "cat-loaf", coat: "tabby", base: "slate", name: "Mishti" },
  "cat-ginger": { figure: "cat-loaf", coat: "ginger", base: "walnut", name: "Mango" },
  "dog-chocolate": { figure: "dog-sitting", coat: "chocolate", base: "ivory", name: "Coffee" },
  "dog-cream": { figure: "dog-play", coat: "cream", base: "walnut", name: "Biscuit" },
};

await mkdir("public/renders", { recursive: true });
const browser = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const page = await browser.newPage({ viewport: { width: 1000, height: 1000 }, deviceScaleFactor: 1.4 });
const only = process.argv.slice(2);
for (const [name, q] of Object.entries(shots)) {
  if (only.length && !only.includes(name)) continue;
  await page.goto(`${BASE}/render?${new URLSearchParams({ ...q, bg: "transparent" })}`);
  await page.waitForSelector('body[data-rendered="1"]', { timeout: 90_000 });
  const png = await page.screenshot({ omitBackground: true, timeout: 120_000 });
  await sharp(png).trim({ threshold: 1 }).extend({ top: 40, bottom: 40, left: 40, right: 40, background: { r: 0, g: 0, b: 0, alpha: 0 } }).resize({ width: 1100, withoutEnlargement: true }).webp({ quality: 86, alphaQuality: 90 }).toFile(`public/renders/${name}.webp`);
  console.log("✓", name);
}
await browser.close();
