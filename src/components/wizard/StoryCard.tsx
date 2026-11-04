"use client";

import type { StoryAnswers } from "@/lib/db/schema";
import { Waveform } from "@/components/sound/Waveform";

/**
 * The customer's own words, typeset like a keepsake card as they write.
 * This is the emotional centre of the wizard: seeing their pet's story take shape.
 */
export function StoryCard({
  name,
  animal,
  breed,
  age,
  cover,
  story,
  compact = false,
  peaks,
}: {
  name: string;
  animal: string;
  breed: string;
  age?: string;
  cover?: string;
  story: StoryAnswers;
  compact?: boolean;
  peaks?: number[];
}) {
  const display = name.trim() || "Your pet";
  const lines: { label: string; text?: string }[] = [
    { label: "Always makes us smile", text: story.smile },
    { label: "Favourite toy", text: story.toy },
    { label: "Sleeps like", text: story.sleeping },
    { label: "What makes them, them", text: story.personality },
    { label: "The moment we'd freeze forever", text: story.freezeMoment },
  ].filter((l) => l.text?.trim());

  return (
    <div className="relative">
      <div className={`paper-grain relative rounded-[1.5rem] bg-paper shadow-[0_0_0_1px_var(--color-line),0_30px_60px_-34px_rgb(70_45_25/0.5)] ${compact ? "p-5" : "p-6 sm:p-7"}`}>
        <div className="flex items-start gap-4">
          <div className="relative -rotate-3 shrink-0 rounded-md bg-white p-1.5 pb-5 shadow-[0_6px_16px_-8px_rgb(60_40_20/0.5)]">
            <div className={`${compact ? "h-16 w-16" : "h-20 w-20"} overflow-hidden rounded-[3px] bg-sand`}>
              {cover ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={cover} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-[0.6rem] text-ink-mute">photo</div>
              )}
            </div>
          </div>
          <div className="min-w-0 pt-1">
            <p className="eyebrow !text-[0.62rem]">The story of</p>
            <p className={`font-display leading-tight text-ink ${compact ? "text-2xl" : "text-3xl"} break-words`}>{display}</p>
            {story.nickname?.trim() && <p className="mt-0.5 font-display text-sm italic text-ink-soft">also known as {story.nickname.trim()}</p>}
            <p className="mt-1 text-xs text-ink-mute">{[breed.trim(), animal !== "Other" ? animal.toLowerCase() : "", age?.trim()].filter(Boolean).join(" · ") || " "}</p>
          </div>
        </div>

        {peaks && peaks.length > 0 && (
          <div className="mt-5 animate-fade">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-clay">Their sound</p>
            <div className="mt-1.5">
              <Waveform peaks={peaks} progress={1} height={28} activeClass="fill-ink/70" label={`${display}'s sound`} />
            </div>
          </div>
        )}
        <div className="mt-5 space-y-4">
          {lines.length === 0 ? (
            <p className="font-display text-[0.98rem] italic leading-relaxed text-ink-mute">
              Their story will appear here as you write it. Our artist reads every word.
            </p>
          ) : (
            lines.map((l) => (
              <div key={l.label} className="animate-fade">
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-clay">{l.label}</p>
                <p className="mt-1 font-display text-[1.02rem] leading-relaxed text-ink">{l.text}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
