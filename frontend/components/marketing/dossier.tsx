"use client";

import { useCountUp } from "./hooks";
import { cn } from "@/lib/utils";

export type EvidenceLine = {
  kind: "gap" | "strength";
  claim: string;
  /** the domain the observation came from — shown, not hidden in a tooltip */
  source: string;
  weight: number;
};

export type DossierData = {
  business: string;
  location: string;
  category: string;
  lines: EvidenceLine[];
  recommendation?: string;
};

type DossierProps = DossierData & {
  /** stagger the evidence rows and count the score up */
  active?: boolean;
  /** "peek" is the compact hero variant; "full" is the exhibit */
  size?: "peek" | "full";
  className?: string;
};

/**
 * The living dossier — TUKLAS's actual output, rendered as a case file.
 * Every line is an observation with a source and a weight; a double rule
 * closes the column and the total is the opportunity score. The reader
 * watches the number get derived instead of being handed a verdict.
 *
 * This is the page's signature element. It appears three times at three
 * scales: peeking in the hero, full in the Exhibit section, abstracted into
 * the funnel in Results.
 */
export function Dossier({
  business,
  location,
  category,
  lines,
  recommendation,
  active = true,
  size = "full",
  className,
}: DossierProps) {
  const total = lines.reduce((sum, l) => sum + l.weight, 0);
  const score = Math.round(useCountUp(total, active, { duration: 1200 }));
  const pad = size === "peek" ? "px-4" : "px-5 sm:px-7";

  return (
    <figure
      className={cn(
        "overflow-hidden rounded-lg border border-[var(--lp-line)] bg-[var(--lp-surface)]",
        "shadow-[0_1px_0_var(--lp-line),0_28px_60px_-32px_rgba(26,29,26,0.28)]",
        className,
      )}
    >
      {/* record header — the world as it exists, in expanded caps */}
      <figcaption className={cn("border-b border-[var(--lp-line)] py-4", pad)}>
        <p className="lp-eyebrow text-[0.625rem]">Opportunity dossier</p>
        <p className="lp-display mt-1.5 text-[1.0625rem] tracking-[0.01em] uppercase sm:text-lg">
          {business}
        </p>
        <p className="lp-data mt-1 text-xs text-[var(--lp-muted)]">
          {location} · {category}
        </p>
      </figcaption>

      {/* column head */}
      <div
        className={cn(
          "flex items-baseline justify-between border-b border-[var(--lp-line)] py-2",
          pad,
        )}
      >
        <span className="lp-eyebrow text-[0.5625rem]">
          Why this is an opportunity
        </span>
        <span className="lp-eyebrow text-[0.5625rem]">Weight</span>
      </div>

      <ol>
        {lines.map((line, i) => (
          <li
            key={line.claim}
            data-in={active ? "true" : "false"}
            style={{ transitionDelay: `${180 + i * 90}ms` }}
            className={cn(
              "lp-reveal grid grid-cols-[1rem_1fr_auto] items-baseline gap-x-3 py-2.5",
              pad,
              i % 2 === 1 && "bg-[var(--lp-paper)]",
            )}
          >
            <span
              aria-hidden
              className={cn(
                "text-sm",
                line.kind === "gap"
                  ? "text-[var(--lp-amber)]"
                  : "text-[var(--lp-forest)]",
              )}
            >
              {line.kind === "gap" ? "✗" : "✓"}
            </span>
            <span className="min-w-0">
              <span className="block text-[0.9375rem] leading-snug text-[var(--lp-ink)]">
                {line.kind === "gap" ? (
                  <span className="lp-marker">{line.claim}</span>
                ) : (
                  line.claim
                )}
              </span>
              <span className="lp-data mt-0.5 block text-[0.6875rem] text-[var(--lp-muted)] underline decoration-[var(--lp-line)] underline-offset-2">
                {line.source}
              </span>
            </span>
            <span
              className={cn(
                "lp-data text-sm",
                line.kind === "gap"
                  ? "font-medium text-[var(--lp-amber)]"
                  : "text-[var(--lp-ink)]",
              )}
            >
              +{line.weight}
            </span>
          </li>
        ))}
      </ol>

      {/* the total, closed like a ledger */}
      <div className={cn("pt-2 pb-5", pad)}>
        <div className="lp-rule-double ml-auto w-fit pt-2 pl-10">
          <p className="flex items-baseline justify-end gap-2">
            <span className="lp-eyebrow text-[0.5625rem]">Opportunity score</span>
            <span className="lp-data text-3xl leading-none text-[var(--lp-forest)]">
              {score}
            </span>
            <span className="lp-data text-sm text-[var(--lp-muted)]">/ 100</span>
          </p>
        </div>
      </div>

      {recommendation && (
        <div
          className={cn(
            "border-t border-[var(--lp-line)] bg-[var(--lp-forest-tint)] py-4",
            pad,
          )}
        >
          <p className="lp-eyebrow text-[0.5625rem] text-[var(--lp-forest)]">
            Recommended pitch
          </p>
          <p className="mt-1.5 text-[0.9375rem] leading-relaxed text-[var(--lp-ink-soft)]">
            {recommendation}
          </p>
        </div>
      )}
    </figure>
  );
}
