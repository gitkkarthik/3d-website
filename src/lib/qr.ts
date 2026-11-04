import "server-only";
import QRCode from "qrcode";
import { SITE } from "./site";

/** The permanent URL engraved on a keepsake. Uses APP_URL, so set it to your real domain before production. */
export function scanUrl(qrToken: string) {
  return `${SITE.url.replace(/\/$/, "")}/q/${qrToken}`;
}

export async function qrSvg(text: string, color = "#2b2724") {
  return QRCode.toString(text, { type: "svg", errorCorrectionLevel: "M", margin: 1, color: { dark: color, light: "#0000" } });
}

/** Raw module matrix, for building engraving files. */
export function qrMatrix(text: string) {
  const qr = QRCode.create(text, { errorCorrectionLevel: "M" });
  const n = qr.modules.size;
  const rows: boolean[][] = [];
  for (let y = 0; y < n; y++) rows.push(Array.from({ length: n }, (_, x) => !!qr.modules.get(x, y)));
  return rows;
}

export function isLocalUrl() {
  return /localhost|127\.0\.0\.1/.test(SITE.url);
}
