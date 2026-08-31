"use client";

import { useState } from "react";

import type { ActivityEvent, DashboardSnapshot, DateRange } from "@/lib/types";
import { ActivityFeed } from "./activity-feed";
import { useEntered } from "./hooks";
import { KpiCard } from "./kpi-card";
import { OpportunityFunnel } from "./opportunity-funnel";
import { RangeToggle } from "./range-toggle";
import { TopOpportunities, type TopLead } from "./top-opportunities";

const KPI_KEYS = ["scanned", "qualified", "highPriority", "replies"] as const;

export function DashboardView({
  greeting,
  snapshots,
  topLeads,
  activity,
  now,
  runningCampaigns,
}: {
  greeting: string;
  snapshots: Record<DateRange, DashboardSnapshot>;
  topLeads: TopLead[];
  activity: ActivityEvent[];
  now: number;
  runningCampaigns: number;
}) {
  const entered = useEntered();
  const [range, setRange] = useState<DateRange>("week");
  const snapshot = snapshots[range];
  const kpis = KPI_KEYS.map(
    (key) => snapshot.kpis.find((k) => k.key === key)!,
  ).filter(Boolean);

  const qualified =
    snapshot.kpis.find((k) => k.key === "qualified")?.value ?? 0;
  const campaignPart =
    runningCampaigns > 0
      ? `${runningCampaigns} campaign${runningCampaigns === 1 ? "" : "s"} running`
      : "No campaigns running";
  const subtitle = `${campaignPart} · ${qualified.toLocaleString()} opportunities found ${
    range === "week" ? "this week" : "all-time"
  }`;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="page-title text-2xl">{greeting}</h1>
          <p className="text-muted-foreground mt-1.5 text-sm">{subtitle}</p>
        </div>
        <RangeToggle value={range} onChange={setRange} />
      </header>

      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map((kpi, i) => (
          <KpiCard
            key={kpi.key}
            kpi={kpi}
            accent={kpi.key === "highPriority"}
            entered={entered}
            delay={i * 45}
          />
        ))}
      </dl>

      <div className="grid items-start gap-4 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <OpportunityFunnel
            stages={snapshot.funnel}
            rangeLabel={range === "week" ? "This week" : "All time"}
            entered={entered}
          />
        </div>
        <div className="lg:col-span-4">
          <TopOpportunities leads={topLeads} entered={entered} />
        </div>
        <div className="lg:col-span-3">
          <ActivityFeed events={activity} now={now} entered={entered} />
        </div>
      </div>
    </div>
  );
}
