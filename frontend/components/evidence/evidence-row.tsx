import { formatShortDate, hostname } from "@/lib/format";
import type { EvidenceRow as EvidenceRowType } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * One line of the ledger: a mark, a claim, its weight, and the source that
 * makes it checkable.
 *
 * The mark is a text character rather than an icon because ✓/✗ read faster at
 * a glance. The source is a visible link showing its host — not an icon, not a
 * tooltip. That link is the entire credibility of the product.
 */
export function EvidenceRow({
  row,
  banded,
  index,
}: {
  row: EvidenceRowType;
  banded: boolean;
  index: number;
}) {
  const isGap = row.kind === "gap";

  return (
    <li
      style={{ animationDelay: `${index * 40}ms` }}
      className={cn(
        "animate-in fade-in slide-in-from-bottom-1 fill-mode-both grid grid-cols-[1.25rem_1fr_auto] gap-x-2.5 px-3 py-2.5 duration-300 ease-out sm:px-4",
        banded && "bg-band/60",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "text-base leading-6 font-medium",
          isGap ? "text-gap" : "text-verify",
        )}
      >
        {isGap ? "✗" : "✓"}
      </span>

      <div className="min-w-0">
        <p className="text-sm leading-6">
          <span className="sr-only">
            {isGap ? "Gap: " : "Strength: "}
          </span>
          {row.claim}
        </p>
        <p className="text-muted-foreground mt-0.5 text-xs leading-5">
          {row.observedValue}
        </p>
        <p className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <a
            href={row.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="tabular focus-visible:ring-ring rounded-xs text-xs underline decoration-current/40 underline-offset-2 transition-colors duration-150 hover:decoration-current focus-visible:ring-2 focus-visible:outline-none"
          >
            {hostname(row.sourceUrl)}
          </a>
          <span className="tabular text-muted-foreground text-xs">
            checked {formatShortDate(row.collectedAt)}
            {row.confidence < 0.75 && (
              <> · confidence {row.confidence.toFixed(2)}</>
            )}
          </span>
        </p>
      </div>

      <span
        className={cn(
          "tabular self-start text-sm leading-6",
          isGap ? "text-gap" : "text-foreground",
        )}
      >
        {row.weight === null ? "—" : `+${row.weight}`}
      </span>
    </li>
  );
}
