"use client";

import { useEffect, useRef } from "react";

import { useMotionEnabled } from "./hooks";
import { DossierSection } from "./sections/dossier-section";
import { FinalCta } from "./sections/final-cta";
import { LandingFooter } from "./sections/footer";
import { HeroSection } from "./sections/hero";
import { HowItWorksSection } from "./sections/how-it-works";
import { LandingNav } from "./sections/nav";
import { ProblemSection } from "./sections/problem";
import { ResultsSection } from "./sections/results";
import { TrustSection } from "./sections/trust";

/**
 * The marketing landing. Everything visual is scoped under `.tuklas-lp` so the
 * product design system is untouched. `.lp-anim` is added only once JS has
 * mounted and the visitor allows motion — without it every `.lp-reveal`
 * element ships fully visible.
 */
export function Landing() {
  const rootRef = useRef<HTMLDivElement>(null);
  const motionEnabled = useMotionEnabled();

  useEffect(() => {
    // `.lp-anim` arms the reveal system. Require IntersectionObserver too — a
    // browser without it would otherwise leave revealed content stuck hidden.
    const armed =
      motionEnabled && typeof IntersectionObserver !== "undefined";
    rootRef.current?.classList.toggle("lp-anim", armed);
  }, [motionEnabled]);

  return (
    <div ref={rootRef} className="tuklas-lp">
      <LandingNav />
      <main>
        <HeroSection />
        <ProblemSection />
        <HowItWorksSection />
        <DossierSection />
        <TrustSection />
        <ResultsSection />
        <FinalCta />
      </main>
      <LandingFooter />
    </div>
  );
}
