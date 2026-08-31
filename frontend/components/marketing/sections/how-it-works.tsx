"use client";

import { useEffect, useRef, useState } from "react";
import {
  Compass,
  Send,
  ShieldCheck,
  Target,
  TrendingUp,
} from "lucide-react";
import { type LucideIcon } from "lucide-react";

import { useMotionEnabled, useScrollProgress } from "../hooks";
import { STAGES, type Stage } from "../landing-data";
import { Reveal } from "../reveal";
import { cn } from "@/lib/utils";

const ICON: Record<Stage["icon"], LucideIcon> = {
  compass: Compass,
  research: TrendingUp,
  audit: ShieldCheck,
  score: Target,
  outreach: Send,
};

export function HowItWorksSection() {
  const motion = useMotionEnabled();
  const [wide, setWide] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const sync = () => setWide(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return (
    <section
      id="how-it-works"
      className="scroll-mt-16 border-y border-[var(--lp-line)] bg-[var(--lp-raise)]"
    >
      {motion && wide ? <ScrollTimeline /> : <StaticTimeline />}
    </section>
  );
}

function Header() {
  return (
    <div className="text-center">
      <Reveal>
        <p className="lp-eyebrow text-[var(--lp-amber)]">Our process</p>
      </Reveal>
      <Reveal delay={70}>
        <h2 className="lp-display mt-3 text-[clamp(1.9rem,1.3rem+2.4vw,2.9rem)]">
          How TUKLAS works
        </h2>
      </Reveal>
    </div>
  );
}

/* -- desktop: scroll drives the rail and lights the nodes ----------- */

function ScrollTimeline() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const progress = useScrollProgress(wrapRef);
  const lit = Math.min(STAGES.length, Math.ceil(progress * STAGES.length * 1.08));

  return (
    <div ref={wrapRef} style={{ height: "175vh" }}>
      <div className="sticky top-0 flex min-h-screen items-center">
        <div className="mx-auto w-full max-w-[1120px] px-8 py-16">
          <Header />

          <div className="relative mt-16">
            <div className="absolute inset-x-0 top-[15px] h-px bg-[var(--lp-line)]" />
            <div
              className="absolute inset-x-0 top-[15px] h-px origin-left bg-[var(--lp-forest)] transition-transform duration-300 ease-out"
              style={{ transform: `scaleX(${Math.max(progress, 0.001)})` }}
            />
            <ol className="grid grid-cols-5 gap-6">
              {STAGES.map((stage, i) => (
                <Node key={stage.n} stage={stage} on={i < lit} />
              ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}

function Node({ stage, on }: { stage: Stage; on: boolean }) {
  const Icon = ICON[stage.icon];
  return (
    <li className="flex flex-col items-center px-2 text-center">
      <span
        className={cn(
          "grid size-[30px] place-items-center rounded-full border text-xs font-semibold transition-colors duration-300",
          on
            ? "border-[var(--lp-forest)] bg-[var(--lp-forest)] text-[var(--lp-paper)]"
            : "border-[var(--lp-line)] bg-[var(--lp-surface)] text-[var(--lp-muted)]",
        )}
      >
        {stage.n}
      </span>
      <span
        className={cn(
          "mt-4 grid size-9 place-items-center rounded-full border transition-colors duration-300",
          on
            ? "border-[var(--lp-forest)]/30 bg-[var(--lp-surface)] text-[var(--lp-forest)]"
            : "border-[var(--lp-line)] bg-[var(--lp-surface)] text-[var(--lp-muted)]",
        )}
      >
        <Icon aria-hidden className="size-4" />
      </span>
      <h3 className="lp-display mt-3 text-lg">{stage.name}</h3>
      <p
        className="mt-1.5 max-w-[15rem] text-[0.8125rem] leading-relaxed text-[var(--lp-muted)] transition-[opacity,transform] duration-500 ease-out"
        style={{
          opacity: on ? 1 : 0,
          transform: on ? "none" : "translateY(6px)",
        }}
      >
        {stage.blurb}
      </p>
    </li>
  );
}

/* -- mobile / reduced-motion: a plain vertical timeline ------------- */

function StaticTimeline() {
  return (
    <div className="mx-auto w-full max-w-[1120px] px-5 py-20 sm:px-8">
      <Header />
      <ol className="mx-auto mt-12 flex max-w-md flex-col">
        {STAGES.map((stage, i) => {
          const Icon = ICON[stage.icon];
          return (
            <Reveal as="li" key={stage.n} delay={i * 60} className="flex gap-4 pb-8 last:pb-0">
              <span className="flex flex-col items-center">
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[var(--lp-forest)] text-xs font-semibold text-[var(--lp-paper)]">
                  {stage.n}
                </span>
                {i < STAGES.length - 1 && (
                  <span className="mt-1 w-px flex-1 bg-[var(--lp-line)]" />
                )}
              </span>
              <div className="pt-0.5">
                <div className="flex items-center gap-2">
                  <Icon aria-hidden className="size-4 text-[var(--lp-forest)]" />
                  <h3 className="lp-display text-lg">{stage.name}</h3>
                </div>
                <p className="mt-1 text-[0.875rem] leading-relaxed text-[var(--lp-muted)]">
                  {stage.blurb}
                </p>
              </div>
            </Reveal>
          );
        })}
      </ol>
    </div>
  );
}
