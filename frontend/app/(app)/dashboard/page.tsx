import { DashboardView } from "@/components/dashboard/dashboard-view";
import { CAMPAIGNS, DASHBOARD_ACTIVITY, DASHBOARD_SNAPSHOTS, LEADS } from "@/lib/mock-data";

const NOW = new Date("2026-08-31T12:00:00+08:00").getTime();

function greetingFor(now: number): string {
  const hour = (new Date(now).getUTCHours() + 8) % 24;
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default function DashboardPage() {
  const runningCampaigns = CAMPAIGNS.filter(
    (c) => c.status === "running",
  ).length;

  const topLeads = LEADS.slice(0, 6).map((lead) => ({
    id: lead.id,
    businessName: lead.businessName,
    service: lead.recommendedService,
    score: lead.score,
    tier: lead.tier,
  }));

  return (
    <DashboardView
      greeting={greetingFor(NOW)}
      snapshots={DASHBOARD_SNAPSHOTS}
      topLeads={topLeads}
      activity={DASHBOARD_ACTIVITY}
      now={NOW}
      runningCampaigns={runningCampaigns}
    />
  );
}
