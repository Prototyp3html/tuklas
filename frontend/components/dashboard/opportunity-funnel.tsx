import type { DashboardFunnelStage } from "@/lib/types";
import { cn } from "@/lib/utils";

const BAND_MIN_H = 48;

/**
 * The signature. Stacked trapezoids that narrow toward a point — the cost
 * funnel made literal. Every stage discards, so each band is smaller than the
 * one above and carries the count that was dropped entering it. The number to
 * read is at the bottom: how few of the businesses scanned are worth a call.
 *
 * Each row owns its own trapezoid (top edge = this stage's width, bottom edge
 * = the next stage's), so the bands always line up with their labels and stack
 * into one continuous shape.
 */
export function OpportunityFunnel({
  stages,
  rangeLabel,
  entered,
}: {
  stages: DashboardFunnelStage[];
  rangeLabel: string;
  entered: boolean;
}) {
  const max = stages[0]?.count || 1;
  const last = stages.length - 1;

  // Blend the true ratio with its square root, floored at 34%: the funnel
  // narrows honestly where the data drops without any band pinching to a spike.
  const widthFrac = (count: number) => {
    const r = count / max;
    const shaped = 0.45 * r + 0.55 * Math.sqrt(r);
    return Math.min(Math.max(0.34 + 0.66 * shaped, 0.34), 1);
  };

  const trapezoid = (wTop: number, wBot: number) =>
    `polygon(${50 - wTop * 50}% 0, ${50 + wTop * 50}% 0, ${50 + wBot * 50}% 100%, ${50 - wBot * 50}% 100%)`;

  const ratio = Math.max(
    1,
    Math.round((stages[0]?.count ?? 0) / (stages[last]?.count || 1)),
  );

  return (
    <section className="border-rule bg-sheet flex h-full flex-col rounded-xl border p-5 shadow-[0_1px_2px_rgba(26,29,26,0.04)]">
      <header className="flex items-baseline justify-between">
        <h2 className="text-[0.95rem] font-semibold tracking-tight">
          Opportunity funnel
        </h2>
        <span className="text-muted-foreground text-xs">{rangeLabel}</span>
      </header>

      <ol className="mt-5 flex-1">
        {stages.map((stage, i) => {
          const wTop = widthFrac(stage.count);
          const wBot =
            i === last ? wTop * 0.58 : widthFrac(stages[i + 1].count);
          return (
            <li
              key={stage.key}
              className="flex items-stretch gap-4"
              style={{ minHeight: BAND_MIN_H }}
            >
              <div className="relative w-[46%] max-w-[260px] shrink-0">
                <div
                  className="funnel-band absolute inset-x-0 inset-y-[1px]"
                  data-in={entered ? "true" : "false"}
                  style={{
                    clipPath: trapezoid(wTop, wBot),
                    background: `color-mix(in srgb, var(--verify), var(--paper) ${i * 13}%)`,
                    transitionDelay: `${i * 100}ms`,
                  }}
                />
              </div>

              <div
                data-in={entered ? "true" : "false"}
                style={{ transitionDelay: `${i * 100 + 80}ms` }}
                className="dash-enter flex flex-1 flex-col justify-center py-1"
              >
                <p className="flex items-baseline gap-2">
                  <span
                    className={cn(
                      "tabular text-lg leading-none",
                      i === last ? "text-tier-high" : "text-foreground",
                    )}
                  >
                    {stage.count.toLocaleString()}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {stage.label}
                  </span>
                </p>
                {stage.dropped > 0 && stage.dropReason && (
                  <p className="text-muted-foreground mt-1 text-[0.6875rem] leading-tight">
                    <span className="tabular">
                      −{stage.dropped.toLocaleString()}
                    </span>{" "}
                    {stage.dropReason}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      <p className="border-rule text-muted-foreground mt-4 border-t pt-3 text-xs">
        About <span className="tabular text-foreground">1 in {ratio}</span>{" "}
        businesses scanned becomes a high-priority lead.
      </p>
    </section>
  );
}
