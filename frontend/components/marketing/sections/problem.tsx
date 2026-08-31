import { PROBLEM_ANSWERS, PROBLEM_PAINS } from "../landing-data";
import { Reveal } from "../reveal";
import { SectionHeader } from "./section-header";

export function ProblemSection() {
  return (
    <section className="border-y border-[var(--lp-line)]">
      <div className="mx-auto w-full max-w-[1120px] px-5 py-16 sm:px-8 lg:py-24">
        <SectionHeader
          tag="Field note 01 · The problem"
          title="Finding the right business is the slow part. Selling to it is easy."
        />

        <div className="mt-14 grid gap-px overflow-hidden rounded-lg border border-[var(--lp-line)] bg-[var(--lp-line)] md:grid-cols-2">
          {/* the usual way — set back, quieter */}
          <div className="bg-[var(--lp-paper)] p-7 sm:p-9">
            <p className="lp-eyebrow">The usual way</p>
            <ul className="mt-6 flex flex-col gap-6">
              {PROBLEM_PAINS.map((pain, i) => (
                <Reveal as="li" key={pain.title} delay={i * 70}>
                  <h3 className="font-[family-name:var(--font-bricolage)] text-[0.95rem] font-semibold text-[var(--lp-ink)]">
                    {pain.title}
                  </h3>
                  <p className="lp-prose mt-1.5 !text-[0.95rem] text-[var(--lp-muted)]">
                    {pain.body}
                  </p>
                </Reveal>
              ))}
            </ul>
          </div>

          {/* with TUKLAS — the answer, on a clean sheet */}
          <div className="bg-[var(--lp-surface)] p-7 sm:p-9">
            <p className="lp-eyebrow text-[var(--lp-forest)]">With TUKLAS</p>
            <ul className="mt-6 flex flex-col gap-6">
              {PROBLEM_ANSWERS.map((answer, i) => (
                <Reveal as="li" key={answer.title} delay={120 + i * 90}>
                  <h3 className="flex items-baseline gap-2 font-[family-name:var(--font-bricolage)] text-[0.95rem] font-semibold text-[var(--lp-ink)]">
                    <span
                      aria-hidden
                      className="lp-data text-xs text-[var(--lp-forest)]"
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {answer.title}
                  </h3>
                  <p className="lp-prose mt-1.5 !text-[0.95rem]">{answer.body}</p>
                </Reveal>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
