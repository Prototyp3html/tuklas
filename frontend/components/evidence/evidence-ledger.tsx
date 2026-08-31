import { scoreTier, tierClass } from "@/lib/format";
import type { EvidenceRow as EvidenceRowType } from "@/lib/types";
import { EvidenceRow } from "./evidence-row";

/**
 * The signature of the product.
 *
 * Most lead tools hand you a number and hide the reasoning. This shows the
 * reasoning and lets the number fall out of it: every observation carries its
 * own weight in a ruled column, and they sum, in front of the user, to the
 * score. Closed with a double rule — the accounting convention for a total.
 *
 * Evidence is the hero. The score is the summary, and here the summary is
 * literally the sum.
 */
export function EvidenceLedger({ evidence }: { evidence: EvidenceRowType[] }) {
  const total = evidence.reduce((sum, row) => sum + (row.weight ?? 0), 0);
  const tier = scoreTier(total);

  if (evidence.length === 0) {
    return (
      <section className="border-rule bg-sheet rounded-sm border p-6">
        <h2 className="text-muted-foreground text-xs tracking-[0.14em] uppercase">
          Why this is an opportunity
        </h2>
        <p className="mt-3 text-sm">
          Nothing observed yet. Run the research and audit stages for this
          campaign to collect evidence for this business.
        </p>
      </section>
    );
  }

  return (
    <section className="border-rule bg-sheet overflow-hidden rounded-sm border">
      <header className="border-rule flex items-baseline justify-between border-b px-3 py-2.5 sm:px-4">
        <h2 className="text-muted-foreground text-xs tracking-[0.14em] uppercase">
          Why this is an opportunity
        </h2>
        <span className="tabular text-muted-foreground text-[0.6875rem] tracking-[0.14em] uppercase">
          Weight
        </span>
      </header>

      <ol>
        {evidence.map((row, i) => (
          <EvidenceRow key={row.id} row={row} banded={i % 2 === 1} index={i} />
        ))}
      </ol>

      <footer className="px-3 pb-4 sm:px-4">
        <div className="rule-double ml-auto w-fit pt-2 pl-8">
          <p className="flex items-baseline justify-end gap-2">
            <span className="text-muted-foreground text-xs">Score</span>
            <span className={`tabular text-2xl ${tierClass(tier)}`}>
              {total}
            </span>
            <span className="tabular text-muted-foreground text-sm">/ 100</span>
          </p>
        </div>
        <p className="text-muted-foreground mt-2 text-right text-xs">
          {evidence.length} observations, each with a source you can check.
        </p>
      </footer>
    </section>
  );
}
