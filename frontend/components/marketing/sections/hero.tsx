"use client";

import { ChevronDown } from "lucide-react";

import { TopoLines } from "../decor";
import { HeroDossier } from "../hero-dossier";
import { useParallax } from "../hooks";
import { LpButton } from "../lp-button";
import { Reveal } from "../reveal";

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
  const { ref, transform } = useParallax<HTMLDivElement>(0.04, 36);

  return (
    <section id="top" className="relative overflow-x-clip">
      <TopoLines className="-top-40 -right-40 h-[150%] w-[900px] opacity-70" />

      {/* margin grid — faint column rules bleeding past the content edge */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-1/2 hidden w-[1120px] -translate-x-1/2 lg:block"
      >
        <div className="absolute inset-y-0 left-0 w-px bg-[var(--lp-line-soft)]" />
        <div className="absolute inset-y-0 right-0 w-px bg-[var(--lp-line-soft)]" />
      </div>

      <div className="mx-auto grid w-full max-w-[1120px] items-center gap-12 px-5 pt-16 pb-20 sm:px-8 lg:grid-cols-[1fr_0.82fr] lg:gap-10 lg:pt-24 lg:pb-28">
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
              TUKLAS finds high-potential local businesses, explains why they
              need your service, and helps you start the conversation.
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
          <div ref={ref} style={transform ? { transform } : undefined}>
            <HeroDossier active />
          </div>
        </Reveal>
      </div>

      {/* scroll cue */}
      <div className="pointer-events-none absolute inset-x-0 bottom-5 hidden justify-center lg:flex">
        <span className="lp-eyebrow flex items-center gap-1.5 text-[0.5625rem] text-[var(--lp-muted)]">
          Scroll to discover
          <ChevronDown aria-hidden className="size-3" />
        </span>
      </div>
    </section>
  );
}
