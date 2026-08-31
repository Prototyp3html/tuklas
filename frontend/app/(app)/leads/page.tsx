import { Suspense } from "react";

import { LeadsTable } from "@/components/leads/leads-table";
import { Skeleton } from "@/components/ui/skeleton";
import { LEAD_SUMMARIES } from "@/lib/mock-data";

export default function LeadsPage() {
  return (
    <div>
      <header className="border-rule border-b pb-5">
        <h1 className="page-title text-2xl">Leads</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Every business your campaigns qualified, ranked by what the evidence
          adds up to.
        </p>
      </header>

      <div className="mt-6">
        <Suspense fallback={<Skeleton className="h-96 w-full rounded-lg" />}>
          <LeadsTable leads={LEAD_SUMMARIES} />
        </Suspense>
      </div>
    </div>
  );
}
