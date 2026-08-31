import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { EvidenceLedger } from "@/components/evidence/evidence-ledger";
import { OutreachDialog } from "@/components/leads/outreach-dialog";
import { StatusSelect } from "@/components/leads/status-select";
import { getDrafts, getLead } from "@/lib/mock-data";

export default async function LeadDetailPage({
  params,
}: PageProps<"/leads/[id]">) {
  const { id } = await params;
  const lead = getLead(id);
  if (!lead) notFound();

  const drafts = getDrafts(lead);

  return (
    <div>
      <Link
        href="/leads"
        className="text-muted-foreground hover:text-foreground focus-visible:ring-ring inline-flex items-center gap-1.5 rounded-xs text-sm transition-colors duration-150 focus-visible:ring-2 focus-visible:outline-none"
      >
        <ArrowLeft aria-hidden className="size-3.5" />
        All leads
      </Link>

      <header className="border-rule mt-4 border-b pb-5">
        {/* Tracking eases off as the size goes up — 0.08em reads as spaced at
            list sizes and as gappy at display sizes. */}
        <h1 className="record-heading text-xl leading-tight tracking-[0.05em] text-balance sm:text-2xl md:text-3xl">
          {lead.businessName}
        </h1>
        <p className="text-muted-foreground mt-2 text-sm">
          {lead.category} · {lead.address}
        </p>
        {lead.phone && (
          <p className="tabular text-muted-foreground mt-1 text-xs">
            {lead.phone}
          </p>
        )}
      </header>

      {/* Evidence takes the width; the model's interpretation sits beside it,
          subordinate. Agents 1-3 observed the ledger; only the rail is a guess. */}
      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        <EvidenceLedger evidence={lead.evidence} />

        <aside className="flex flex-col gap-5 lg:sticky lg:top-6">
          <div className="border-rule bg-sheet rounded-sm border p-4">
            <h2 className="text-muted-foreground text-xs tracking-[0.14em] uppercase">
              Recommended
            </h2>
            <p className="mt-2 text-sm font-medium">
              {lead.recommendedService}
            </p>

            <h2 className="text-muted-foreground mt-5 text-xs tracking-[0.14em] uppercase">
              Sales angle
            </h2>
            <p className="mt-2 text-sm leading-6">{lead.salesAngle}</p>

            <p className="text-muted-foreground border-rule mt-4 border-t pt-3 text-xs leading-5">
              Written by the model from the evidence on the left.{" "}
              <span className="tabular">
                Confidence {lead.confidence.toFixed(2)}
              </span>
              .
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <OutreachDialog businessName={lead.businessName} drafts={drafts} />
            <div>
              <label
                htmlFor="lead-status"
                className="text-muted-foreground mb-1.5 block text-xs tracking-[0.14em] uppercase"
              >
                Status
              </label>
              <StatusSelect initial={lead.status} />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
