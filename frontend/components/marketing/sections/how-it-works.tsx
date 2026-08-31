"use client";

import { useEffect, useRef, useState } from "react";

import { useMotionEnabled, useScrollProgress } from "../hooks";
import { STAGES, type Stage } from "../landing-data";
import { Reveal } from "../reveal";
import { cn } from "@/lib/utils";
import { SectionHeader } from "./section-header";

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
      className="scroll-mt-16 border-b border-[var(--lp-line)]"
    >
      <div className="mx-auto w-full max-w-[1120px] px-5 pt-20 sm:px-8 lg:pt-28">
        <SectionHeader
          tag="Procedure · How TUKLAS works"
          title="Five passes. Each one throws work away."
          lead="A campaign starts wide and ends short. Every stage discards what will not convert, which is why the run stays cheap and the survivors are worth a call."
        />
      </div>

      {motion && wide ? <HorizontalTrack /> : <StageStack />}
    </section>
  );
}

/* -- desktop: a scroll-linked horizontal investigation ------------------- */

function HorizontalTrack() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const progress = useScrollProgress(wrapRef);
  const [maxX, setMaxX] = useState(0);

  useEffect(() => {
    const measure = () => {
      const track = trackRef.current;
      if (!track) return;
      setMaxX(Math.max(track.scrollWidth - window.innerWidth, 0));
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (trackRef.current) ro.observe(trackRef.current);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  const x = -progress * maxX;
  const active = Math.min(
    STAGES.length - 1,
    Math.floor(progress * STAGES.length + 0.0001),
  );

  return (
    <div ref={wrapRef} style={{ height: `${STAGES.length * 48 + 20}vh` }}>
      <div className="sticky top-0 flex h-screen flex-col justify-center overflow-hidden">
        <div
          ref={trackRef}
          className="flex items-stretch gap-6 px-[max(1.25rem,calc((100vw-1120px)/2))] will-change-transform"
          style={{ transform: `translate3d(${x.toFixed(1)}px,0,0)` }}
        >
          {STAGES.map((stage, i) => (
            <StagePanel key={stage.n} stage={stage} state={i === active} />
          ))}
        </div>

        <div className="mx-auto mt-12 w-full max-w-[1120px] px-8">
          <div className="h-px w-full bg-[var(--lp-line)]">
            <div
              className="h-px origin-left bg-[var(--lp-forest)]"
              style={{ transform: `scaleX(${Math.max(progress, 0.02)})` }}
            />
          </div>
          <div className="lp-data mt-3 flex justify-between text-[0.625rem] text-[var(--lp-muted)]">
            {STAGES.map((s, i) => (
              <span
                key={s.n}
                className={cn(
                  i <= active && "text-[var(--lp-forest)]",
                  "transition-colors duration-200",
                )}
              >
                {s.n}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StagePanel({ stage, state }: { stage: Stage; state: boolean }) {
  return (
    <article
      className={cn(
        "flex w-[78vw] shrink-0 flex-col justify-between rounded-lg border p-8 transition-[opacity,border-color,transform] duration-300 ease-out sm:w-[420px]",
        state
          ? "border-[var(--lp-forest)] bg-[var(--lp-surface)] opacity-100"
          : "border-[var(--lp-line)] bg-[var(--lp-paper)] opacity-45",
      )}
    >
      <div>
        <div className="flex items-baseline justify-between">
          <span className="lp-data text-sm text-[var(--lp-forest)]">
            {stage.n}
          </span>
          <span className="lp-eyebrow">{stage.name}</span>
        </div>
        <h3 className="lp-display mt-6 text-2xl">{stage.verb}</h3>
        <p className="lp-prose mt-3 !text-[0.95rem]">{stage.body}</p>
      </div>

      <div className="mt-8 border-t border-[var(--lp-line)] pt-4">
        <p className="lp-figure text-[2.75rem] text-[var(--lp-ink)]">
          {stage.volume.toLocaleString()}
        </p>
        <p className="lp-data mt-2 text-[0.6875rem] text-[var(--lp-muted)]">
          {stage.drop ?? "matched your brief"}
        </p>
      </div>
    </article>
  );
}

/* -- mobile / reduced-motion: the same five, stacked -------------------- */

function StageStack() {
  return (
    <div className="mx-auto w-full max-w-[1120px] px-5 py-14 sm:px-8">
      <ol className="flex flex-col gap-4">
        {STAGES.map((stage, i) => (
          <Reveal as="li" key={stage.n} delay={i * 60}>
            <article className="rounded-lg border border-[var(--lp-line)] bg-[var(--lp-surface)] p-6">
              <div className="flex items-baseline justify-between">
                <span className="lp-data text-sm text-[var(--lp-forest)]">
                  {stage.n}
                </span>
                <span className="lp-eyebrow">{stage.name}</span>
              </div>
              <h3 className="lp-display mt-3 text-xl">{stage.verb}</h3>
              <p className="lp-prose mt-2 !text-[0.95rem]">{stage.body}</p>
              <p className="lp-data mt-4 border-t border-[var(--lp-line)] pt-3 text-[0.6875rem] text-[var(--lp-muted)]">
                <span className="text-[var(--lp-ink)]">
                  {stage.volume.toLocaleString()}
                </span>{" "}
                · {stage.drop ?? "matched your brief"}
              </p>
            </article>
          </Reveal>
        ))}
      </ol>
    </div>
  );
}
