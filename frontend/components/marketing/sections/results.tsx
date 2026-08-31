"use client";

import { useCountUp, useReveal } from "../hooks";
import { EARLY_NOTES, FUNNEL, RESULT_METRICS } from "../landing-data";
import { Reveal } from "../reveal";
import { SectionHeader } from "./section-header";

export function ResultsSection() {
  const { ref, inView } = useReveal<HTMLDivElement>({ threshold: 0.3 });
  const widest = FUNNEL[0].value;

  return (
    <section className="border-b border-[var(--lp-line)] bg-[var(--lp-raise)]">
      <div className="mx-auto w-full max-w-[1120px] px-5 py-20 sm:px-8 lg:py-28">
        <SectionHeader
          tag="Disposition · Results"
          title="Wide in, short out — and what's left is worth the call."
        />

        <div ref={ref} className="mt-14 grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          {/* count-up metrics */}
          <ul className="flex flex-col gap-8">
            {RESULT_METRICS.map((metric, i) => (
              <Metric key={metric.label} metric={metric} active={inView} index={i} />
            ))}
          </ul>

          {/* the funnel, narrowing */}
          <div>
            <p className="lp-eyebrow">One campaign, stage by stage</p>
            <ol className="mt-6 flex flex-col gap-5">
              {FUNNEL.map((stage, i) => (
                <li key={stage.label}>
                  <div className="flex items-baseline justify-between">
                    <span className="text-[0.9375rem] text-[var(--lp-ink)]">
                      {stage.label}
                    </span>
                    <span className="lp-data text-sm text-[var(--lp-muted)]">
                      {stage.value.toLocaleString()}
                    </span>
                  </div>
                  <div className="mt-2 h-2.5 overflow-hidden rounded-xs bg-[var(--lp-forest-tint)]">
                    <div
                      className="h-full origin-left rounded-xs bg-[var(--lp-forest)] transition-transform duration-[600ms] ease-out"
                      style={{
                        transform: `scaleX(${
                          inView ? Math.max(stage.value / widest, 0.02) : 0
                        })`,
                        transitionDelay: `${i * 90}ms`,
                      }}
                    />
                  </div>
                </li>
              ))}
            </ol>
            <p className="lp-data mt-4 text-[0.6875rem] text-[var(--lp-muted)]">
              Funnel volumes are design targets for the pipeline, not a
              guarantee.
            </p>
          </div>
        </div>

        {/* early notes — attributed by role and city, no invented names */}
        <div className="mt-16 grid gap-6 border-t border-[var(--lp-line)] pt-10 sm:grid-cols-2">
          {EARLY_NOTES.map((note, i) => (
            <Reveal as="figure" key={note.who} delay={i * 90}>
              <blockquote className="lp-prose !text-[1.0625rem] text-[var(--lp-ink)]">
                “{note.quote}”
              </blockquote>
              <figcaption className="lp-data mt-3 text-[0.6875rem] text-[var(--lp-muted)]">
                {note.who}
              </figcaption>
            </Reveal>
          ))}
        </div>
        <p className="lp-data mt-6 text-[0.625rem] text-[var(--lp-muted)]">
          Notes from pilot testing — illustrative, kept anonymous until the beta
          wraps.
        </p>
      </div>
    </section>
  );
}

function Metric({
  metric,
  active,
  index,
}: {
  metric: (typeof RESULT_METRICS)[number];
  active: boolean;
  index: number;
}) {
  const value = useCountUp(metric.value, active, { duration: 1200 + index * 150 });
  const prefix = "prefix" in metric ? metric.prefix : "";
  const suffix = "suffix" in metric ? metric.suffix : "";

  return (
    <li>
      <p className="lp-figure text-[clamp(2.5rem,1.7rem+2.8vw,3.5rem)] text-[var(--lp-forest)]">
        {prefix}
        {Math.round(value).toLocaleString()}
        {suffix}
      </p>
      <p className="mt-2 text-[0.9375rem] text-[var(--lp-ink)]">{metric.label}</p>
      <p className="lp-data mt-1 text-[0.625rem] tracking-[0.12em] text-[var(--lp-muted)] uppercase">
        {metric.note}
      </p>
    </li>
  );
}
