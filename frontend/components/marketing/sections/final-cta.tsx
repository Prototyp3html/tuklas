import { LpButton } from "../lp-button";
import { Reveal } from "../reveal";

export function FinalCta() {
  return (
    <section className="bg-[var(--lp-forest)] text-[var(--lp-paper)]">
      <div className="mx-auto w-full max-w-[1120px] px-5 py-24 text-center sm:px-8 lg:py-32">
        <Reveal>
          <p className="lp-eyebrow text-[color-mix(in_srgb,var(--lp-paper)_62%,transparent)]">
            Discover
          </p>
        </Reveal>
        <Reveal delay={70}>
          <h2 className="lp-display mx-auto mt-5 max-w-3xl text-[clamp(2.25rem,1.4rem+4vw,4rem)] text-balance text-[var(--lp-paper)]">
            Stop searching. Start discovering.
          </h2>
        </Reveal>
        <Reveal delay={140}>
          <p className="mx-auto mt-6 max-w-md font-[family-name:var(--font-newsreader)] text-[1.0625rem] leading-relaxed text-[color-mix(in_srgb,var(--lp-paper)_78%,transparent)]">
            Point TUKLAS at your city and your service. Get back a ranked list
            of businesses that already need you, each one proven.
          </p>
        </Reveal>
        <Reveal delay={210}>
          <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <LpButton href="/signup" variant="invert">
              Get started free
            </LpButton>
            <a
              href="/login"
              className="inline-flex h-11 items-center px-3 text-sm text-[color-mix(in_srgb,var(--lp-paper)_78%,transparent)] transition-colors duration-150 hover:text-[var(--lp-paper)]"
            >
              I have an account
            </a>
          </div>
        </Reveal>
        <Reveal delay={280}>
          <p className="lp-data mt-6 text-[0.6875rem] text-[color-mix(in_srgb,var(--lp-paper)_55%,transparent)]">
            Free while TUKLAS is in beta
          </p>
        </Reveal>
      </div>
    </section>
  );
}
