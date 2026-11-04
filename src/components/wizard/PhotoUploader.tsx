"use client";

import { useRef, useState } from "react";

export type UploadedPhoto = { id: string; preview?: string };
type Pending = { key: string; preview: string; progress: number; error?: string; file: File };

const ACCEPT = "image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif";
const MAX_MB = 15;

/** True for iPhone/Mac HEIC/HEIF photos, judged by the file's own bytes (browsers often report no type). */
async function looksHeic(file: File): Promise<boolean> {
  if (/\.(heic|heif)$/i.test(file.name) || /image\/hei[cf]/i.test(file.type)) return true;
  const head = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const box = String.fromCharCode(...head.slice(4, 12));
  return /^ftyp(heic|heix|heim|heis|hevc|mif1|msf1)/.test(box);
}

/**
 * Our servers can't decode HEIC, so convert it to a high-quality JPEG in the browser first.
 * The converter (~3 MB) only loads when someone actually picks a HEIC photo.
 */
export async function prepareImage(file: File): Promise<File> {
  if (!(await looksHeic(file))) return file;
  try {
    const { heicTo } = await import("heic-to/next");
    const jpeg = await heicTo({ blob: file, type: "image/jpeg", quality: 0.92 });
    return new File([jpeg], file.name.replace(/\.(heic|heif)$/i, "") + ".jpg", { type: "image/jpeg" });
  } catch {
    throw new Error("We couldn't convert this HEIC photo. Try exporting it as JPG.");
  }
}

export async function uploadOne(file: File, kind: string, onProgress: (n: number) => void, extra: Record<string, string> = {}): Promise<{ id: string }> {
  if (kind === "PET_PHOTO" || kind === "MEMORY_IMAGE" || kind === "PREVIEW") file = await prepareImage(file);
  return new Promise((resolve, reject) => {
    const fd = new FormData();
    fd.append("kind", kind);
    fd.append("file", file);
    for (const [k, v] of Object.entries(extra)) fd.append(k, v);
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/uploads");
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => {
      let body: { upload?: { id: string }; error?: string } = {};
      try {
        body = JSON.parse(xhr.responseText);
      } catch {}
      if (xhr.status >= 200 && xhr.status < 300 && body.upload) resolve(body.upload);
      else reject(new Error(body.error ?? "Upload failed. Please try again."));
    };
    xhr.onerror = () => reject(new Error("Network hiccup. Please try again."));
    xhr.send(fd);
  });
}

