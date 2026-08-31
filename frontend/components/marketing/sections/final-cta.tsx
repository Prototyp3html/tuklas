"use client";

import { ArrowRight } from "lucide-react";

import { CompassRose, DottedPath } from "../decor";
import { useReveal } from "../hooks";
import { LpButton } from "../lp-button";
import { Reveal } from "../reveal";

export function FinalCta() {
  const { ref, inView } = useReveal<HTMLDivElement>({ threshold: 0.3 });

  return (
    <section
      ref={ref}
      className="relative overflow-hidden bg-[var(--lp-paper)]"
    >
      <CompassRose
        spin
        className="-right-16 -bottom-24 h-[420px] w-[420px] opacity-[0.35] sm:-right-10"
      />
      <DottedPath
        drawn={inView}
        className="bottom-10 left-4 hidden h-[130px] w-[320px] sm:block"
      />

      <div className="relative mx-auto w-full max-w-[720px] px-5 py-24 text-center sm:px-8 lg:py-32">
        <Reveal>
          <h2 className="lp-display text-[clamp(2.25rem,1.5rem+3.4vw,3.75rem)] text-balance">
            Stop searching. Start discovering.
          </h2>
        </Reveal>
        <Reveal delay={90}>
          <p className="lp-prose mx-auto mt-5 max-w-md">
            Join freelancers who close more clients with less guesswork.
          </p>
        </Reveal>
        <Reveal delay={170}>
          <div className="mt-8 flex justify-center">
            <LpButton href="/signup" className="h-12 px-6">
              Start free discovery
              <ArrowRight aria-hidden className="size-4" />
            </LpButton>
          </div>
        </Reveal>
        <Reveal delay={240}>
          <p className="lp-data mt-5 text-xs text-[var(--lp-muted)]">
            No credit card required · Cancel anytime
          </p>
        </Reveal>
      </div>
    </section>
  );
}
