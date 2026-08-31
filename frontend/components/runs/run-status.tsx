import type { RunStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

export const RUN_STATUS_LABEL: Record<RunStatus, string> = {
  queued: "Queued",
  running: "Running",
  succeeded: "Succeeded",
  failed: "Failed",
};

/** Text marks, not icons — same reasoning as the evidence ✓/✗. */
export const RUN_STATUS_MARK: Record<RunStatus, string> = {
  queued: "·",
  running: "▸",
  succeeded: "✓",
  failed: "✗",
};

export function runStatusClass(status: RunStatus): string {
  if (status === "failed") return "text-destructive";
  if (status === "succeeded") return "text-verify";
  if (status === "running") return "text-gap";
  return "text-muted-foreground";
}

export function RunStatusBadge({ status }: { status: RunStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs whitespace-nowrap",
        runStatusClass(status),
      )}
    >
      <span aria-hidden className="tabular">
        {RUN_STATUS_MARK[status]}
      </span>
      {RUN_STATUS_LABEL[status]}
    </span>
  );
}
