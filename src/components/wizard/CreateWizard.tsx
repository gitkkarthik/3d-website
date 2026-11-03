"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { PhotoUploader, type UploadedPhoto } from "./PhotoUploader";
import { StoryCard } from "./StoryCard";
import type { WizardProduct, WizardSettings } from "./types";
import { AuthForm } from "@/components/auth/AuthForm";
import LazyKeepsake from "@/components/three/LazyKeepsake";
import { baseStyleFromLabel } from "@/components/three/baseStyle";
import type { FigureKey } from "@/components/three/Figurines";
import { formatINR } from "@/lib/money";
import { ANIMAL_TYPES, deliverySchema, fieldErrors, personaliseSchema, petSchema, storySchema } from "@/lib/validation";
import type { StoryAnswers } from "@/lib/db/schema";

const STORAGE_KEY = "pm-wizard-v1";
const STEPS = ["Meet your pet", "Their story", "Choose the edition", "Personalise", "Preview & order"] as const;

const RENDERS: Record<string, string> = {
  "personality-edition": "/renders/personality.webp",
  "forever-edition": "/renders/forever.webp",
  "together-edition": "/renders/together.webp",
  "forever-in-our-hearts-edition": "/renders/memorial.webp",
};

const BREEDS = [
  "Indie / Desi", "Labrador Retriever", "Golden Retriever", "German Shepherd", "Beagle", "Shih Tzu", "Pug", "Pomeranian",
  "Rottweiler", "Dachshund", "Cocker Spaniel", "Siberian Husky", "Lhasa Apso", "Doberman", "Great Dane", "Rajapalayam",
  "Mudhol Hound", "Indian Spitz", "Persian", "Indie cat", "Siamese", "Maine Coon", "British Shorthair", "Bengal", "Not sure",
];

type PetState = { petName: string; animalType: string; breed: string; petAge: string; photos: UploadedPhoto[] };
type PersonaliseState = {
  productSlug: string;
  variantId: string;
  poseOptionId: string;
  baseOptionId: string;
  poseNotes: string;
  engravedName: string;
  message: string;
  importantDate: string;
  importantDateLabel: string;
  ownerNotes: string;
  ownerPhotos: UploadedPhoto[];
  specialInstructions: string;
  wantsMemoryPage: boolean;
};
type DeliveryState = { shipName: string; shipPhone: string; shipLine1: string; shipLine2: string; shipCity: string; shipState: string; shipPincode: string; isGift: boolean; giftNote: string };
type State = { step: number; pet: PetState; story: StoryAnswers; personalise: PersonaliseState; delivery: DeliveryState; idempotencyKey: string };

function newKey() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}

function initialState(edition?: string, name?: string): State {
  return {
    step: 0,
    pet: { petName: name ?? "", animalType: "", breed: "", petAge: "", photos: [] },
    story: {},
    personalise: {
      productSlug: edition ?? "",
      variantId: "",
      poseOptionId: "",
      baseOptionId: "",
      poseNotes: "",
      engravedName: name ?? "",
      message: "",
      importantDate: "",
      importantDateLabel: "",
      ownerNotes: "",
      ownerPhotos: [],
      specialInstructions: "",
      wantsMemoryPage: true,
    },
    delivery: { shipName: "", shipPhone: "", shipLine1: "", shipLine2: "", shipCity: "", shipState: "", shipPincode: "", isGift: false, giftNote: "" },
    idempotencyKey: newKey(),
  };
}

const INDIAN_STATES = [
  "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chandigarh", "Chhattisgarh", "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand", "Karnataka", "Kerala", "Ladakh", "Lakshadweep", "Madhya Pradesh",
  "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Puducherry", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
  "Uttar Pradesh", "Uttarakhand", "West Bengal",
];

