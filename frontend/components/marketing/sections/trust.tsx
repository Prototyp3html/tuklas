"use client";

import { useReveal } from "../hooks";
import { TRUST_STEPS } from "../landing-data";
import { Reveal } from "../reveal";
import { cn } from "@/lib/utils";
import { SectionHeader } from "./section-header";

export function TrustSection() {
  const { ref, inView } = useReveal<HTMLDivElement>({ threshold: 0.3 });

  return (
    <section className="border-b border-[var(--lp-line)]">
      <div className="mx-auto w-full max-w-[1120px] px-5 py-20 sm:px-8 lg:py-28">
        <SectionHeader
          tag="Chain of custody · Trust through evidence"
          title="TUKLAS never asks you to trust the number."
        />

        {/* the evidence timeline — a line that draws itself left to right */}
        <div ref={ref} className="relative mt-16">
          <div className="absolute top-[7px] right-0 left-0 h-px bg-[var(--lp-line)]" />
          <div
            className="absolute top-[7px] left-0 h-px origin-left bg-[var(--lp-forest)] transition-transform duration-[900ms] ease-out"
            style={{
              right: 0,
              transform: `scaleX(${inView ? 1 : 0})`,
            }}
          />

          <ol className="grid grid-cols-2 gap-y-8 sm:grid-cols-3 lg:grid-cols-5">
            {TRUST_STEPS.map((step, i) => (
              <li key={step.label} className="relative pr-4">
                <span
                  className={cn(
                    "block h-3.5 w-3.5 rounded-full border-2 border-[var(--lp-forest)] transition-colors duration-300",
                    inView ? "bg-[var(--lp-forest)]" : "bg-[var(--lp-paper)]",
                  )}
                  style={{ transitionDelay: `${i * 140}ms` }}
                />
                <Reveal delay={i * 90}>
                  <p className="lp-data mt-4 text-[0.8125rem] text-[var(--lp-ink)]">
                    {step.label}
                  </p>
                  <p className="mt-1 text-[0.8125rem] leading-snug text-[var(--lp-muted)]">
                    {step.detail}
                  </p>
                </Reveal>
              </li>
            ))}
          </ol>
        </div>

        <Reveal delay={120}>
          <p className="lp-prose mt-16 max-w-2xl border-l-2 border-[var(--lp-forest)] pl-5 !text-[1.1875rem] italic">
            Every point on a score links to the page it came from. Open it,
            disagree, adjust the weight. The verdict stays yours — TUKLAS just
            keeps the evidence in order.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
