import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { FunnelProgress } from "@/components/campaigns/funnel-progress";
import { Button } from "@/components/ui/button";
import { formatDateTime, formatPeso } from "@/lib/format";
import { CAMPAIGN_PROGRESS, getCampaign } from "@/lib/mock-data";

export default async function CampaignDetailPage({
  params,
}: PageProps<"/campaigns/[id]">) {
  const { id } = await params;
  const campaign = getCampaign(id);
  if (!campaign) notFound();

  const progress = CAMPAIGN_PROGRESS[id];
  const running = campaign.status === "running";

  return (
    <div>
      <Link
        href="/campaigns"
        className="text-muted-foreground hover:text-foreground focus-visible:ring-ring inline-flex items-center gap-1.5 rounded-xs text-sm transition-colors duration-150 focus-visible:ring-2 focus-visible:outline-none"
      >
        <ArrowLeft aria-hidden className="size-3.5" />
        All campaigns
      </Link>

      <header className="border-rule mt-4 border-b pb-5">
        <h1 className="page-title text-2xl">{campaign.name}</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          {campaign.service} · {campaign.location} ·{" "}
          {formatPeso(campaign.budgetMin)} and up
        </p>
      </header>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
        <section className="border-rule bg-sheet rounded-sm border p-4 sm:p-6">
          <h2 className="text-muted-foreground text-xs tracking-[0.14em] uppercase">
            {running ? "Finding opportunities" : "How this run narrowed"}
          </h2>
          <p className="text-muted-foreground mt-2 mb-6 text-sm">
            Each stage throws work away so the next one costs less. Only what
            survives the cheap checks reaches a model.
          </p>

          {progress ? (
            <FunnelProgress progress={progress} />
          ) : campaign.status === "failed" ? (
            <div>
              <p className="text-sm">
                Discovery stopped — Google Maps rate-limited us at 47
                businesses. Those 47 are saved.
              </p>
              <p className="text-muted-foreground mt-2 text-sm">
                Retry in a few minutes, or narrow the location to reduce the
                number of requests.
              </p>
              <Button variant="outline" className="mt-4">
                Retry discovery
              </Button>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">
              This campaign hasn&apos;t started. Run it to begin discovery.
            </p>
          )}
        </section>

        <aside className="flex flex-col gap-4">
          <div className="border-rule bg-sheet rounded-sm border p-4">
            <dl className="flex flex-col gap-3 text-sm">
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-muted-foreground">Businesses kept</dt>
                <dd className="tabular">{campaign.leadCount}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-muted-foreground">Qualified</dt>
                <dd className="tabular text-gap">{campaign.qualifiedCount}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-muted-foreground">Started</dt>
                <dd className="tabular text-xs">
                  {formatDateTime(campaign.createdAt)}
                </dd>
              </div>
            </dl>
          </div>

          {campaign.qualifiedCount > 0 && (
            <Button render={<Link href="/leads" />}>
              See {campaign.qualifiedCount} qualified leads
            </Button>
          )}

          {/* /runs is not in the sidebar (Part 5's six items), so campaigns
              are how you reach observability. */}
          <Link
            href="/runs"
            className="text-muted-foreground hover:text-foreground focus-visible:ring-ring rounded-xs text-center text-sm underline underline-offset-2 transition-colors focus-visible:ring-2 focus-visible:outline-none"
          >
            Inspect the agent runs
          </Link>
        </aside>
      </div>
    </div>
  );
}
