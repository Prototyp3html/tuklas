import type { LeadStatus } from "@/lib/types";

/** The pipeline a lead moves through, in order. */
export const LEAD_STATUSES: LeadStatus[] = [
  "new",
  "contacted",
  "replied",
  "meeting",
  "proposal",
  "won",
  "lost",
];

export const STATUS_LABEL: Record<LeadStatus, string> = {
  new: "New",
  contacted: "Contacted",
  replied: "Replied",
  meeting: "Meeting",
  proposal: "Proposal",
  won: "Won",
  lost: "Lost",
};

/**
 * Only `won` earns colour — it is the one status that is an outcome rather
 * than a step. Everything else stays neutral so the score keeps the attention.
 */
export function statusClass(status: LeadStatus): string {
  if (status === "won") return "text-verify border-verify/40";
  if (status === "lost") return "text-muted-foreground border-rule opacity-70";
  return "text-muted-foreground border-rule";
}
