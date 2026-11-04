"use client";

import { useEffect, useState } from "react";
import { SoundAdder, SoundCard, type AnalysedSound } from "@/components/sound/Sound";
import { clearHandoff, loadHandoff, type HandoffSound } from "@/lib/sound-handoff";

export type WizardSound = { id: string; peaks: number[]; duration: number; title: string; src?: string };

async function uploadSound(s: { file: Blob; peaks: number[]; duration: number; name: string }): Promise<string> {
  const fd = new FormData();
  fd.append("kind", "PET_SOUND");
  const ext = s.file.type.includes("mp4") ? "m4a" : s.file.type.includes("ogg") ? "ogg" : s.file.type.includes("mpeg") ? "mp3" : s.file.type.includes("wav") ? "wav" : "webm";
  fd.append("file", s.file instanceof File ? s.file : new File([s.file], `sound.${ext}`, { type: s.file.type }));
  fd.append("waveform", JSON.stringify(s.peaks));
  fd.append("duration", String(s.duration));
  fd.append("caption", s.name.slice(0, 120));
  const res = await fetch("/api/uploads", { method: "POST", body: fd });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || !body.upload) throw new Error(body.error ?? "Upload failed. Please try again.");
  return body.upload.id as string;
}

export function SoundStep({ name, sounds, onChange }: { name: string; sounds: WizardSound[]; onChange: (fn: (prev: WizardSound[]) => WizardSound[]) => void }) {
  const [handoff, setHandoff] = useState<HandoffSound | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    loadHandoff().then((h) => setHandoff(h));
  }, []);

  async function add(s: AnalysedSound | HandoffSound) {
    setBusy(true);
    setErr(null);
    try {
      const title = sounds.length === 0 ? `${name}'s sound` : `${name}, recording ${sounds.length + 1}`;
      const id = await uploadSound({ file: s.file, peaks: s.peaks, duration: s.duration, name: title });
      const src = "url" in s ? s.url : URL.createObjectURL(s.file);
      onChange((prev) => [...prev, { id, peaks: s.peaks, duration: s.duration, title, src }]);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="overflow-hidden rounded-[1.5rem] bg-night p-6 text-ivory sm:p-7">
      <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-[#e7c3a5]">Their sound · optional, and the best part</p>
      <h2 className="mt-3 text-[1.7rem] leading-snug sm:text-3xl">Do you have a recording of {name}?</h2>
      <p className="mt-2 max-w-xl text-[0.95rem] leading-relaxed text-white/65">
        A bark, a purr, the sigh when they settle, or you calling their name. We engrave its waveform into the base, and the QR code beside it plays it back, for years. WhatsApp voice notes and phone voice memos work perfectly. You can also add this later.
      </p>

      <div className="mt-5 space-y-2.5">
        {sounds.map((s) => (
          <SoundCard
            key={s.id}
            src={s.src ?? `/api/files/${s.id}`}
            peaks={s.peaks}
            duration={s.duration}
            title={s.title}
            tone="dark"
            onRemove={() => {
              onChange((prev) => prev.filter((x) => x.id !== s.id));
              fetch(`/api/uploads?id=${s.id}`, { method: "DELETE" }).catch(() => {});
            }}
          />
        ))}
      </div>

      {handoff && sounds.length === 0 && (
        <div className="mt-4 flex flex-col gap-3 rounded-2xl bg-white/[0.06] p-4 ring-1 ring-white/10 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-white/80">Use the recording you just made on our homepage?</p>
          <div className="flex gap-2">
            <button
              type="button"
              className="btn btn-sm bg-ivory text-night hover:bg-white"
              disabled={busy}
              onClick={async () => {
                await add(handoff);
                setHandoff(null);
                clearHandoff();
              }}
            >
              {busy ? "Adding…" : "Use it"}
            </button>
            <button
              type="button"
              className="btn btn-sm text-ivory ring-1 ring-white/25"
              onClick={() => {
                setHandoff(null);
                clearHandoff();
              }}
            >
              No thanks
            </button>
          </div>
        </div>
      )}

      {sounds.length < 3 && (
        <div className="mt-5">
          <SoundAdder tone="dark" disabled={busy} onAdded={add} />
          {busy && <p className="mt-2 text-sm text-white/60">Saving their sound…</p>}
        </div>
      )}
      {err && (
        <p className="mt-2 text-sm text-[#f0b5a4]" role="alert">
          {err}
        </p>
      )}
      <p className="mt-4 text-xs text-white/40">The first recording is the one we engrave. Up to 3. Stored privately, like your photos.</p>
    </div>
  );
}
