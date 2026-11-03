"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { uploadOne } from "@/components/wizard/PhotoUploader";
import { deleteMemoryPageAction, resetLinkAction, saveMemoryPageAction, setVisibilityAction } from "@/app/(site)/account/memories/actions";
import type { MemoryEntry, SpecialDate, VideoLink } from "@/lib/db/schema";

type Media = { id: string; kind: string; mimeType: string; caption: string | null };
type Page = {
  id: string;
  slug: string;
  petName: string;
  subtitle: string | null;
  story: string | null;
  message: string | null;
  memories: MemoryEntry[];
  specialDates: SpecialDate[];
  videoLinks: VideoLink[];
  profileUploadId: string | null;
  visibility: "PRIVATE" | "LINK";
  isMemorial: boolean;
};

export function MemoryEditor({ page, media: initialMedia, origin }: { page: Page; media: Media[]; origin: string }) {
  const router = useRouter();
  const [f, setF] = useState({
    petName: page.petName,
    subtitle: page.subtitle ?? "",
    story: page.story ?? "",
    message: page.message ?? "",
    memories: page.memories.length ? page.memories : [{ title: "", body: "" }],
    specialDates: page.specialDates,
    videoLinks: page.videoLinks,
    profileUploadId: page.profileUploadId,
  });
  const [media, setMedia] = useState<Media[]>(initialMedia);
  const [captions, setCaptions] = useState<Record<string, string>>({});
  const [saving, startSave] = useTransition();
  const [status, setStatus] = useState<{ ok: boolean; msg: string } | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);
  const [uploadErr, setUploadErr] = useState<string | null>(null);
  const [visibility, setVisibility] = useState(page.visibility);
  const [newVideo, setNewVideo] = useState("");

  const images = media.filter((m) => m.kind === "MEMORY_IMAGE");
  const videos = media.filter((m) => m.kind === "MEMORY_VIDEO");
  const audios = media.filter((m) => m.kind === "MEMORY_AUDIO");
  const shareUrl = `${origin}/m/${page.slug}`;

  async function addFiles(kind: string, files: FileList | File[], caption?: string) {
    setUploadErr(null);
    for (const file of Array.from(files)) {
      setUploading(`${file.name || "recording"}…`);
      try {
        const u = await uploadOne(file, kind, () => {}, { memoryPageId: page.id, ...(caption ? { caption } : {}) });
        setMedia((m) => [...m, { id: u.id, kind, mimeType: file.type, caption: caption ?? null }]);
      } catch (e) {
        setUploadErr((e as Error).message);
      }
    }
    setUploading(null);
  }

  async function removeMedia(id: string) {
    if (!confirm("Remove this from the memory page? This can't be undone.")) return;
    const res = await fetch(`/api/uploads?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      setMedia((m) => m.filter((x) => x.id !== id));
      if (f.profileUploadId === id) setF((x) => ({ ...x, profileUploadId: null }));
    }
  }

  function save() {
    setStatus(null);
    startSave(async () => {
      const r = await saveMemoryPageAction(page.id, { ...f, captions });
      setStatus(r.ok ? { ok: true, msg: r.message ?? "Saved." } : { ok: false, msg: r.error });
      if (r.ok) router.refresh();
    });
  }

  return (
    <div className="space-y-8">
      {/* Privacy */}
      <section className="rounded-[1.25rem] bg-sage-soft/70 p-6">
        <h2 className="text-xl">Who can see this page</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Visibility">
          {(
            [
              ["PRIVATE", "Only me", "Visible only when you're signed in."],
              ["LINK", "Anyone with the link", "Share the private link with family and friends. Never listed or searchable."],
            ] as const
          ).map(([v, t, d]) => (
            <button
              key={v}
              type="button"
              role="radio"
              aria-checked={visibility === v}
              onClick={async () => {
                const r = await setVisibilityAction(page.id, v);
                if (r.ok) setVisibility(v);
                setStatus(r.ok ? { ok: true, msg: r.message ?? "" } : { ok: false, msg: r.error });
              }}
              className={`rounded-2xl bg-paper p-4 text-left transition-shadow ${visibility === v ? "shadow-[0_0_0_2px_var(--color-ink)]" : "shadow-[0_0_0_1px_var(--color-line)]"}`}
            >
              <span className="block font-medium">{t}</span>
              <span className="mt-0.5 block text-sm text-ink-soft">{d}</span>
            </button>
          ))}
        </div>
        {visibility === "LINK" && (
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <input readOnly value={shareUrl} className="input !py-2 text-sm" aria-label="Share link" onFocus={(e) => e.target.select()} />
            <button type="button" className="btn btn-primary btn-sm shrink-0" onClick={() => navigator.clipboard?.writeText(shareUrl).then(() => setStatus({ ok: true, msg: "Link copied." }))}>
              Copy link
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm shrink-0"
              onClick={async () => {
                if (!confirm("Create a new link? Anyone using the old link will lose access.")) return;
                const r = await resetLinkAction(page.id);
                setStatus(r.ok ? { ok: true, msg: r.message ?? "" } : { ok: false, msg: r.error });
                router.refresh();
              }}
            >
              New link
            </button>
          </div>
        )}
      </section>

      {/* Basics */}
      <section className="card p-6">
        <h2 className="text-xl">About {f.petName || "them"}</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Text label="Name" value={f.petName} onChange={(v) => setF({ ...f, petName: v })} max={40} />
          <Text label="A line beneath their name" value={f.subtitle} onChange={(v) => setF({ ...f, subtitle: v })} max={120} placeholder={page.isMemorial ? "2011 – 2024 · Our gentle giant" : "Chief napping officer since 2019"} />
          <div className="sm:col-span-2">
            <label className="field-label" htmlFor="m-story">
              Their story
            </label>
            <textarea id="m-story" className="input" rows={6} maxLength={6000} value={f.story} onChange={(e) => setF({ ...f, story: e.target.value })} placeholder="How they came into your life, what they were like, what they taught you…" />
          </div>
          <div className="sm:col-span-2">
            <label className="field-label" htmlFor="m-msg">
              A personal message
            </label>
            <textarea id="m-msg" className="input" rows={3} maxLength={1500} value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} placeholder={page.isMemorial ? "We'll love you forever." : "To the best boy in the world…"} />
          </div>
        </div>
      </section>

      {/* Photos */}
      <section className="card p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl">Photos</h2>
          <FileButton label="Add photos" accept="image/jpeg,image/png,image/webp" multiple onFiles={(fl) => addFiles("MEMORY_IMAGE", fl)} />
        </div>
        {images.length === 0 && !f.profileUploadId ? (
          <p className="mt-4 text-sm text-ink-mute">No photos yet. Add the ones you go back to again and again.</p>
        ) : (
          <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {images.map((m) => (
              <li key={m.id} className="overflow-hidden rounded-xl bg-sand">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/api/files/${m.id}?v=thumb`} alt="" className="aspect-square w-full object-cover" />
                <div className="space-y-2 bg-paper p-2">
                  <input className="input !px-2.5 !py-1.5 text-sm" placeholder="Caption" maxLength={200} defaultValue={m.caption ?? ""} onChange={(e) => setCaptions((c) => ({ ...c, [m.id]: e.target.value }))} aria-label="Caption" />
                  <div className="flex justify-between text-xs">
                    <button type="button" className={f.profileUploadId === m.id ? "font-semibold text-sage" : "underline"} onClick={() => setF({ ...f, profileUploadId: m.id })}>
                      {f.profileUploadId === m.id ? "Profile photo ✓" : "Use as profile"}
                    </button>
                    <button type="button" className="text-[#a3402c] underline" onClick={() => removeMedia(m.id)}>
                      Remove
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Voice */}
      <section className="card p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl">Voice recordings</h2>
            <p className="text-sm text-ink-mute">Their bark, their purr, or you telling a story about them.</p>
          </div>
          <div className="flex gap-2">
            <Recorder onDone={(file) => addFiles("MEMORY_AUDIO", [file], "Voice note")} />
            <FileButton label="Upload audio" accept="audio/*,.m4a,.mp3,.wav,.ogg,.webm" onFiles={(fl) => addFiles("MEMORY_AUDIO", fl)} ghost />
          </div>
        </div>
        <ul className="mt-5 space-y-3">
          {audios.map((m) => (
            <li key={m.id} className="flex flex-col gap-2 rounded-xl bg-sand/60 p-3 sm:flex-row sm:items-center">
              <audio controls preload="none" src={`/api/files/${m.id}`} className="w-full sm:flex-1" />
              <input className="input !py-1.5 text-sm sm:w-56" placeholder="What is this?" maxLength={200} defaultValue={m.caption ?? ""} onChange={(e) => setCaptions((c) => ({ ...c, [m.id]: e.target.value }))} aria-label="Recording title" />
              <button type="button" className="text-sm text-[#a3402c] underline" onClick={() => removeMedia(m.id)}>
                Remove
              </button>
            </li>
          ))}
        </ul>
      </section>

      {/* Video */}
      <section className="card p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl">Videos</h2>
          <FileButton label="Upload video" accept="video/mp4,video/quicktime,video/webm" onFiles={(fl) => addFiles("MEMORY_VIDEO", fl)} />
        </div>
        <p className="mt-1 text-sm text-ink-mute">Up to 80 MB each. For longer videos, paste a YouTube or Vimeo link (unlisted is fine).</p>
        <ul className="mt-4 space-y-3">
          {videos.map((m) => (
            <li key={m.id} className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <video controls preload="metadata" src={`/api/files/${m.id}`} className="w-full rounded-xl bg-night sm:w-64" />
              <input className="input !py-1.5 text-sm sm:flex-1" placeholder="Caption" maxLength={200} defaultValue={m.caption ?? ""} onChange={(e) => setCaptions((c) => ({ ...c, [m.id]: e.target.value }))} aria-label="Video caption" />
              <button type="button" className="text-sm text-[#a3402c] underline" onClick={() => removeMedia(m.id)}>
                Remove
              </button>
            </li>
          ))}
          {f.videoLinks.map((v, i) => (
            <li key={i} className="flex items-center gap-2 text-sm">
              <span className="min-w-0 flex-1 truncate">{v.url}</span>
              <button type="button" className="text-[#a3402c] underline" onClick={() => setF({ ...f, videoLinks: f.videoLinks.filter((_, j) => j !== i) })}>
                Remove
              </button>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex gap-2">
          <input className="input !py-2 text-sm" placeholder="https://youtu.be/…" value={newVideo} onChange={(e) => setNewVideo(e.target.value)} aria-label="Video link" />
          <button
            type="button"
            className="btn btn-ghost btn-sm shrink-0"
            onClick={() => {
              if (!/^https:\/\/\S+$/.test(newVideo.trim())) return setStatus({ ok: false, msg: "Paste a full https:// link." });
              setF({ ...f, videoLinks: [...f.videoLinks, { url: newVideo.trim() }] });
              setNewVideo("");
            }}
          >
            Add link
          </button>
        </div>
      </section>

      {/* Memories */}
      <section className="card p-6">
        <h2 className="text-xl">Favourite memories</h2>
        <div className="mt-4 space-y-4">
          {f.memories.map((m, i) => (
            <div key={i} className="rounded-xl bg-sand/50 p-4">
              <input className="input" placeholder="A title, e.g. The great mango heist of 2021" maxLength={120} value={m.title} onChange={(e) => setF({ ...f, memories: f.memories.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)) })} aria-label="Memory title" />
              <textarea className="input mt-2" rows={3} maxLength={2000} placeholder="Tell it the way you'd tell a friend…" value={m.body} onChange={(e) => setF({ ...f, memories: f.memories.map((x, j) => (j === i ? { ...x, body: e.target.value } : x)) })} aria-label="Memory" />
              <button type="button" className="mt-2 text-sm text-ink-mute underline" onClick={() => setF({ ...f, memories: f.memories.filter((_, j) => j !== i) })}>
                Remove
              </button>
            </div>
          ))}
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setF({ ...f, memories: [...f.memories, { title: "", body: "" }] })}>
            + Add a memory
          </button>
        </div>
      </section>

      {/* Dates */}
      <section className="card p-6">
        <h2 className="text-xl">Special dates</h2>
        <div className="mt-4 space-y-3">
          {f.specialDates.map((d, i) => (
            <div key={i} className="flex flex-col gap-2 sm:flex-row">
              <input className="input" placeholder="e.g. Gotcha day" maxLength={60} value={d.label} onChange={(e) => setF({ ...f, specialDates: f.specialDates.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) })} aria-label="Date label" />
              <input type="date" className="input sm:w-48" value={d.date} onChange={(e) => setF({ ...f, specialDates: f.specialDates.map((x, j) => (j === i ? { ...x, date: e.target.value } : x)) })} aria-label="Date" />
              <button type="button" className="text-sm text-ink-mute underline" onClick={() => setF({ ...f, specialDates: f.specialDates.filter((_, j) => j !== i) })}>
                Remove
              </button>
            </div>
          ))}
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setF({ ...f, specialDates: [...f.specialDates, { label: "", date: "" }] })}>
            + Add a date
          </button>
        </div>
      </section>

      {/* Save bar */}
      <div className="sticky bottom-0 z-20 -mx-4 flex flex-col gap-2 border-t border-line bg-ivory/95 px-4 py-3 backdrop-blur sm:mx-0 sm:flex-row sm:items-center sm:justify-between sm:rounded-2xl sm:border sm:px-5">
        <p className={`text-sm ${status?.ok === false || uploadErr ? "text-[#a3402c]" : "text-ink-soft"}`} role="status">
          {uploading ? `Uploading ${uploading}` : (uploadErr ?? status?.msg ?? "Changes to text are saved when you press Save.")}
        </p>
        <div className="flex gap-2">
          <a href={`/m/${page.slug}`} className="btn btn-ghost btn-sm">
            View page
          </a>
          <button type="button" className="btn btn-primary btn-sm" onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>

      <DangerZone pageId={page.id} petName={page.petName} />
    </div>
  );
}

