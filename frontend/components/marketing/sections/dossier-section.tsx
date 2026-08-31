"use client";

import { Dossier } from "../dossier";
import { useReveal } from "../hooks";
import { EXHIBIT_DOSSIER } from "../landing-data";
import { Reveal } from "../reveal";
import { cn } from "@/lib/utils";
import { SectionHeader } from "./section-header";

const SOURCES = [
  { tag: "MAPS", label: "google.com/maps", detail: "no website field, hours only" },
  { tag: "FB", label: "facebook.com", detail: "last menu photo — Nov 2023" },
  { tag: "REV", label: "210 reviews", detail: "4.5 stars, replies to most" },
];

export function DossierSection() {
  const { ref, inView } = useReveal<HTMLDivElement>({ threshold: 0.25 });

  return (
    <section className="border-b border-[var(--lp-line)] bg-[var(--lp-raise)]">
      <div className="mx-auto w-full max-w-[1240px] px-5 py-20 sm:px-8 lg:py-28">
        <SectionHeader
          tag="Exhibit A · The opportunity dossier"
          title="One lead, opened up."
          lead="This is what a campaign returns for every business it keeps — the observations, where each came from, and the score they add to."
        />

        <div
          ref={ref}
          className="relative mt-14 grid items-center gap-8 lg:grid-cols-[240px_1fr]"
        >
          {/* the sources — the pinboard, connected by string */}
          <ul className="relative z-10 flex flex-col gap-4">
            {SOURCES.map((source, i) => (
              <Reveal as="li" key={source.tag} delay={i * 90}>
                <div className="rounded-md border border-[var(--lp-line)] bg-[var(--lp-surface)] p-3">
                  <span className="lp-data text-[0.625rem] tracking-[0.14em] text-[var(--lp-forest)]">
                    {source.tag}
                  </span>
                  <p className="lp-data mt-1 truncate text-xs text-[var(--lp-ink)]">
                    {source.label}
                  </p>
                  <p className="mt-0.5 text-[0.6875rem] leading-tight text-[var(--lp-muted)]">
                    {source.detail}
                  </p>
                </div>
              </Reveal>
            ))}
          </ul>

          {/* connector strings — decorative, desktop only */}
          <svg
            aria-hidden
            viewBox="0 0 520 300"
            preserveAspectRatio="none"
            className="pointer-events-none absolute top-0 left-[240px] hidden h-full w-[120px] -translate-x-full lg:block"
          >
            {[54, 150, 246].map((y, i) => (
              <path
                key={y}
                d={`M0 ${y} C 60 ${y}, 60 150, 120 150`}
                fill="none"
                stroke="var(--lp-forest)"
                strokeWidth={1}
                strokeOpacity={0.5}
                pathLength={1}
                className={cn(
                  "[stroke-dasharray:1] [transition:stroke-dashoffset_700ms_var(--lp-ease)]",
                  inView ? "[stroke-dashoffset:0]" : "[stroke-dashoffset:1]",
                )}
                style={{ transitionDelay: `${200 + i * 120}ms` }}
              />
            ))}
          </svg>

          <Reveal delay={120} className="relative z-10">
            <Dossier {...EXHIBIT_DOSSIER} size="full" active={inView} />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