export function CreateWizard({
  products,
  settings,
  user,
  initialEdition,
  initialName,
}: {
  products: WizardProduct[];
  settings: WizardSettings;
  user: { name: string; phone: string | null } | null;
  initialEdition?: string;
  initialName?: string;
}) {
  const router = useRouter();
  const [s, setS] = useState<State>(() => initialState(initialEdition, initialName));
  const [loaded, setLoaded] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [signedIn, setSignedIn] = useState(!!user);
  const topRef = useRef<HTMLDivElement>(null);

  /* ── Persistence: restore once, then save on every change ── */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as State;
        setS((cur) => ({
          ...cur,
          ...saved,
          pet: { ...cur.pet, ...saved.pet, petName: saved.pet.petName || cur.pet.petName },
          personalise: {
            ...cur.personalise,
            ...saved.personalise,
            productSlug: initialEdition || saved.personalise.productSlug,
            engravedName: saved.personalise.engravedName || cur.personalise.engravedName,
          },
          delivery: { ...cur.delivery, ...saved.delivery },
        }));
      }
    } catch {}
    setLoaded(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (!loaded) return;
    try {
      const strip = (ps: UploadedPhoto[]) => ps.map(({ id }) => ({ id }));
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ ...s, pet: { ...s.pet, photos: strip(s.pet.photos) }, personalise: { ...s.personalise, ownerPhotos: strip(s.personalise.ownerPhotos) } }),
      );
    } catch {}
  }, [s, loaded]);

  const product = products.find((p) => p.slug === s.personalise.productSlug);
  const variant = product?.variants.find((v) => v.id === s.personalise.variantId);
  const pose = product?.poses.find((o) => o.id === s.personalise.poseOptionId);
  const base = product?.bases.find((o) => o.id === s.personalise.baseOptionId);

  const price = useMemo(() => {
    if (!variant) return null;
    const options = (pose?.priceDeltaPaise ?? 0) + (base?.priceDeltaPaise ?? 0);
    const subtotal = variant.pricePaise + options;
    const shipping = settings.freeShippingAbovePaise != null && subtotal >= settings.freeShippingAbovePaise ? 0 : settings.shippingFeePaise;
    return { unit: variant.pricePaise, options, shipping, total: subtotal + shipping };
  }, [variant, pose, base, settings]);

  const setPet = (patch: Partial<PetState>) => setS((x) => ({ ...x, pet: { ...x.pet, ...patch } }));
  const setStory = (patch: Partial<StoryAnswers>) => setS((x) => ({ ...x, story: { ...x.story, ...patch } }));
  const setPers = (patch: Partial<PersonaliseState>) => setS((x) => ({ ...x, personalise: { ...x.personalise, ...patch } }));
  const setDel = (patch: Partial<DeliveryState>) => setS((x) => ({ ...x, delivery: { ...x.delivery, ...patch } }));

  const name = s.pet.petName.trim() || "your pet";
  const cover = s.pet.photos[0] ? (s.pet.photos[0].preview ?? `/api/files/${s.pet.photos[0].id}?v=thumb`) : undefined;

  function go(step: number) {
    setErrors({});
    setS((x) => ({ ...x, step }));
    requestAnimationFrame(() => topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  function validate(step: number): boolean {
    let r: { success: boolean; error?: import("zod").ZodError } = { success: true };
    if (step === 0) r = petSchema.safeParse({ ...s.pet, petAge: s.pet.petAge || undefined, photoIds: s.pet.photos.map((p) => p.id) });
    if (step === 1) r = storySchema.safeParse(s.story);
    if (step === 2) {
      if (!product) {
        setErrors({ productSlug: "Choose the edition you'd like." });
        return false;
      }
      if (!variant) {
        setErrors({ variantId: "Choose a size." });
        return false;
      }
    }
    if (step === 3) {
      r = personaliseSchema.safeParse({ ...s.personalise, importantDate: s.personalise.importantDate === "none" ? "" : s.personalise.importantDate, ownerPhotoIds: s.personalise.ownerPhotos.map((p) => p.id), poseOptionId: s.personalise.poseOptionId || undefined, baseOptionId: s.personalise.baseOptionId || undefined });
      const extra: Record<string, string> = {};
      if (!s.personalise.poseOptionId) extra.poseOptionId = "Choose a pose.";
      if (!s.personalise.baseOptionId) extra.baseOptionId = "Choose a base.";
      if (product?.includesOwner && s.personalise.ownerPhotos.length === 0) extra.ownerPhotoIds = "Add at least one photo of you.";
      if (product?.isMemorial && !s.personalise.importantDate) extra.importantDate = "Add a date that matters, if you'd like it engraved, or skip by choosing 'No date'.";
      if (product?.isMemorial && s.personalise.importantDate === "none") delete extra.importantDate;
      const all = { ...(r.success ? {} : fieldErrors(r.error!)), ...extra };
      if (Object.keys(all).length) {
        setErrors(all);
        return false;
      }
      return true;
    }
    if (step === 4) r = deliverySchema.safeParse(s.delivery);
    if (!r.success) {
      setErrors(fieldErrors(r.error!));
      requestAnimationFrame(() => document.querySelector<HTMLElement>("[aria-invalid='true'], [data-error='true']")?.focus());
      return false;
    }
    return true;
  }

  function next() {
    if (validate(s.step)) go(Math.min(s.step + 1, STEPS.length - 1));
  }

  async function submit() {
    if (submitting) return;
    for (let i = 0; i < 4; i++) {
      if (!validate(i)) {
        go(i);
        setTimeout(() => validate(i), 50);
        return;
      }
    }
    if (!validate(4)) return;
    setSubmitting(true);
    setSubmitError(null);
    const p = s.personalise;
    const payload = {
      idempotencyKey: s.idempotencyKey,
      pet: { petName: s.pet.petName, animalType: s.pet.animalType, breed: s.pet.breed, petAge: s.pet.petAge || undefined, photoIds: s.pet.photos.map((x) => x.id) },
      story: s.story,
      personalise: {
        productSlug: p.productSlug,
        variantId: p.variantId,
        poseOptionId: p.poseOptionId || undefined,
        baseOptionId: p.baseOptionId || undefined,
        poseNotes: p.poseNotes,
        engravedName: p.engravedName,
        message: p.message,
        importantDate: p.importantDate === "none" ? "" : p.importantDate,
        importantDateLabel: p.importantDateLabel,
        ownerNotes: p.ownerNotes,
        ownerPhotoIds: p.ownerPhotos.map((x) => x.id),
        specialInstructions: p.specialInstructions,
        wantsMemoryPage: p.wantsMemoryPage,
      },
      delivery: s.delivery,
    };
    try {
      const res = await fetch("/api/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const body = await res.json().catch(() => ({}));
      if (res.status === 401) {
        setSignedIn(false);
        setSubmitError("Please sign in or create an account to place your order.");
        return;
      }
      if (!res.ok) {
        setSubmitError(body.error ?? "We couldn't place your order. Please try again.");
        if (body.fields) setErrors(body.fields);
        return;
      }
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {}
      router.push(`/account/orders/${body.order.id}?placed=1`);
    } catch {
      setSubmitError("Network hiccup. Your order wasn't placed yet. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const memorial = product?.isMemorial;

  return (
    <div ref={topRef} className="mx-auto max-w-7xl scroll-mt-16 px-4 pb-28 pt-4 sm:px-6 lg:px-8">
      {/* Progress */}
      <nav aria-label="Progress" className="sticky top-16 z-20 -mx-4 bg-ivory/95 px-4 py-3 backdrop-blur sm:mx-0 sm:px-0">
        <ol className="flex items-center gap-1.5">
          {STEPS.map((label, i) => {
            const done = i < s.step;
            const current = i === s.step;
            return (
              <li key={label} className="flex-1">
                <button
                  type="button"
                  onClick={() => (i < s.step ? go(i) : undefined)}
                  disabled={i > s.step}
                  aria-current={current ? "step" : undefined}
                  className="group block w-full text-left disabled:cursor-default"
                >
                  <span className={`block h-1 rounded-full transition-colors duration-500 ${done || current ? "bg-clay" : "bg-oat"}`} />
                  <span className={`mt-2 hidden text-xs sm:block ${current ? "font-semibold text-ink" : done ? "text-ink-soft group-hover:text-ink" : "text-ink-mute"}`}>
                    {i + 1}. {label}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
        <p className="mt-2 text-xs font-medium text-ink-soft sm:hidden">
          Step {s.step + 1} of {STEPS.length} · {STEPS[s.step]}
        </p>
      </nav>

      <div className="mt-6 grid gap-10 lg:grid-cols-[1.25fr_0.85fr] lg:gap-14">
        <div key={s.step} className="animate-rise min-w-0">
          {/* ───────── Step 1 ───────── */}
          {s.step === 0 && (
            <section aria-labelledby="s1">
              <p className="eyebrow">Step one</p>
              <h1 id="s1" className="mt-3 text-4xl leading-tight sm:text-5xl">
                Let&apos;s meet <em className="italic-soft text-clay">{s.pet.petName.trim() || "your pet"}</em>.
              </h1>
              <p className="mt-3 max-w-xl text-ink-soft">The basics first, and a few good photos. This is what our artist will sculpt from.</p>

              <div className="mt-8 grid gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label htmlFor="petName" className="field-label">
                    Their name
                  </label>
                  <input id="petName" className="input !text-lg" value={s.pet.petName} maxLength={40} onChange={(e) => setPet({ petName: e.target.value })} aria-invalid={!!errors.petName} placeholder="e.g. Bruno" autoComplete="off" />
                  <Err msg={errors.petName} />
                </div>
                <div className="sm:col-span-2">
                  <span className="field-label" id="animal-label">
                    They&apos;re a…
                  </span>
                  <div className="flex flex-wrap gap-2" role="radiogroup" aria-labelledby="animal-label" data-error={!!errors.animalType}>
                    {ANIMAL_TYPES.map((a) => (
                      <button
                        key={a}
                        type="button"
                        role="radio"
                        aria-checked={s.pet.animalType === a}
                        onClick={() => setPet({ animalType: a })}
                        className={`rounded-full px-5 py-2.5 text-sm font-medium transition-colors ${s.pet.animalType === a ? "bg-ink text-ivory" : "bg-paper text-ink shadow-[0_0_0_1px_var(--color-oat)] hover:shadow-[0_0_0_1px_var(--color-ink-mute)]"}`}
                      >
                        {a}
                      </button>
                    ))}
                  </div>
                  <Err msg={errors.animalType} />
                </div>
                <div>
                  <label htmlFor="breed" className="field-label">
                    Breed
                  </label>
                  <input id="breed" list="breeds" className="input" value={s.pet.breed} maxLength={60} onChange={(e) => setPet({ breed: e.target.value })} aria-invalid={!!errors.breed} placeholder="Indie, Labrador, Persian…" />
                  <datalist id="breeds">
                    {BREEDS.map((b) => (
                      <option key={b} value={b} />
                    ))}
                  </datalist>
                  <Err msg={errors.breed} />
                </div>
                <div>
                  <label htmlFor="petAge" className="field-label">
                    Age <span className="font-normal text-ink-mute">· optional</span>
                  </label>
                  <input id="petAge" className="input" value={s.pet.petAge} maxLength={30} onChange={(e) => setPet({ petAge: e.target.value })} placeholder="e.g. 4 years, or 2011 – 2024" />
                </div>
              </div>

              <div className="mt-10">
                <PhotoUploader
                  value={s.pet.photos}
                  onChange={(next) => setS((x) => ({ ...x, pet: { ...x.pet, photos: typeof next === "function" ? next(x.pet.photos) : next } }))}
                  min={3}
                  max={5}
                  label={`Photos of ${name}`}
                  hint="3 to 5 clear photos. Include the face straight on, a side view, and their full body."
                  error={errors.photoIds}
                />
                <div className="mt-5 grid gap-3 rounded-2xl bg-sand/60 p-5 text-sm text-ink-soft sm:grid-cols-3">
                  <Tip title="Good light">Daylight near a window is perfect. Avoid flash.</Tip>
                  <Tip title="Their level">Crouch down so the camera is at their eye height.</Tip>
                  <Tip title="Markings">Add a close-up of any special patch, spot or scar.</Tip>
                </div>
                <p className="mt-3 text-xs text-ink-mute">
                  Your photos are stored privately. Only you and our studio can see them. We never use them for marketing without asking.
                </p>
              </div>
            </section>
          )}

          {/* ───────── Step 2 ───────── */}
          {s.step === 1 && (
            <section aria-labelledby="s2">
              <p className="eyebrow">Step two</p>
              <h1 id="s2" className="mt-3 text-4xl leading-tight sm:text-5xl">
                Tell us <em className="italic-soft text-clay">their</em> story.
              </h1>
              <p className="mt-3 max-w-xl text-ink-soft">
                Every answer is optional, and every answer helps. These are the details that make a figurine feel like {name}, not just a {s.pet.breed.trim() || "pet"}.
              </p>
              <div className="mt-8 space-y-4">
                <StoryQ id="smile" q={`What's one thing ${name} does that always makes you smile?`} placeholder="She sneezes every time she's excited to see us…" value={s.story.smile} onChange={(v) => setStory({ smile: v })} rows={3} max={600} error={errors.smile} />
                <StoryQ id="toy" q="What's their favourite toy?" placeholder="A one-eared green crocodile called Mr Croc" value={s.story.toy} onChange={(v) => setStory({ toy: v })} max={200} single error={errors.toy} />
                <StoryQ id="sleeping" q="What's their favourite sleeping position?" placeholder="On his back, all four paws in the air, on my pillow" value={s.story.sleeping} onChange={(v) => setStory({ sleeping: v })} max={300} single error={errors.sleeping} />
                <StoryQ id="personality" q="What makes their personality unique?" placeholder="Dramatic. Talks back when told no. Secretly scared of the pressure cooker." value={s.story.personality} onChange={(v) => setStory({ personality: v })} rows={3} max={800} error={errors.personality} />
                <StoryQ id="nickname" q="What do you affectionately call them?" placeholder="Laddoo, Chotu, Mr Fluff, Baby…" value={s.story.nickname} onChange={(v) => setStory({ nickname: v })} max={120} single error={errors.nickname} />
                <StoryQ id="freezeMoment" q={`If you could freeze one moment with ${name} forever, what would it be?`} placeholder="Sunday mornings, when he climbs onto the bed and sighs like he owns the place." value={s.story.freezeMoment} onChange={(v) => setStory({ freezeMoment: v })} rows={4} max={800} featured error={errors.freezeMoment} />
              </div>
              <div className="mt-8 lg:hidden">
                <p className="mb-3 text-sm font-medium text-ink-soft">Their story so far</p>
                <StoryCard name={s.pet.petName} animal={s.pet.animalType} breed={s.pet.breed} age={s.pet.petAge} cover={cover} story={s.story} compact />
              </div>
            </section>
          )}

          {/* ───────── Step 3 ───────── */}
          {s.step === 2 && (
            <section aria-labelledby="s3">
              <p className="eyebrow">Step three</p>
              <h1 id="s3" className="mt-3 text-4xl leading-tight sm:text-5xl">
                How would you like to <em className="italic-soft text-clay">keep {s.pet.petName.trim() || "them"}</em>?
              </h1>
              <div className="mt-8 grid gap-4 sm:grid-cols-2" role="radiogroup" aria-label="Edition" data-error={!!errors.productSlug}>
                {products.map((p) => {
                  const sel = p.slug === s.personalise.productSlug;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      role="radio"
                      aria-checked={sel}
                      onClick={() => setPers({ productSlug: p.slug, variantId: p.variants.length === 1 ? p.variants[0].id : "", poseOptionId: "", baseOptionId: "" })}
                      className={`flex flex-col overflow-hidden rounded-[1.25rem] text-left transition-shadow duration-300 ${sel ? "bg-paper shadow-[0_0_0_2px_var(--color-ink)]" : "bg-paper shadow-[0_0_0_1px_var(--color-line)] hover:shadow-[0_0_0_1px_var(--color-ink-mute)]"}`}
                    >
                      <div className={`relative h-40 ${p.isMemorial ? "bg-[#ece7df]" : "bg-sand"}`}>
                        <Image src={RENDERS[p.slug] ?? "/renders/forever.webp"} alt="" fill sizes="(min-width:640px) 30vw, 90vw" className="object-contain p-3" />
                        <span className={`absolute right-3 top-3 grid h-6 w-6 place-items-center rounded-full border-[1.5px] ${sel ? "border-ink bg-ink text-ivory" : "border-ink-mute bg-paper"}`} aria-hidden>
                          {sel && "✓"}
                        </span>
                      </div>
                      <div className="flex flex-1 flex-col p-5">
                        <p className="font-display text-xl">{p.name}</p>
                        <p className="mt-1 text-sm text-ink-soft">{p.tagline}</p>
                        <ul className="mt-3 space-y-1 text-[0.82rem] text-ink-soft">
                          {p.includes.slice(0, 4).map((i) => (
                            <li key={i}>· {i}</li>
                          ))}
                        </ul>
                        <p className="mt-auto pt-4 font-display text-lg">
                          {formatINR(p.fromPaise)}
                          {p.toPaise !== p.fromPaise && <span className="text-ink-mute"> – {formatINR(p.toPaise)}</span>}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
              <Err msg={errors.productSlug} />

              {product && (
                <div className="mt-10 animate-rise">
                  <p className="field-label" id="size-label">
                    Size
                  </p>
                  <div className="grid gap-3" role="radiogroup" aria-labelledby="size-label" data-error={!!errors.variantId}>
                    {product.variants.map((v) => (
                      <RadioCard key={v.id} selected={v.id === s.personalise.variantId} onClick={() => setPers({ variantId: v.id })} title={v.name} body={v.description} right={formatINR(v.pricePaise)} />
                    ))}
                  </div>
                  <Err msg={errors.variantId} />
                  {memorial && (
                    <p className="mt-6 rounded-2xl bg-sand/70 p-5 text-sm leading-relaxed text-ink-soft">
                      We&apos;re so sorry for your loss. You&apos;ll work with one artist throughout, with unlimited gentle revisions, and there&apos;s never any rush to approve.
                    </p>
                  )}
                </div>
              )}
            </section>
          )}

          {/* ───────── Step 4 ───────── */}
          {s.step === 3 && product && (
            <section aria-labelledby="s4">
              <p className="eyebrow">Step four</p>
              <h1 id="s4" className="mt-3 text-4xl leading-tight sm:text-5xl">
                Make it <em className="italic-soft text-clay">theirs</em>.
              </h1>

              <fieldset className="mt-8">
                <legend className="field-label">{product.includesOwner ? "Your moment together" : "Pose"}</legend>
                <div className="grid gap-3 sm:grid-cols-2" data-error={!!errors.poseOptionId}>
                  {product.poses.map((o) => (
                    <RadioCard key={o.id} selected={o.id === s.personalise.poseOptionId} onClick={() => setPers({ poseOptionId: o.id })} title={o.label} body={o.description} right={o.priceDeltaPaise ? `+${formatINR(o.priceDeltaPaise)}` : undefined} />
                  ))}
                </div>
                <Err msg={errors.poseOptionId} />
                <label htmlFor="poseNotes" className="field-label mt-4">
                  Anything about the pose? <span className="font-normal text-ink-mute">· optional</span>
                </label>
                <textarea id="poseNotes" className="input" rows={2} maxLength={400} value={s.personalise.poseNotes} onChange={(e) => setPers({ poseNotes: e.target.value })} placeholder={`e.g. Head tilted to the left, the way ${name} listens`} />
              </fieldset>

              {product.includesOwner && (
                <fieldset className="mt-10">
                  <legend className="field-label">You, in the figurine</legend>
                  <PhotoUploader
                    id="owner-photos"
                    value={s.personalise.ownerPhotos}
                    onChange={(next) => setS((x) => ({ ...x, personalise: { ...x.personalise, ownerPhotos: typeof next === "function" ? next(x.personalise.ownerPhotos) : next } }))}
                    min={1}
                    max={3}
                    label="Photos of you (or the people to include)"
                    hint="A clear face photo and a full-length photo help most."
                    error={errors.ownerPhotoIds}
                  />
                  <label htmlFor="ownerNotes" className="field-label mt-4">
                    Describe yourselves <span className="font-normal text-ink-mute">· optional</span>
                  </label>
                  <textarea id="ownerNotes" className="input" rows={2} maxLength={600} value={s.personalise.ownerNotes} onChange={(e) => setPers({ ownerNotes: e.target.value })} placeholder="Hair, glasses, a favourite outfit, how you hold them…" />
                </fieldset>
              )}

              <fieldset className="mt-10">
                <legend className="field-label">Base</legend>
                <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
                  <div className="grid content-start gap-3" data-error={!!errors.baseOptionId}>
                    {product.bases.map((o) => (
                      <RadioCard
                        key={o.id}
                        selected={o.id === s.personalise.baseOptionId}
                        onClick={() => setPers({ baseOptionId: o.id })}
                        title={o.label}
                        body={o.description}
                        right={o.priceDeltaPaise ? `+${formatINR(o.priceDeltaPaise)}` : undefined}
                        swatch={baseStyleFromLabel(o.label)}
                      />
                    ))}
                    <Err msg={errors.baseOptionId} />
                  </div>
                  <div>
                    <div className={`relative aspect-square overflow-hidden rounded-[1.25rem] ${memorial ? "bg-[#ece7df]" : "bg-sand"}`}>
                      <LazyKeepsake
                        figure={(product.renderKey as FigureKey) ?? "dog-sitting"}
                        coat={s.pet.animalType === "Cat" ? "tabby" : memorial ? "golden" : "fawn"}
                        base={baseStyleFromLabel(base?.label ?? product.bases[0]?.label)}
                        engraving={s.personalise.engravedName || s.pet.petName || "Name"}
                        line2={s.personalise.importantDate && s.personalise.importantDate !== "none" ? formatDateShort(s.personalise.importantDate) : ""}
                        framing="wizard"
                      />
                      <span className="render-tag absolute left-3 top-3">Style sketch</span>
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-ink-mute">
                      A sketch of the base and engraving only. This figure is a placeholder, not {name}. Our artist sculpts {name} from your photos and sends you the real design to approve.
                    </p>
                  </div>
                </div>
              </fieldset>

              <div className="mt-10 grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="engravedName" className="field-label">
                    Name to engrave
                  </label>
                  <input id="engravedName" className="input" maxLength={24} value={s.personalise.engravedName} onChange={(e) => setPers({ engravedName: e.target.value })} aria-invalid={!!errors.engravedName} placeholder={s.pet.petName} />
                  <p className="field-hint mt-1">{24 - s.personalise.engravedName.length} characters left</p>
                  <Err msg={errors.engravedName} />
                </div>
                <div>
                  <label htmlFor="importantDate" className="field-label">
                    {memorial ? "A date that matters" : "Important date"} <span className="font-normal text-ink-mute">· optional</span>
                  </label>
                  <input id="importantDate" type="date" className="input" value={s.personalise.importantDate === "none" ? "" : s.personalise.importantDate} onChange={(e) => setPers({ importantDate: e.target.value })} aria-invalid={!!errors.importantDate} />
                  {memorial && (
                    <label className="mt-2 flex items-center gap-2 text-sm text-ink-soft">
                      <input type="checkbox" checked={s.personalise.importantDate === "none"} onChange={(e) => setPers({ importantDate: e.target.checked ? "none" : "" })} /> No date, thank you
                    </label>
                  )}
                  <Err msg={errors.importantDate} />
                </div>
                {s.personalise.importantDate && s.personalise.importantDate !== "none" && (
                  <div className="sm:col-span-2">
                    <label htmlFor="importantDateLabel" className="field-label">
                      What is this date? <span className="font-normal text-ink-mute">· optional</span>
                    </label>
                    <input id="importantDateLabel" className="input" maxLength={40} value={s.personalise.importantDateLabel} onChange={(e) => setPers({ importantDateLabel: e.target.value })} placeholder={memorial ? "e.g. Forever in our hearts since" : "e.g. Gotcha day, birthday"} />
                  </div>
                )}
                {product.slug !== "personality-edition" && (
                  <div className="sm:col-span-2">
                    <label htmlFor="message" className="field-label">
                      Personal message <span className="font-normal text-ink-mute">· optional</span>
                    </label>
                    <input id="message" className="input" maxLength={140} value={s.personalise.message} onChange={(e) => setPers({ message: e.target.value })} aria-invalid={!!errors.message} placeholder={memorial ? "Run free, sweet boy" : "Best boy, always"} />
                    <p className="field-hint mt-1">Short messages engrave best. {140 - s.personalise.message.length} characters left.</p>
                  </div>
                )}
                <div className="sm:col-span-2">
                  <label htmlFor="special" className="field-label">
                    Special instructions for our artist <span className="font-normal text-ink-mute">· optional</span>
                  </label>
                  <textarea id="special" className="input" rows={3} maxLength={1000} value={s.personalise.specialInstructions} onChange={(e) => setPers({ specialInstructions: e.target.value })} placeholder="e.g. Her left ear flops, the right one stands up. Please include her red collar." />
                </div>
                {product.includesMemoryPage && (
                  <label className="flex cursor-pointer items-start gap-3 rounded-2xl bg-sage-soft/60 p-5 sm:col-span-2">
                    <input type="checkbox" className="mt-1 h-4 w-4 accent-[var(--color-sage)]" checked={s.personalise.wantsMemoryPage} onChange={(e) => setPers({ wantsMemoryPage: e.target.checked })} />
                    <span>
                      <span className="block font-medium">Create {name}&apos;s private memory page</span>
                      <span className="mt-1 block text-sm text-ink-soft">Included with this edition. Add photos, videos and voice notes any time. Private unless you choose to share it.</span>
                    </span>
                  </label>
                )}
              </div>
            </section>
          )}

          {/* ───────── Step 5 ───────── */}
          {s.step === 4 && product && variant && price && (
            <section aria-labelledby="s5">
              <p className="eyebrow">Last step</p>
              <h1 id="s5" className="mt-3 text-4xl leading-tight sm:text-5xl">
                Everything we know about <em className="italic-soft text-clay">{name}</em>.
              </h1>
              <p className="mt-3 max-w-xl text-ink-soft">Check it over. You can edit any section.</p>

              <div className="mt-8 space-y-4">
                <Summary title={`${s.pet.petName} · ${[s.pet.breed, s.pet.animalType].filter(Boolean).join(", ")}${s.pet.petAge ? ` · ${s.pet.petAge}` : ""}`} onEdit={() => go(0)}>
                  <div className="grid grid-cols-5 gap-2">
                    {s.pet.photos.map((p) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img key={p.id} src={p.preview ?? `/api/files/${p.id}?v=thumb`} alt="" className="aspect-square w-full rounded-lg object-cover" />
                    ))}
                  </div>
                </Summary>
                <Summary title="Their story" onEdit={() => go(1)}>
                  {Object.values(s.story).some((v) => v?.trim()) ? (
                    <ul className="space-y-1.5 font-display text-[0.98rem] italic text-ink-soft">
                      {Object.entries(s.story)
                        .filter(([, v]) => v?.trim())
                        .map(([k, v]) => (
                          <li key={k}>&ldquo;{v}&rdquo;</li>
                        ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-ink-mute">No story added. That&apos;s okay, but even one line helps our artist.</p>
                  )}
                </Summary>
                <Summary title={`${product.name} · ${variant.name}`} onEdit={() => go(2)}>
                  <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                    <Row k="Pose" v={pose?.label} />
                    <Row k="Base" v={base?.label} />
                    <Row k="Engraving" v={s.personalise.engravedName} />
                    {s.personalise.importantDate && s.personalise.importantDate !== "none" && <Row k={s.personalise.importantDateLabel || "Date"} v={formatDateShort(s.personalise.importantDate)} />}
                    {s.personalise.message && <Row k="Message" v={s.personalise.message} />}
                    {product.includesMemoryPage && <Row k="Memory page" v={s.personalise.wantsMemoryPage ? "Yes, please" : "Not now"} />}
                    {product.includesOwner && <Row k="Photos of you" v={`${s.personalise.ownerPhotos.length}`} />}
                  </dl>
                  {s.personalise.specialInstructions && <p className="mt-3 text-sm text-ink-soft">Note: {s.personalise.specialInstructions}</p>}
                  <button type="button" onClick={() => go(3)} className="mt-3 text-sm font-medium underline underline-offset-4">
                    Edit personalisation
                  </button>
                </Summary>
              </div>

              <div className="mt-10">
                <h2 className="text-2xl">Delivery</h2>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <TextField id="shipName" label="Recipient's name" value={s.delivery.shipName} onChange={(v) => setDel({ shipName: v })} error={errors.shipName} autoComplete="name" />
                  <TextField id="shipPhone" label="Mobile number" value={s.delivery.shipPhone} onChange={(v) => setDel({ shipPhone: v })} error={errors.shipPhone} type="tel" autoComplete="tel" inputMode="tel" placeholder="98765 43210" />
                  <TextField id="shipLine1" label="Flat / house, street" value={s.delivery.shipLine1} onChange={(v) => setDel({ shipLine1: v })} error={errors.shipLine1} autoComplete="address-line1" className="sm:col-span-2" />
                  <TextField id="shipLine2" label="Area, landmark (optional)" value={s.delivery.shipLine2} onChange={(v) => setDel({ shipLine2: v })} autoComplete="address-line2" className="sm:col-span-2" />
                  <TextField id="shipCity" label="City" value={s.delivery.shipCity} onChange={(v) => setDel({ shipCity: v })} error={errors.shipCity} autoComplete="address-level2" />
                  <div>
                    <label htmlFor="shipState" className="field-label">
                      State
                    </label>
                    <select id="shipState" className="input" value={s.delivery.shipState} onChange={(e) => setDel({ shipState: e.target.value })} aria-invalid={!!errors.shipState} autoComplete="address-level1">
                      <option value="">Choose…</option>
                      {INDIAN_STATES.map((st) => (
                        <option key={st}>{st}</option>
                      ))}
                    </select>
                    <Err msg={errors.shipState} />
                  </div>
                  <TextField id="shipPincode" label="PIN code" value={s.delivery.shipPincode} onChange={(v) => setDel({ shipPincode: v.replace(/\D/g, "").slice(0, 6) })} error={errors.shipPincode} inputMode="numeric" autoComplete="postal-code" />
                  <label className="flex items-center gap-3 self-end pb-3 text-sm">
                    <input type="checkbox" className="h-4 w-4 accent-[var(--color-clay)]" checked={s.delivery.isGift} onChange={(e) => setDel({ isGift: e.target.checked })} />
                    This is a gift (no prices in the box)
                  </label>
                  {s.delivery.isGift && (
                    <div className="sm:col-span-2">
                      <label htmlFor="giftNote" className="field-label">
                        Gift card message <span className="font-normal text-ink-mute">· optional</span>
                      </label>
                      <textarea id="giftNote" className="input" rows={2} maxLength={300} value={s.delivery.giftNote} onChange={(e) => setDel({ giftNote: e.target.value })} />
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-10 rounded-[1.25rem] bg-night p-6 text-ivory sm:p-7">
                <p className="font-display text-xl">What happens next</p>
                <p className="mt-2 leading-relaxed text-[#d8cdc1]">
                  Our artists will prepare your personalised design and send you a preview for approval before production. Nothing is printed until you approve it. If it isn&apos;t quite {name}, we&apos;ll revise it.
                </p>
              </div>

              {!signedIn && (
                <div className="mt-10">
                  <h2 className="text-2xl">Your account</h2>
                  <p className="mb-5 mt-1 text-sm text-ink-soft">So you can see {name}&apos;s design preview, approve it, and follow your order.</p>
                  <AuthForm defaults={{ name: s.delivery.shipName, phone: s.delivery.shipPhone }} onSuccess={() => { setSignedIn(true); setSubmitError(null); router.refresh(); }} />
                </div>
              )}
            </section>
          )}

          {/* Navigation */}
          <div className="mt-12 flex flex-col-reverse gap-3 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
            {s.step > 0 ? (
              <button type="button" onClick={() => go(s.step - 1)} className="btn btn-ghost">
                ← Back
              </button>
            ) : (
              <span />
            )}
            {s.step < 4 ? (
              <button type="button" onClick={next} className="btn btn-primary sm:min-w-56">
                {s.step === 1 && !Object.values(s.story).some((v) => v?.trim()) ? "Skip for now" : "Continue"} →
              </button>
            ) : (
              <div className="flex flex-col items-stretch gap-2 sm:items-end">
                {submitError && (
                  <p className="text-sm text-[#a3402c]" role="alert">
                    {submitError}
                  </p>
                )}
                <button type="button" onClick={submit} disabled={submitting || !signedIn} className="btn btn-clay h-13 text-base sm:min-w-64">
                  {submitting ? "Placing your order…" : price ? `Place order · ${formatINR(price.total)}` : "Place order"}
                </button>
                <p className="text-xs text-ink-mute">{signedIn ? "You'll pay on the next screen." : "Create an account above to continue."}</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <aside className="hidden lg:block">
          <div className="sticky top-36 space-y-5">
            <StoryCard name={s.pet.petName} animal={s.pet.animalType} breed={s.pet.breed} age={s.pet.petAge} cover={cover} story={s.story} />
            {product && (
              <div className="rounded-[1.25rem] bg-paper p-5 shadow-[0_0_0_1px_var(--color-line)]">
                <p className="text-sm text-ink-mute">Your keepsake</p>
                <p className="mt-1 font-display text-lg">{product.name}</p>
                {variant && <p className="text-sm text-ink-soft">{variant.name}</p>}
                {price && (
                  <dl className="mt-4 space-y-1.5 border-t border-line pt-4 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-ink-soft">Keepsake</dt>
                      <dd>{formatINR(price.unit)}</dd>
                    </div>
                    {price.options > 0 && (
                      <div className="flex justify-between">
                        <dt className="text-ink-soft">Options</dt>
                        <dd>{formatINR(price.options)}</dd>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <dt className="text-ink-soft">Delivery</dt>
                      <dd>{price.shipping ? formatINR(price.shipping) : "Free"}</dd>
                    </div>
                    <div className="flex justify-between border-t border-line pt-2 font-medium">
                      <dt>Total</dt>
                      <dd className="font-display text-lg">{formatINR(price.total)}</dd>
                    </div>
                  </dl>
                )}
                <p className="mt-4 text-xs text-ink-mute">
                  Delivered about {product.leadTimeMinDays}–{product.leadTimeMaxDays} days after you approve your design.
                </p>
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* Mobile price bar */}
      {price && s.step >= 2 && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-ivory/95 px-4 py-3 backdrop-blur lg:hidden">
          <div className="flex items-center justify-between text-sm">
            <span className="text-ink-soft">
              {product?.name}
              <span className="block text-xs text-ink-mute">{variant?.name}</span>
            </span>
            <span className="font-display text-xl">{formatINR(price.total)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function formatDateShort(iso: string) {
  const d = new Date(iso + "T00:00:00");
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function Err({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <p className="mt-1.5 text-sm text-[#a3402c]" role="alert">
      {msg}
    </p>
  );
}

function Tip({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="font-medium text-ink">{title}</p>
      <p className="mt-0.5">{children}</p>
    </div>
  );
}

function StoryQ({ id, q, placeholder, value, onChange, rows = 2, max, single, featured, error }: { id: string; q: string; placeholder: string; value?: string; onChange: (v: string) => void; rows?: number; max: number; single?: boolean; featured?: boolean; error?: string }) {
  const v = value ?? "";
  return (
    <div className={`rounded-[1.25rem] p-5 sm:p-6 ${featured ? "bg-sand/80" : "bg-paper shadow-[0_0_0_1px_var(--color-line)]"}`}>
      <label htmlFor={id} className="block font-display text-[1.2rem] leading-snug text-ink sm:text-[1.35rem]">
        {q}
      </label>
      <span className="mt-1 block text-xs text-ink-mute">Optional</span>
      {single ? (
        <input id={id} className="input mt-3" value={v} maxLength={max} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-invalid={!!error} />
      ) : (
        <textarea id={id} className="input mt-3" rows={rows} value={v} maxLength={max} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-invalid={!!error} />
      )}
      {v.length > max * 0.8 && <p className="field-hint mt-1 text-right">{max - v.length} left</p>}
      <Err msg={error} />
    </div>
  );
}

function RadioCard({ selected, onClick, title, body, right, swatch }: { selected: boolean; onClick: () => void; title: string; body?: string; right?: string; swatch?: string }) {
  const sw: Record<string, string> = { oak: "#c9a77c", walnut: "#6e4a33", ivory: "#efe7da", slate: "#3b3836" };
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onClick}
      className={`flex w-full items-start gap-4 rounded-2xl bg-paper p-4 text-left transition-shadow duration-200 sm:p-5 ${selected ? "shadow-[0_0_0_2px_var(--color-ink)]" : "shadow-[0_0_0_1px_var(--color-line)] hover:shadow-[0_0_0_1px_var(--color-ink-mute)]"}`}
    >
      {swatch ? (
        <span className="mt-0.5 h-8 w-8 shrink-0 rounded-lg shadow-[inset_0_0_0_1px_rgb(0_0_0/0.08)]" style={{ background: sw[swatch] }} aria-hidden />
      ) : (
        <span className={`mt-1 grid h-5 w-5 shrink-0 place-items-center rounded-full border-[1.5px] ${selected ? "border-ink" : "border-ink-mute"}`} aria-hidden>
          {selected && <span className="h-2.5 w-2.5 rounded-full bg-ink" />}
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block font-medium">{title}</span>
        {body && <span className="mt-0.5 block text-sm text-ink-soft">{body}</span>}
      </span>
      {right && <span className="font-display text-lg">{right}</span>}
    </button>
  );
}

function Summary({ title, onEdit, children }: { title: string; onEdit: () => void; children: React.ReactNode }) {
  return (
    <div className="rounded-[1.25rem] bg-paper p-5 shadow-[0_0_0_1px_var(--color-line)] sm:p-6">
      <div className="mb-4 flex items-start justify-between gap-4">
        <p className="font-display text-lg leading-snug">{title}</p>
        <button type="button" onClick={onEdit} className="shrink-0 text-sm font-medium underline underline-offset-4">
          Edit
        </button>
      </div>
      {children}
    </div>
  );
}

function Row({ k, v }: { k: string; v?: string }) {
  return (
    <div className="flex justify-between gap-4 sm:block">
      <dt className="text-ink-mute">{k}</dt>
      <dd className="text-right sm:text-left">{v || "–"}</dd>
    </div>
  );
}

function TextField({ id, label, value, onChange, error, className = "", ...rest }: { id: string; label: string; value: string; onChange: (v: string) => void; error?: string; className?: string } & Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value">) {
  return (
    <div className={className}>
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      <input id={id} className="input" value={value} onChange={(e) => onChange(e.target.value)} aria-invalid={!!error} {...rest} />
      <Err msg={error} />
    </div>
  );
}