function Text({ label, value, onChange, max, placeholder }: { label: string; value: string; onChange: (v: string) => void; max: number; placeholder?: string }) {
  const id = `m-${label.replace(/\W+/g, "-").toLowerCase()}`;
  return (
    <div>
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      <input id={id} className="input" value={value} maxLength={max} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}

function FileButton({ label, accept, multiple, onFiles, ghost }: { label: string; accept: string; multiple?: boolean; onFiles: (f: FileList) => void; ghost?: boolean }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <>
      <button type="button" className={`btn btn-sm ${ghost ? "btn-ghost" : "btn-primary"}`} onClick={() => ref.current?.click()}>
        {label}
      </button>
      <input
        ref={ref}
        type="file"
        accept={accept}
        multiple={multiple}
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => {
          if (e.target.files?.length) onFiles(e.target.files);
          e.target.value = "";
        }}
      />
    </>
  );
}

function Recorder({ onDone }: { onDone: (f: File) => void }) {
  const [rec, setRec] = useState<MediaRecorder | null>(null);
  const [secs, setSecs] = useState(0);
  const [err, setErr] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  async function start() {
    setErr(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : MediaRecorder.isTypeSupported("audio/mp4") ? "audio/mp4" : "";
      const r = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      const chunks: Blob[] = [];
      r.ondataavailable = (e) => e.data.size && chunks.push(e.data);
      r.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        if (timer.current) clearInterval(timer.current);
        const type = r.mimeType || "audio/webm";
        const ext = type.includes("mp4") ? "m4a" : "webm";
        onDone(new File(chunks, `voice-note.${ext}`, { type }));
        setRec(null);
        setSecs(0);
      };
      r.start();
      setRec(r);
      timer.current = setInterval(() => setSecs((s) => (s >= 179 ? (r.stop(), s) : s + 1)), 1000);
    } catch {
      setErr("Microphone not available");
    }
  }

  return (
    <div className="flex items-center gap-2">
      {rec ? (
        <button type="button" className="btn btn-clay btn-sm" onClick={() => rec.stop()}>
          <span className="h-2 w-2 animate-pulse rounded-full bg-white" aria-hidden /> Stop · {Math.floor(secs / 60)}:{String(secs % 60).padStart(2, "0")}
        </button>
      ) : (
        <button type="button" className="btn btn-primary btn-sm" onClick={start}>
          ● Record
        </button>
      )}
      {err && <span className="text-xs text-[#a3402c]">{err}</span>}
    </div>
  );
}

