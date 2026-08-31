"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatShortDate } from "@/lib/format";
import type { Campaign, CampaignStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<CampaignStatus, string> = {
  draft: "Draft",
  running: "Active",
  complete: "Complete",
  failed: "Failed",
};

function statusClass(status: CampaignStatus): string {
  if (status === "running") return "bg-tier-high/10 text-tier-high";
  if (status === "complete") return "bg-verify/10 text-verify";
  if (status === "failed") return "bg-destructive/10 text-destructive";
  return "bg-band text-muted-foreground";
}

const FILTERS = [
  { key: "all", label: "All campaigns" },
  { key: "running", label: "Active" },
  { key: "complete", label: "Complete" },
  { key: "failed", label: "Failed" },
] as const;

type FilterKey = (typeof FILTERS)[number]["key"];

export function CampaignsTable({ campaigns }: { campaigns: Campaign[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState<FilterKey>("all");

  const rows = useMemo(
    () =>
      filter === "all"
        ? campaigns
        : campaigns.filter((c) => c.status === filter),
    [campaigns, filter],
  );

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-1">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            aria-pressed={filter === f.key}
            className={cn(
              "focus-visible:ring-ring rounded-lg px-3 py-1.5 text-sm transition-colors duration-150 focus-visible:ring-2 focus-visible:outline-none",
              filter === f.key
                ? "bg-band text-foreground font-medium"
                : "text-muted-foreground hover:bg-band/60 hover:text-foreground",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {rows.length === 0 ? (
        <div className="border-rule bg-sheet rounded-lg border px-6 py-12 text-center">
          <p className="text-sm">No {filter === "all" ? "" : filter} campaigns.</p>
        </div>
      ) : (
        <div className="border-rule bg-sheet overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-muted-foreground text-xs font-medium">
                  Campaign
                </TableHead>
                <TableHead className="text-muted-foreground hidden text-xs font-medium lg:table-cell">
                  Audience
                </TableHead>
                <TableHead className="text-muted-foreground hidden text-right text-xs font-medium sm:table-cell">
                  Leads
                </TableHead>
                <TableHead className="text-muted-foreground text-right text-xs font-medium">
                  Qualified
                </TableHead>
                <TableHead className="text-muted-foreground hidden text-right text-xs font-medium md:table-cell">
                  Reply rate
                </TableHead>
                <TableHead className="text-muted-foreground text-xs font-medium">
                  Status
                </TableHead>
                <TableHead className="text-muted-foreground hidden text-right text-xs font-medium sm:table-cell">
                  Started
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((c) => (
                <TableRow
                  key={c.id}
                  onClick={() => router.push(`/campaigns/${c.id}`)}
                  className="cursor-pointer"
                >
                  <TableCell className="py-3">
                    <Link
                      href={`/campaigns/${c.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="focus-visible:ring-ring rounded-xs font-medium focus-visible:ring-2 focus-visible:outline-none"
                    >
                      {c.name}
                    </Link>
                    <p className="text-muted-foreground mt-0.5 text-xs lg:hidden">
                      {c.industries.join(", ")}
                    </p>
                  </TableCell>
                  <TableCell className="text-muted-foreground hidden text-sm lg:table-cell">
                    {c.industries.join(", ")}
                  </TableCell>
                  <TableCell className="tabular text-muted-foreground hidden text-right text-sm sm:table-cell">
                    {c.leadCount}
                  </TableCell>
                  <TableCell className="tabular text-right text-sm">
                    {c.qualifiedCount}
                  </TableCell>
                  <TableCell className="tabular text-muted-foreground hidden text-right text-sm md:table-cell">
                    {c.replyRate > 0
                      ? `${(c.replyRate * 100).toFixed(1)}%`
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
                        statusClass(c.status),
                      )}
                    >
                      {STATUS_LABEL[c.status]}
                    </span>
                  </TableCell>
                  <TableCell className="tabular text-muted-foreground hidden text-right text-sm sm:table-cell">
                    {formatShortDate(c.createdAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
