import type { LeadStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { STATUS_LABEL, statusClass } from "./status";

export function StatusBadge({
  status,
  className,
}: {
  status: LeadStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-xs border px-1.5 py-0.5 text-xs whitespace-nowrap",
        statusClass(status),
        className,
      )}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}
