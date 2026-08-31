import type { DashboardKpi } from "@/lib/types";
import { cn } from "@/lib/utils";

/** One headline number with a delta. No sparkline competing with it. */
export function KpiCard({
  kpi,
  accent,
  entered,
  delay,
}: {
  kpi: DashboardKpi;
  accent?: boolean;
  entered: boolean;
  delay: number;
}) {
  const up = (kpi.deltaPct ?? 0) >= 0;

  return (
    <div
      data-in={entered ? "true" : "false"}
      style={{ transitionDelay: `${delay}ms` }}
      className="dash-enter border-rule bg-sheet rounded-xl border p-4 shadow-[0_1px_2px_rgba(26,29,26,0.04)] transition-[transform,border-color,box-shadow] duration-150 ease-out hover:border-verify/40 hover:-translate-y-px hover:shadow-[0_8px_24px_-14px_rgba(26,29,26,0.22)]"
    >
      <dt className="text-muted-foreground text-xs font-medium">{kpi.label}</dt>
      <dd
        className={cn(
          "tabular mt-2 text-[2rem] leading-none",
          accent && "text-tier-high",
        )}
      >
        {kpi.value.toLocaleString()}
      </dd>
      <p className="mt-2.5 flex flex-wrap items-baseline gap-x-1.5 text-xs">
        {kpi.deltaPct === null ? (
          <span className="text-muted-foreground">{kpi.hint}</span>
        ) : (
          <>
            <span
              className={cn(
                "tabular font-medium",
                up ? "text-verify" : "text-destructive",
              )}
            >
              {up ? "▲" : "▼"} {Math.abs(kpi.deltaPct)}%
            </span>
            <span className="text-muted-foreground">vs last week</span>
          </>
        )}
      </p>
    </div>
  );
}
