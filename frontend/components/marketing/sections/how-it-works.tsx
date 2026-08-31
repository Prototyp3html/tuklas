"use client";

import { useEffect, useRef, useState } from "react";
import {
  Check,
  Compass,
  Send,
  ShieldCheck,
  Target,
  TrendingUp,
} from "lucide-react";
import { type LucideIcon } from "lucide-react";

import { TopoLines } from "../decor";
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

type CardState = "passed" | "active" | "upcoming";

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
      className="relative z-10 scroll-mt-16 overflow-x-clip border-y border-[var(--lp-line)] bg-[var(--lp-raise)]"
    >
      <TopoLines className="top-0 left-1/2 h-full w-[900px] -translate-x-1/2 opacity-50" />
      {motion && wide ? <ScrollRoute /> : <StaticRoute />}
    </section>
  );
}

function Header({ step }: { step?: { n: number; name: string } }) {
  return (
    <div className="relative text-center">
      <Reveal>
        <p className="lp-eyebrow text-[var(--lp-amber)]">Our process</p>
      </Reveal>
      <Reveal delay={70}>
        <h2 className="lp-display mt-3 text-[clamp(1.9rem,1.3rem+2.4vw,2.9rem)]">
          How TUKLAS works
        </h2>
      </Reveal>
      {step && (
        <p className="lp-data mt-3 text-xs text-[var(--lp-muted)]">
          Step <span className="text-[var(--lp-forest)]">{step.n}</span> /{" "}
          {STAGES.length}
          <span className="mx-1.5 text-[var(--lp-line)]">·</span>
          <span className="text-[var(--lp-ink)]">{step.name}</span>
        </p>
      )}
    </div>
  );
}

/* -- desktop: scrolling drives a marker along the surveyed route ----- */

