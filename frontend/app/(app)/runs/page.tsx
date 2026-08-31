import Link from "next/link";

import { RunStatusBadge } from "@/components/runs/run-status";
import {
  formatDateTime,
  formatDuration,
  formatPesoPrecise,
} from "@/lib/format";
import { AGENT_RUNS } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const USD_TO_PHP = 58;

export default function RunsPage() {
  return (
    <div>
      <header className="border-rule border-b pb-5">
        <h1 className="page-title text-2xl">Agent runs</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Every stage of every campaign. Open a run to see the tool calls it
          made, what they returned, and what it cost.
        </p>
      </header>

      {AGENT_RUNS.length === 0 ? (
        <div className="border-rule bg-sheet mt-6 rounded-sm border px-6 py-12 text-center">
          <p className="text-sm">No runs yet.</p>
          <p className="text-muted-foreground mt-1 text-sm">
            Start a campaign and its stages will appear here as they execute.
          </p>
        </div>
      ) : (
        <ul className="border-rule bg-sheet divide-rule mt-6 divide-y overflow-hidden rounded-sm border">
          {AGENT_RUNS.map((run, i) => (
            <li key={run.id}>
              <Link
                href={`/runs/${run.id}`}
                className={cn(
                  "hover:bg-band/60 focus-visible:ring-ring grid grid-cols-2 gap-x-4 gap-y-1 px-3 py-3 transition-colors focus-visible:-outline-offset-2 focus-visible:ring-2 focus-visible:outline-none sm:grid-cols-[9rem_1fr_5rem_5rem_6rem] sm:items-center sm:px-4",
                  i % 2 === 1 && "bg-band/40",
                )}
              >
                <span className="tabular text-sm">{run.agent}</span>
                <span className="text-muted-foreground truncate text-xs sm:text-sm">
                  {run.campaignName}
                </span>
                <span className="tabular text-muted-foreground text-xs">
                  {run.businessCount} biz
                </span>
                <span className="tabular text-muted-foreground text-xs">
                  {run.durationMs === null
                    ? "—"
                    : formatDuration(run.durationMs)}
                </span>
                <span className="flex items-baseline justify-between gap-3 sm:flex-col sm:items-end sm:gap-0.5">
                  <RunStatusBadge status={run.status} />
                  <span className="tabular text-muted-foreground text-xs">
                    {run.costUsd === 0
                      ? "₱0"
                      : formatPesoPrecise(run.costUsd * USD_TO_PHP)}
                  </span>
                </span>
                <span className="tabular text-muted-foreground col-span-2 text-xs sm:hidden">
                  {formatDateTime(run.startedAt)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <p className="text-muted-foreground mt-3 text-xs">
        Tool calls and outcomes only. Model reasoning is never logged or shown.
      </p>
    </div>
  );
}
