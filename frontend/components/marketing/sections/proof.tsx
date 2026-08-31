"use client";

import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";

import { TopoLines } from "../decor";
import { useReveal } from "../hooks";
import { PROOF_POINTS } from "../landing-data";
import { Reveal } from "../reveal";
import { SampleDossier } from "../sample-dossier";

export function ProofSection() {
  const { ref, inView } = useReveal<HTMLDivElement>({ threshold: 0.15 });

  return (
    <section
      id="proof"
      className="relative overflow-hidden border-b border-[var(--lp-line)] bg-[var(--lp-paper)]"
    >
      <TopoLines className="top-0 -left-32 h-[120%] w-[720px] opacity-60" />

      <div className="relative mx-auto grid w-full max-w-[1120px] items-center gap-12 px-5 py-20 sm:px-8 lg:grid-cols-[0.82fr_1.18fr] lg:gap-14 lg:py-28">
        <div ref={ref} className="max-w-md">
          <Reveal>
            <p className="lp-eyebrow text-[var(--lp-amber)]">
              Evidence-backed intelligence
            </p>
          </Reveal>
          <Reveal delay={70}>
            <h2 className="lp-display mt-4 text-[clamp(2rem,1.4rem+2.6vw,3rem)] text-balance">
              Every opportunity comes with proof.
            </h2>
          </Reveal>
          <Reveal delay={140}>
            <p className="lp-prose mt-5">
              You don&apos;t get a bare list. Every lead carries verifiable
              evidence, a confidence score, a clear insight, and a
              recommended pitch.
            </p>
          </Reveal>

          <ul className="mt-7 flex flex-col gap-3">
            {PROOF_POINTS.map((point, i) => (
              <li
                key={point}
                data-in={inView ? "true" : "false"}
                style={{ transitionDelay: `${i * 90}ms` }}
                className="lp-reveal flex items-center gap-2.5 text-[0.9375rem] text-[var(--lp-ink)]"
              >
                <span className="grid size-5 shrink-0 place-items-center rounded-full bg-[var(--lp-forest)] text-[var(--lp-paper)]">
                  <Check aria-hidden className="size-3" strokeWidth={3} />
                </span>
                {point}
              </li>
            ))}
          </ul>

          <Reveal delay={260}>
            <Link
              href="/leads/kristines-beauty-lounge"
              className="mt-7 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--lp-forest)] hover:gap-2.5 focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              Explore a sample dossier
              <ArrowRight aria-hidden className="size-3.5" />
            </Link>
          </Reveal>
        </div>

        <Reveal delay={120} rootMargin="0px">
          <SampleDossier />
        </Reveal>
      </div>
    </section>
  );
}
