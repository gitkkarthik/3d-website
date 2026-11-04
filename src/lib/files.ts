import "server-only";
import sharp from "sharp";
import { randomUUID } from "node:crypto";
import { storage } from "./storage";
import type { UploadKind } from "./db/schema";

export const LIMITS = {
  image: 15 * 1024 * 1024,
  audio: 20 * 1024 * 1024,
  video: 80 * 1024 * 1024,
};

type Family = "image" | "audio" | "video";
export type Sniffed = { mime: string; ext: string; family: Family };

/** Identify a file by its leading bytes. We never trust the browser-supplied type or extension. */
export function sniff(buf: Buffer): Sniffed | null {
  const at = (off: number, ...bytes: number[]) => bytes.every((b, i) => buf[off + i] === b);
  const ascii = (off: number, s: string) => buf.subarray(off, off + s.length).toString("latin1") === s;

  if (at(0, 0xff, 0xd8, 0xff)) return { mime: "image/jpeg", ext: "jpg", family: "image" };
  if (at(0, 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)) return { mime: "image/png", ext: "png", family: "image" };
  if (ascii(0, "RIFF") && ascii(8, "WEBP")) return { mime: "image/webp", ext: "webp", family: "image" };
  if (ascii(0, "RIFF") && ascii(8, "WAVE")) return { mime: "audio/wav", ext: "wav", family: "audio" };
  if (ascii(4, "ftyp")) {
    const brand = buf.subarray(8, 12).toString("latin1");
    if (["heic", "heix", "mif1", "msf1", "heim", "heis", "hevc"].includes(brand))
      return { mime: "image/heic", ext: "heic", family: "image" };
    if (brand === "avif") return { mime: "image/avif", ext: "avif", family: "image" };
    if (brand === "M4A " || brand === "M4B ") return { mime: "audio/mp4", ext: "m4a", family: "audio" };
    if (brand === "qt  ") return { mime: "video/quicktime", ext: "mov", family: "video" };
    return { mime: "video/mp4", ext: "mp4", family: "video" };
  }
  if (at(0, 0x1a, 0x45, 0xdf, 0xa3)) return { mime: "video/webm", ext: "webm", family: "video" };
  if (ascii(0, "OggS")) return { mime: "audio/ogg", ext: "ogg", family: "audio" };
  if (ascii(0, "ID3") || (buf[0] === 0xff && (buf[1] & 0xe0) === 0xe0)) return { mime: "audio/mpeg", ext: "mp3", family: "audio" };
  return null;
}

export const KIND_FAMILY: Record<UploadKind, Family[]> = {
  PET_PHOTO: ["image"],
  // Recorded in the browser (webm/mp4 containers) or uploaded from voice memos / WhatsApp (ogg, m4a, mp3).
  PET_SOUND: ["audio", "video"],
  PREVIEW: ["image"],
  MEMORY_IMAGE: ["image"],
  MEMORY_VIDEO: ["video"],
  // Browser voice notes are recorded as webm/opus, which sniffs as the webm container.
  MEMORY_AUDIO: ["audio", "video"],
};

export class UploadError extends Error {}

export type StoredFile = {
  storageKey: string;
  displayKey: string | null;
  thumbKey: string | null;
  mimeType: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
};

/**
 * Validate and store a file.
 * Images: the untouched original is kept privately for our artists; browsers only ever
 * get re-encoded copies with all metadata (including GPS location) stripped.
 */
export async function processAndStore(buf: Buffer, kind: UploadKind): Promise<StoredFile> {
  if (buf.length === 0) throw new UploadError("That file is empty.");
  const s = sniff(buf);
  if (s?.mime === "image/heic") {
    throw new UploadError("HEIC photos can't be read yet. On iPhone, share the photo as JPG (or pick it from Photos in Safari, which converts it).");
  }
  if (!s || !KIND_FAMILY[kind].includes(s.family)) {
    throw new UploadError(
      kind === "MEMORY_VIDEO"
        ? "Please upload an MP4, MOV or WebM video."
        : kind === "MEMORY_AUDIO" || kind === "PET_SOUND"
          ? "Please upload an MP3, M4A, WAV, OGG or WebM recording."
          : "Please upload a JPG, PNG, WebP or HEIC photo.",
    );
  }
  const limit = kind === "PET_SOUND" ? LIMITS.audio : LIMITS[s.family];
  if (buf.length > limit) throw new UploadError(`That file is larger than ${Math.round(limit / 1048576)} MB.`);

  // Effective type for webm audio recordings.
  const isAudioKind = kind === "MEMORY_AUDIO" || kind === "PET_SOUND";
  const mime = isAudioKind && s.mime === "video/webm" ? "audio/webm" : isAudioKind && s.mime === "video/mp4" ? "audio/mp4" : s.mime;
  const id = randomUUID();
  const prefix = `${kind.toLowerCase()}/${id.slice(0, 2)}/${id}`;
  const store = storage();

  if (s.family !== "image") {
    const storageKey = `${prefix}.${s.ext}`;
    await store.put(storageKey, buf, mime);
    return { storageKey, displayKey: null, thumbKey: null, mimeType: mime, sizeBytes: buf.length, width: null, height: null };
  }

  let meta: Awaited<ReturnType<ReturnType<typeof sharp>["metadata"]>>;
  try {
    meta = await sharp(buf, { failOn: "error" }).metadata();
    if (!meta.width || !meta.height) throw new Error("no dimensions");
    if (meta.width * meta.height > 80_000_000) throw new UploadError("That photo is too large in dimensions.");
  } catch (e) {
    if (e instanceof UploadError) throw e;
    throw new UploadError("We couldn't read that photo. Could you try a different file?");
  }
  if (Math.min(meta.width, meta.height) < 300 && kind === "PET_PHOTO") {
    throw new UploadError("That photo is quite small. Our artists need at least 300px on the shortest side.");
  }

  const display = await sharp(buf).rotate().resize({ width: 1800, height: 1800, fit: "inside", withoutEnlargement: true }).webp({ quality: 84 }).toBuffer({ resolveWithObject: true });
  const thumb = await sharp(buf).rotate().resize({ width: 480, height: 480, fit: "cover" }).webp({ quality: 78 }).toBuffer();

  const storageKey = `${prefix}.orig.${s.ext}`;
  const displayKey = `${prefix}.display.webp`;
  const thumbKey = `${prefix}.thumb.webp`;
  await Promise.all([
    store.put(storageKey, buf, mime),
    store.put(displayKey, display.data, "image/webp"),
    store.put(thumbKey, thumb, "image/webp"),
  ]);
  return {
    storageKey,
    displayKey,
    thumbKey,
    mimeType: mime,
    sizeBytes: buf.length,
    width: display.info.width,
    height: display.info.height,
  };
}

export async function deleteStored(u: { storageKey: string; displayKey: string | null; thumbKey: string | null }) {
  const store = storage();
  await Promise.all([u.storageKey, u.displayKey, u.thumbKey].filter(Boolean).map((k) => store.delete(k!)));
}