export function PhotoUploader({
  value,
  onChange,
  min,
  max,
  label,
  hint,
  error,
  kind = "PET_PHOTO",
  id = "photos",
}: {
  value: UploadedPhoto[];
  onChange: (next: UploadedPhoto[] | ((prev: UploadedPhoto[]) => UploadedPhoto[])) => void;
  min: number;
  max: number;
  label: string;
  hint?: string;
  error?: string;
  kind?: string;
  id?: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const replaceTarget = useRef<string | null>(null);
  const [pending, setPending] = useState<Pending[]>([]);
  const [drag, setDrag] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const slotsLeft = max - value.length - pending.filter((p) => !p.error).length;

  async function handleFiles(files: FileList | File[]) {
    setNotice(null);
    let list = Array.from(files);
    const replacing = replaceTarget.current;
    replaceTarget.current = null;
    const room = replacing ? 1 : slotsLeft;
    if (list.length > room) {
      setNotice(room <= 0 ? `You've already added ${max} photos. Remove one to add another.` : `Only ${room} more photo${room === 1 ? "" : "s"} can be added, so we took the first ${room}.`);
      list = list.slice(0, Math.max(0, room));
    }
    if (replacing && list.length) await remove(replacing);
    for (const file of list) {
      const key = `${Date.now()}-${Math.random()}`;
      const preview = URL.createObjectURL(file);
      if (file.size > MAX_MB * 1024 * 1024) {
        setPending((p) => [...p, { key, preview, progress: 0, file, error: `Larger than ${MAX_MB} MB` }]);
        continue;
      }
      setPending((p) => [...p, { key, preview, progress: 0, file }]);
      uploadOne(file, kind, (n) => setPending((p) => p.map((x) => (x.key === key ? { ...x, progress: n } : x))))
        .then((u) => {
          setPending((p) => p.filter((x) => x.key !== key));
          // Browsers can't show HEIC, so use the server's converted thumbnail for those.
          const showable = !/\.(heic|heif)$/i.test(file.name) && !/hei[cf]/i.test(file.type);
          onChange((prev) => [...prev, { id: u.id, preview: showable ? preview : undefined }]);
        })
        .catch((e: Error) => setPending((p) => p.map((x) => (x.key === key ? { ...x, error: e.message } : x))));
    }
  }

  async function remove(photoId: string) {
    onChange((prev) => prev.filter((p) => p.id !== photoId));
    await fetch(`/api/uploads?id=${photoId}`, { method: "DELETE" }).catch(() => {});
  }

  const count = value.length;
  return (
    <div>
      <div className="flex items-baseline justify-between gap-4">
        <span className="field-label" id={`${id}-label`}>
          {label}
        </span>
        <span className={`text-sm ${count >= min ? "text-sage" : "text-ink-mute"}`} aria-live="polite">
          {count} of {min}–{max}
        </span>
      </div>
      {hint && <p className="field-hint -mt-1 mb-3">{hint}</p>}

      <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-5">
        {value.map((p, i) => (
          <div key={p.id} className="group relative aspect-square overflow-hidden rounded-xl bg-sand">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.preview ?? `/api/files/${p.id}?v=thumb`} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" />
            <div className="absolute inset-x-1.5 bottom-1.5 flex gap-1">
              <button
                type="button"
                onClick={() => {
                  replaceTarget.current = p.id;
                  input.current?.click();
                }}
                className="flex-1 rounded-lg bg-paper/90 py-1 text-[0.7rem] font-medium text-ink backdrop-blur hover:bg-paper"
              >
                Replace
              </button>
              <button type="button" onClick={() => remove(p.id)} aria-label={`Remove photo ${i + 1}`} className="rounded-lg bg-paper/90 px-2 py-1 text-[0.7rem] font-medium text-ink backdrop-blur hover:bg-paper">
                ✕
              </button>
            </div>
            {i === 0 && <span className="absolute left-1.5 top-1.5 rounded-full bg-ink/75 px-2 py-0.5 text-[0.62rem] font-medium text-ivory">Cover</span>}
          </div>
        ))}
        {pending.map((p) => (
          <div key={p.key} className="relative aspect-square overflow-hidden rounded-xl bg-sand">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.preview} alt="" className={`h-full w-full object-cover ${p.error ? "opacity-30 grayscale" : "opacity-60"}`} />
            {p.error ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 p-2 text-center">
                <p className="text-[0.7rem] font-medium leading-tight text-[#8a3b2a]" role="alert">
                  {p.error}
                </p>
                <button type="button" className="text-[0.7rem] underline" onClick={() => setPending((x) => x.filter((y) => y.key !== p.key))}>
                  Dismiss
                </button>
              </div>
            ) : (
              <div className="absolute inset-x-2 bottom-2 h-1 overflow-hidden rounded-full bg-paper/70" role="progressbar" aria-valuenow={p.progress} aria-valuemin={0} aria-valuemax={100} aria-label="Uploading">
                <div className="h-full bg-clay transition-[width]" style={{ width: `${Math.max(6, p.progress)}%` }} />
              </div>
            )}
          </div>
        ))}
        {slotsLeft > 0 && (
          <button
            type="button"
            onClick={() => input.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDrag(true);
            }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDrag(false);
              handleFiles(e.dataTransfer.files);
            }}
            aria-describedby={`${id}-label`}
            className={`flex aspect-square flex-col items-center justify-center gap-1.5 rounded-xl border-[1.5px] border-dashed text-center transition-colors ${
              drag ? "border-clay bg-clay/5" : error ? "border-[#b4553f]/60 bg-paper" : "border-oat bg-paper hover:border-ink-mute"
            }`}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-ink-mute" aria-hidden>
              <path d="M12 5v14M5 12h14" strokeLinecap="round" />
            </svg>
            <span className="px-1 text-[0.75rem] font-medium text-ink-soft">{count === 0 ? "Add photos" : "Add more"}</span>
          </button>
        )}
      </div>
      <input
        ref={input}
        id={id}
        type="file"
        accept={ACCEPT}
        multiple
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => {
          if (e.target.files?.length) handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
      {(notice || error) && (
        <p className={`mt-2 text-sm ${error ? "text-[#a3402c]" : "text-ink-soft"}`} role={error ? "alert" : undefined}>
          {error ?? notice}
        </p>
      )}
    </div>
  );
}
