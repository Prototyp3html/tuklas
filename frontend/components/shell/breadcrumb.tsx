"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";

import { CAMPAIGNS, LEADS, AGENT_RUNS } from "@/lib/mock-data";

const STATIC_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  campaigns: "Campaigns",
  leads: "Leads",
  outreach: "Outreach",
  analytics: "Analytics",
  favorites: "Favorites",
  lists: "Lists",
  runs: "Agent runs",
  settings: "Settings",
  new: "New campaign",
  run: "Running",
};

/**
 * Resolves a dynamic segment to something a person recognises — a business
 * name rather than a slug. Falls back to the raw segment so an unknown id
 * still renders a usable trail.
 */
function labelFor(segment: string, parent: string | undefined): string {
  if (STATIC_LABELS[segment]) return STATIC_LABELS[segment];

  if (parent === "leads") {
    const lead = LEADS.find((l) => l.id === segment);
    if (lead) return lead.businessName;
  }
  if (parent === "campaigns") {
    const campaign = CAMPAIGNS.find((c) => c.id === segment);
    if (campaign) return campaign.name;
  }
  if (parent === "runs") {
    const run = AGENT_RUNS.find((r) => r.id === segment);
    if (run) return `${run.agent} run`;
  }
  return segment;
}

/** Every crumb links except the current page. */
export function Breadcrumb() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) return null;

  const crumbs = segments.map((segment, i) => ({
    label: labelFor(segment, segments[i - 1]),
    href: "/" + segments.slice(0, i + 1).join("/"),
    last: i === segments.length - 1,
  }));

  return (
    <nav aria-label="Breadcrumb" className="min-w-0">
      <ol className="flex items-center gap-1 text-sm">
        {crumbs.map((crumb) => (
          <li key={crumb.href} className="flex min-w-0 items-center gap-1">
            {crumb.last ? (
              <span aria-current="page" className="truncate">
                {crumb.label}
              </span>
            ) : (
              <>
                <Link
                  href={crumb.href}
                  className="text-muted-foreground hover:text-foreground focus-visible:ring-ring shrink-0 rounded-xs transition-colors focus-visible:ring-2 focus-visible:outline-none"
                >
                  {crumb.label}
                </Link>
                <ChevronRight
                  aria-hidden
                  className="text-muted-foreground size-3.5 shrink-0"
                />
              </>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
