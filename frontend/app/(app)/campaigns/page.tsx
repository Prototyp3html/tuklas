import Link from "next/link";

import { CampaignsTable } from "@/components/campaigns/campaigns-table";
import { Button } from "@/components/ui/button";
import { CAMPAIGNS } from "@/lib/mock-data";

export default function CampaignsPage() {
  return (
    <div>
      <header className="border-rule flex flex-wrap items-end justify-between gap-4 border-b pb-5">
        <div>
          <h1 className="page-title text-2xl">Campaigns</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Every search you&apos;ve run, and how each one is converting.
          </p>
        </div>
        <Button render={<Link href="/campaigns/new" />}>New campaign</Button>
      </header>

      {CAMPAIGNS.length === 0 ? (
        <div className="border-rule bg-sheet mt-6 rounded-lg border px-6 py-12 text-center">
          <p className="text-sm">No campaigns yet.</p>
          <p className="text-muted-foreground mt-1 text-sm">
            Describe what you sell and where, and TUKLAS will go find
            businesses that need it.
          </p>
          <Button render={<Link href="/campaigns/new" />} className="mt-4">
            New campaign
          </Button>
        </div>
      ) : (
        <div className="mt-6">
          <CampaignsTable campaigns={CAMPAIGNS} />
        </div>
      )}
    </div>
  );
}