function DangerZone({ pageId, petName }: { pageId: string; petName: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <section className="rounded-[1.25rem] border border-[#e8cfc6] p-6">
      <h2 className="text-xl">Delete this memory page</h2>
      <p className="mt-1 text-sm text-ink-soft">Permanently deletes the page and every photo, video and recording on it. This can&apos;t be undone. Your order isn&apos;t affected.</p>
      {!open ? (
        <button type="button" className="btn btn-ghost btn-sm mt-4 !text-[#a3402c]" onClick={() => setOpen(true)}>
          Delete permanently…
        </button>
      ) : (
        <form
          className="mt-4 flex flex-col gap-2 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault();
            start(async () => {
              const r = await deleteMemoryPageAction(pageId, name);
              if (r.ok) {
                router.replace("/account");
                router.refresh();
              } else setMsg(r.error);
            });
          }}
        >
          <label className="sr-only" htmlFor="confirm-del">
            Type {petName} to confirm
          </label>
          <input id="confirm-del" className="input !py-2" placeholder={`Type "${petName}" to confirm`} value={name} onChange={(e) => setName(e.target.value)} />
          <button type="submit" className="btn btn-sm shrink-0 bg-[#a3402c] text-white" disabled={pending}>
            {pending ? "Deleting…" : "Delete forever"}
          </button>
        </form>
      )}
      {msg && <p className="mt-2 text-sm text-[#a3402c]">{msg}</p>}
    </section>
  );
}
