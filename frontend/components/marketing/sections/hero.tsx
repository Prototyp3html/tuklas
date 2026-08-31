"use client";

import { ChevronDown } from "lucide-react";

import { TopoLines } from "../decor";
import { HeroDossier } from "../hero-dossier";
import { useMotionEnabled, useParallax } from "../hooks";
import { LpButton } from "../lp-button";
import { Reveal } from "../reveal";
import { cn } from "@/lib/utils";

const AVATARS = [
  "var(--lp-forest)",
  "var(--lp-amber)",
  "var(--lp-forest-tint)",
  "var(--lp-band, var(--lp-line))",
];

function AvatarStack() {
  return (
    <div className="flex -space-x-2">
      {AVATARS.map((bg, i) => (
        <span
          key={i}
          aria-hidden
          className="size-7 rounded-full border-2 border-[var(--lp-paper)]"
          style={{ background: bg }}
        />
      ))}
    </div>
  );
}

export function HeroSection() {
  const motion = useMotionEnabled();
  const { ref: dossierRef, transform } = useParallax<HTMLDivElement>(0.04, 36);

  // The hero pins (position: sticky) while "How TUKLAS works" — z-10, opaque —
  // rises up and covers it. During that hold the pinned content dims a touch
  // and the scroll cue fades out; both are driven off the section's own
  // view-progress in CSS (`.lp-hero-*`, globals.css), so the motion runs off
  // the main thread and needs no scroll listener. Where scroll-timelines
  // aren't supported the hero still pins — it just doesn't dim.
  return (
    <section
      id="top"
      className={cn(
        "relative overflow-x-clip",
        motion && "lp-hero-pin lg:h-[175vh]",
      )}
    >
      <TopoLines className="top-0 -right-40 h-[150%] w-[900px] opacity-70" />

      {/* margin grid — faint column rules bleeding past the content edge */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-1/2 hidden w-[1120px] -translate-x-1/2 lg:block"
      >
        <div className="absolute inset-y-0 left-0 w-px bg-[var(--lp-line-soft)]" />
        <div className="absolute inset-y-0 right-0 w-px bg-[var(--lp-line-soft)]" />
      </div>

      <div
        className={cn(
          motion &&
            "lg:sticky lg:top-0 lg:flex lg:h-dvh lg:flex-col lg:justify-center",
        )}
      >
        <div className={cn(motion && "lp-hero-recede")}>
          <div className="mx-auto grid w-full max-w-[1120px] items-center gap-12 px-5 pt-16 pb-20 sm:px-8 lg:grid-cols-[1fr_0.82fr] lg:gap-10 lg:pt-20 lg:pb-16">
            <div className="max-w-xl">
              <Reveal>
                <p className="lp-eyebrow flex items-center gap-2 text-[var(--lp-amber)]">
                  Opportunity intelligence for freelancers
                  <span className="h-px w-6 bg-[var(--lp-amber)]/50" />
                </p>
              </Reveal>
              <Reveal delay={70}>
                <h1 className="lp-display mt-5 text-[clamp(2.75rem,1.6rem+4.6vw,4.5rem)] text-balance">
                  Discover businesses that already need what you sell.
                </h1>
              </Reveal>
              <Reveal delay={140}>
                <p className="lp-prose mt-6 max-w-md">
                  TUKLAS finds high-potential local businesses, explains why
                  they need your service, and helps you start the conversation.
                </p>
              </Reveal>
              <Reveal delay={210}>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <LpButton href="/signup">Start free discovery</LpButton>
                  <LpButton href="#how-it-works" variant="ghost">
                    See how it works
                  </LpButton>
                </div>
              </Reveal>
              <Reveal delay={280}>
                <div className="mt-9 flex items-center gap-3">
                  <AvatarStack />
                  <p className="text-xs text-[var(--lp-muted)]">
                    Trusted by{" "}
                    <span className="font-medium text-[var(--lp-ink)]">
                      120+ freelancers
                    </span>
                    <span className="mx-1.5 text-[var(--lp-line)]">·</span>
                    <span className="lp-data text-[var(--lp-ink)]">★ 4.9</span>
                  </p>
                </div>
              </Reveal>
            </div>

            <Reveal delay={160} className="relative" rootMargin="0px">
              <div ref={dossierRef} style={transform ? { transform } : undefined}>
                <HeroDossier active />
              </div>
            </Reveal>
          </div>
        </div>

        {/* scroll cue — a link that is also the invitation */}
        <div
          className={cn(
            "pointer-events-none absolute inset-x-0 bottom-6 hidden justify-center lg:flex",
            motion && "lp-hero-cue",
          )}
        >
          <a
            href="#how-it-works"
            className="lp-eyebrow pointer-events-auto flex flex-col items-center gap-1 text-[0.5625rem] text-[var(--lp-muted)] transition-colors duration-150 hover:text-[var(--lp-ink)]"
          >
            Scroll to discover
            <span className="flex flex-col items-center -space-y-1.5">
              <ChevronDown aria-hidden className="lp-float size-3" />
              <ChevronDown
                aria-hidden
                className="lp-float size-3 opacity-40"
                style={{ animationDelay: "0.4s" }}
              />
            </span>
          </a>
        </div>
      </div>
    </section>
  );
}
