"use client";

import { Dossier } from "../dossier";
import { useParallax } from "../hooks";
import { HERO_DOSSIER } from "../landing-data";
import { LpButton } from "../lp-button";
import { Reveal } from "../reveal";

export function HeroSection() {
  const { ref, transform } = useParallax<HTMLDivElement>(0.04, 36);

  return (
    <section id="top" className="relative overflow-hidden">
      {/* margin grid — faint column rules bleeding past the content edge */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-1/2 hidden w-[1120px] -translate-x-1/2 lg:block"
      >
        <div className="absolute inset-y-0 left-0 w-px bg-[var(--lp-line-soft)]" />
        <div className="absolute inset-y-0 right-0 w-px bg-[var(--lp-line-soft)]" />
      </div>

      <div className="mx-auto grid w-full max-w-[1120px] gap-12 px-5 pt-16 pb-16 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8 lg:pt-24 lg:pb-20">
        <div className="max-w-xl">
          <Reveal>
            <p className="lp-eyebrow">Opportunity intelligence</p>
          </Reveal>
          <Reveal delay={70}>
            <h1 className="lp-display mt-5 text-[clamp(2.5rem,1.5rem+4.6vw,4.4rem)] text-balance">
              Discover businesses that already need what you sell.
            </h1>
          </Reveal>
          <Reveal delay={140}>
            <p className="lp-prose mt-6 max-w-lg">
              Give TUKLAS a service, an industry, and a city. It walks the local
              listings, checks what each business already has online, and hands
              back the ones missing it — every claim with a source you can open.
            </p>
          </Reveal>
          <Reveal delay={210}>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <LpButton href="/signup">Get started free</LpButton>
              <LpButton href="#how-it-works" variant="ghost">
                See how it works
              </LpButton>
            </div>
          </Reveal>
          <Reveal delay={280}>
            <p className="lp-data mt-6 text-xs text-[var(--lp-muted)]">
              Built on public listings · Every score is auditable
            </p>
          </Reveal>
        </div>

        {/* the dossier, peeking — bleeds off the right edge on wide screens */}
        <Reveal
          delay={160}
          className="relative lg:-mr-16 xl:-mr-28"
          rootMargin="0px"
        >
          <div ref={ref} style={transform ? { transform } : undefined}>
            <Dossier {...HERO_DOSSIER} size="peek" active />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
