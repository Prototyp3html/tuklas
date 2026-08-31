"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { X } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { tierClass } from "@/lib/format";
import type { LeadSummary } from "@/lib/types";
import { cn } from "@/lib/utils";
import { StatusBadge } from "./status-badge";
import { LEAD_STATUSES, STATUS_LABEL } from "./status";

const SCORE_FILTERS = {
  all: "Any score",
  high: "80 and above",
  mid: "60 to 79",
  low: "Below 60",
} as const;

const WEBSITE_FILTERS = {
  all: "Website, any",
  no: "No website",
  yes: "Has a website",
} as const;

type ScoreFilter = keyof typeof SCORE_FILTERS;
type WebsiteFilter = keyof typeof WEBSITE_FILTERS;

function FilterSelect<T extends string>({
  value,
  onChange,
  options,
  label,
}: {
  value: T;
  onChange: (v: T) => void;
  options: Record<string, string>;
  label: string;
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as T)}>
      <SelectTrigger size="sm" aria-label={label}>
        <span className="text-sm">{options[value]}</span>
      </SelectTrigger>
      <SelectContent>
        {Object.entries(options).map(([v, l]) => (
          <SelectItem key={v} value={v}>
            {l}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function LeadsTable({ leads }: { leads: LeadSummary[] }) {
  const router = useRouter();
  const query = (useSearchParams().get("q") ?? "").trim();
  const [score, setScore] = useState<ScoreFilter>("all");
  const [status, setStatus] = useState<string>("all");
  const [category, setCategory] = useState<string>("all");
  const [website, setWebsite] = useState<WebsiteFilter>("all");

  const categories = useMemo(() => {
    const map: Record<string, string> = { all: "All industries" };
    for (const l of leads) map[l.category] = l.category;
    return map;
  }, [leads]);

  const statuses = useMemo(() => {
    const map: Record<string, string> = { all: "Any status" };
    for (const s of LEAD_STATUSES) map[s] = STATUS_LABEL[s];
    return map;
  }, []);

  const rows = useMemo(() => {
    const q = query.toLowerCase();
    return leads
      .filter((l) => q === "" || l.businessName.toLowerCase().includes(q))
      .filter((l) => score === "all" || l.tier === score)
      .filter((l) => status === "all" || l.status === status)
      .filter((l) => category === "all" || l.category === category)
      .filter(
        (l) =>
          website === "all" ||
          (website === "yes" ? l.hasWebsite : !l.hasWebsite),
      )
      .sort((a, b) => b.score - a.score);
  }, [leads, query, score, status, category, website]);

  return (
    <div>
      {query && (
        <div className="mb-3 flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">
            Filtered by <span className="text-foreground">“{query}”</span>
          </span>
          <Link
            href="/leads"
            className="hover:bg-band focus-visible:ring-ring inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs transition-colors focus-visible:ring-2 focus-visible:outline-none"
          >
            <X aria-hidden className="size-3" />
            Clear
          </Link>
        </div>
      )}

      <div className="mb-4 flex flex-wrap gap-2">
        <FilterSelect
          value={score}
          onChange={setScore}
          options={SCORE_FILTERS}
          label="Filter by score"
        />
        <FilterSelect
          value={status}
          onChange={setStatus}
          options={statuses}
          label="Filter by status"
        />
        <FilterSelect
          value={category}
          onChange={setCategory}
          options={categories}
          label="Filter by industry"
        />
        <FilterSelect
          value={website}
          onChange={setWebsite}
          options={WEBSITE_FILTERS}
          label="Filter by website"
        />
      </div>

      {rows.length === 0 ? (
        <div className="border-rule bg-sheet rounded-sm border px-6 py-12 text-center">
          <p className="text-sm">No leads match these filters.</p>
          <p className="text-muted-foreground mt-1 text-sm">
            Widen the score range or clear the industry filter to see more.
          </p>
        </div>
      ) : (
        <div className="border-rule bg-sheet overflow-hidden rounded-sm border">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-muted-foreground text-xs font-medium">
                  Business
                </TableHead>
                <TableHead className="text-muted-foreground hidden text-xs font-medium sm:table-cell">
                  Industry
                </TableHead>
                <TableHead className="text-muted-foreground hidden text-xs font-medium md:table-cell">
                  Status
                </TableHead>
                <TableHead className="text-muted-foreground hidden text-right text-xs font-medium sm:table-cell">
                  Evidence
                </TableHead>
                <TableHead className="text-muted-foreground text-right text-xs font-medium">
                  Score
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((lead, i) => (
                <TableRow
                  key={lead.id}
                  onClick={() => router.push(`/leads/${lead.id}`)}
                  className={cn(
                    "cursor-pointer",
                    i % 2 === 1 && "bg-band/50",
                  )}
                >
                  <TableCell className="py-2.5">
                    <Link
                      href={`/leads/${lead.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="focus-visible:ring-ring rounded-xs font-medium focus-visible:ring-2 focus-visible:outline-none"
                    >
                      {lead.businessName}
                    </Link>
                    <p className="text-muted-foreground mt-0.5 text-xs">
                      {lead.location}
                    </p>
                  </TableCell>
                  <TableCell className="text-muted-foreground hidden text-sm sm:table-cell">
                    {lead.category}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <StatusBadge status={lead.status} />
                  </TableCell>
                  <TableCell className="tabular text-muted-foreground hidden text-right text-sm sm:table-cell">
                    {lead.evidenceCount}
                  </TableCell>
                  <TableCell
                    className={cn(
                      "tabular text-right text-base",
                      tierClass(lead.tier),
                    )}
                  >
                    {lead.score}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <p className="text-muted-foreground mt-3 text-xs">
        Showing {rows.length} of {leads.length} leads, highest score first.
      </p>
    </div>
  );
}
