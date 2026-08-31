import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { RunStatusBadge } from "@/components/runs/run-status";
import {
  formatDateTime,
  formatDuration,
  formatPesoPrecise,
} from "@/lib/format";
import { getRun } from "@/lib/mock-data";

const USD_TO_PHP = 58;

/**
 * The most granular view in the product. Deliberately technical — this is a
 * log and it is allowed to look like one. Tool calls and decisions only;
 * model chain-of-thought is never recorded or rendered.
 */
export default async function RunDetailPage({
  params,
}: PageProps<"/runs/[id]">) {
  const { id } = await params;
  const run = getRun(id);
  if (!run) notFound();

  return (
    <div>
      <Link
        href="/runs"
        className="text-muted-foreground hover:text-foreground focus-visible:ring-ring inline-flex items-center gap-1.5 rounded-xs text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none"
      >
        <ArrowLeft aria-hidden className="size-3.5" />
        All runs
      </Link>

      <header className="border-rule mt-4 border-b pb-5">
        <h1 className="page-title text-xl">
          {run.agent} run
        </h1>
        <p className="tabular text-muted-foreground mt-2 text-xs">
          {run.id} · {run.campaignName}
        </p>

        <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 text-xs sm:grid-cols-4">
          <div>
            <dt className="text-muted-foreground">Status</dt>
            <dd className="mt-1">
              <RunStatusBadge status={run.status} />
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Businesses</dt>
            <dd className="tabular mt-1 text-sm">{run.businessCount}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Duration</dt>
            <dd className="tabular mt-1 text-sm">
              {run.durationMs === null ? "—" : formatDuration(run.durationMs)}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">AI cost</dt>
            <dd className="tabular mt-1 text-sm">
              {run.costUsd === 0
                ? "₱0"
                : formatPesoPrecise(run.costUsd * USD_TO_PHP)}
            </dd>
          </div>
        </dl>

        <p className="tabular text-muted-foreground mt-4 text-xs">
          started {formatDateTime(run.startedAt)}
          {run.endedAt && <> · ended {formatDateTime(run.endedAt)}</>}
        </p>
      </header>

      <section className="mt-6">
        <h2 className="text-muted-foreground text-xs tracking-[0.14em] uppercase">
          Tool calls
        </h2>

        {run.toolCalls.length === 0 ? (
          <p className="text-muted-foreground mt-3 text-sm">
            No tool calls recorded yet. They appear here as the stage executes.
          </p>
        ) : (
          <ol className="mt-3 flex flex-col gap-2">
            {run.toolCalls.map((call) => (
              <li
                key={call.id}
                className="border-rule bg-sheet rounded-sm border p-3"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <span className="tabular text-sm font-medium">
                    {call.tool}
                  </span>
                  <span className="tabular text-muted-foreground shrink-0 text-xs">
                    {formatDuration(call.ms)}
                  </span>
                </div>
                <dl className="mt-2 grid gap-2 text-xs sm:grid-cols-2">
                  <div className="min-w-0">
                    <dt className="text-muted-foreground">in</dt>
                    <dd className="tabular bg-band/50 mt-1 overflow-x-auto rounded-xs p-2 break-words">
                      {JSON.stringify(call.input, null, 1)}
                    </dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="text-muted-foreground">out</dt>
                    <dd className="tabular bg-band/50 mt-1 overflow-x-auto rounded-xs p-2 break-words">
                      {JSON.stringify(call.output, null, 1)}
                    </dd>
                  </div>
                </dl>
              </li>
            ))}
          </ol>
        )}
      </section>

      {run.errors.length > 0 && (
        <section className="mt-6">
          <h2 className="text-muted-foreground text-xs tracking-[0.14em] uppercase">
            Errors
          </h2>
          <div className="mt-3 flex flex-col gap-2">
            {run.errors.map((err, i) => (
              <div
                key={i}
                className="border-destructive/40 bg-destructive/5 rounded-sm border p-3"
              >
                <p className="tabular text-destructive text-xs font-medium">
                  {err.errorType}
                </p>
                <p className="mt-1.5 text-sm">{err.message}</p>
                {err.traceback && (
                  <pre className="tabular text-muted-foreground mt-2 overflow-x-auto text-[0.6875rem] leading-5">
                    {err.traceback}
                  </pre>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