function ScrollRoute() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const progress = useScrollProgress(wrapRef);
  const [railW, setRailW] = useState(0);

  useEffect(() => {
    const measure = () => setRailW(railRef.current?.clientWidth ?? 0);
    measure();
    const ro = new ResizeObserver(measure);
    if (railRef.current) ro.observe(railRef.current);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  const last = STAGES.length - 1;
  const active = Math.min(last, Math.round(progress * last));

  return (
    <div ref={wrapRef} style={{ height: "165vh" }}>
      <div className="sticky top-0 flex min-h-dvh items-center">
        <div className="mx-auto w-full max-w-[1160px] px-8 py-16">
          <Header step={{ n: active + 1, name: STAGES[active].name }} />

          <div className="relative mt-16">
            {/* the route: dashed base, forest fill to progress, a travelling marker */}
            <div
              ref={railRef}
              aria-hidden
              className="pointer-events-none absolute inset-x-[10%] top-[22px]"
            >
              <div
                className="h-px w-full"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(to right, var(--lp-amber) 0 2px, transparent 2px 9px)",
                  opacity: 0.55,
                }}
              />
              <div
                className="absolute inset-x-0 top-0 h-px origin-left bg-[var(--lp-forest)] transition-transform duration-300 ease-out"
                style={{ transform: `scaleX(${Math.max(progress, 0.001)})` }}
              />
              <span
                className="absolute top-[-3px] left-0 block size-1.5 rounded-[1px] bg-[var(--brand-gold)] shadow-[0_0_0_3px_var(--lp-raise)]"
                style={{
                  transform: `translateX(${(progress * railW).toFixed(1)}px) rotate(45deg)`,
                }}
              />
            </div>

            <ol className="grid grid-cols-5 gap-5">
              {STAGES.map((stage, i) => (
                <Card
                  key={stage.n}
                  stage={stage}
                  state={
                    i < active ? "passed" : i === active ? "active" : "upcoming"
                  }
                />
              ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}

function Card({ stage, state }: { stage: Stage; state: CardState }) {
  const Icon = ICON[stage.icon];
  const lit = state !== "upcoming";

  return (
    <li className="flex flex-col items-center text-center">
      <span
        className={cn(
          "relative z-10 grid size-11 place-items-center rounded-full border text-sm font-semibold transition-[background-color,border-color,color,box-shadow] duration-[400ms] ease-[var(--lp-ease)]",
          state === "upcoming"
            ? "border-dashed border-[var(--lp-line)] bg-[var(--lp-surface)] text-[var(--lp-muted)]"
            : "border-[var(--lp-forest)] bg-[var(--lp-forest)] text-[var(--lp-paper)]",
          state === "active" &&
            "shadow-[0_6px_20px_-8px_rgba(31,74,56,0.5)]",
        )}
      >
        {state === "passed" ? (
          <Check aria-hidden className="size-4" strokeWidth={3} />
        ) : (
          stage.n
        )}
      </span>

      <div
        className={cn(
          "mt-5 w-full rounded-xl border p-4 transition-[transform,border-color,box-shadow,opacity] duration-[420ms] ease-[var(--lp-ease)]",
          state === "active" &&
            "-translate-y-1 border-[var(--lp-line)] bg-[var(--lp-surface)] shadow-[0_22px_50px_-24px_rgba(26,29,26,0.28)]",
          state === "passed" && "border-transparent bg-transparent",
          state === "upcoming" &&
            "border-dashed border-[var(--lp-line)] bg-transparent opacity-70",
        )}
      >
        <span
          className={cn(
            "mx-auto grid size-10 place-items-center rounded-full border transition-[color,border-color,transform] duration-[350ms] ease-[var(--lp-ease)]",
            lit
              ? "border-[var(--lp-forest)]/25 text-[var(--lp-forest)]"
              : "border-[var(--lp-line)] text-[var(--lp-muted)]",
            state === "active" ? "scale-100" : "scale-95",
          )}
        >
          <Icon aria-hidden className="size-[1.15rem]" />
        </span>
        <h3 className="lp-display mt-3 text-lg">{stage.name}</h3>
        <p
          className="mt-1.5 text-[0.8125rem] leading-relaxed text-[var(--lp-muted)] transition-[opacity,transform] duration-[420ms] ease-[var(--lp-ease)]"
          style={{
            opacity: lit ? 1 : 0,
            transform: lit ? "none" : "translateY(6px)",
          }}
        >
          {stage.blurb}
        </p>
        <p
          className="lp-data mt-2 text-[0.625rem] text-[var(--lp-muted)] transition-opacity duration-[420ms]"
          style={{ opacity: state === "active" ? 1 : 0 }}
        >
          {stage.detail}
        </p>
      </div>
    </li>
  );
}

/* -- mobile / reduced-motion: the same route, vertical, all revealed - */

function StaticRoute() {
  return (
    <div className="mx-auto w-full max-w-[560px] px-5 py-20 sm:px-8">
      <Header />
      <ol className="relative mt-12">
        <span
          aria-hidden
          className="absolute top-3 bottom-3 left-[21px] w-px bg-[var(--lp-line)]"
        />
        {STAGES.map((stage, i) => {
          const Icon = ICON[stage.icon];
          return (
            <Reveal
              as="li"
              key={stage.n}
              delay={i * 60}
              className="relative flex gap-4 pb-7 last:pb-0"
            >
              <span className="relative z-10 grid size-11 shrink-0 place-items-center rounded-full border border-[var(--lp-forest)] bg-[var(--lp-forest)] text-sm font-semibold text-[var(--lp-paper)]">
                {stage.n}
              </span>
              <div className="flex-1 rounded-xl border border-[var(--lp-line)] bg-[var(--lp-surface)] p-4 shadow-[0_1px_2px_rgba(26,29,26,0.04)]">
                <div className="flex items-center gap-2">
                  <Icon aria-hidden className="size-4 text-[var(--lp-forest)]" />
                  <h3 className="lp-display text-lg">{stage.name}</h3>
                </div>
                <p className="mt-1 text-[0.875rem] leading-relaxed text-[var(--lp-muted)]">
                  {stage.blurb}
                </p>
                <p className="lp-data mt-2 text-[0.625rem] text-[var(--lp-muted)]">
                  {stage.detail}
                </p>
              </div>
            </Reveal>
          );
        })}
      </ol>
    </div>
  );
}
