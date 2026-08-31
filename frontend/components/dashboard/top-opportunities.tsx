import Link from "next/link";
import { ChevronRight } from "lucide-react";

import type { ScoreTier } from "@/lib/types";
import { ScoreRing } from "./score-ring";
import { SectionHeading } from "./section-heading";

export type TopLead = {
  id: string;
  businessName: string;
  service: string;
  score: number;
  tier: ScoreTier;
};

/** The leads worth opening first, by score. The ring reads before the name. */
export function TopOpportunities({
  leads,
  entered,
}: {
  leads: TopLead[];
  entered: boolean;
}) {
  return (
    <section className="border-rule bg-sheet h-full rounded-xl border p-5 shadow-[0_1px_2px_rgba(26,29,26,0.04)]">
      <SectionHeading
        title="Top opportunities"
        action={{ label: "View all", href: "/leads" }}
      />
      <ol className="divide-rule -my-1 divide-y">
        {leads.map((lead, i) => (
          <li
            key={lead.id}
            data-in={entered ? "true" : "false"}
            style={{ transitionDelay: `${i * 45}ms` }}
            className="dash-enter"
          >
            <Link
              href={`/leads/${lead.id}`}
              className="hover:bg-band/40 focus-visible:ring-ring -mx-2 flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors duration-150 focus-visible:-outline-offset-2 focus-visible:ring-2 focus-visible:outline-none"
            >
              <ScoreRing
                score={lead.score}
                tier={lead.tier}
                entered={entered}
                delay={i * 55 + 140}
                size={40}
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">
                  {lead.businessName}
                </span>
                <span className="text-muted-foreground block truncate text-xs">
                  {lead.service}
                </span>
              </span>
              <ChevronRight
                aria-hidden
                className="text-muted-foreground size-4 shrink-0"
              />
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
