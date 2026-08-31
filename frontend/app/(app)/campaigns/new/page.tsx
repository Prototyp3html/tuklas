import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { NewCampaignForm } from "@/components/campaigns/new-campaign-form";

export default function NewCampaignPage() {
  return (
    <div className="mx-auto w-full max-w-[900px]">
      <Link
        href="/campaigns"
        className="text-muted-foreground hover:text-foreground -ml-1 inline-flex items-center gap-1 text-xs"
      >
        <ArrowLeft aria-hidden className="size-3.5" />
        Campaigns
      </Link>

      <header className="mt-2 mb-8">
        <h1 className="page-title text-2xl">New campaign</h1>
        <p className="text-muted-foreground mt-2 max-w-lg text-sm leading-6">
          Four answers. TUKLAS walks the local listings, checks what each
          business already has online, and comes back with the ones missing
          what you sell.
        </p>
      </header>

      <NewCampaignForm />
    </div>
  );
}
