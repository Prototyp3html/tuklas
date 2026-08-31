import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function ListsPage() {
  return (
    <div>
      <header className="border-rule border-b pb-5">
        <h1 className="page-title text-2xl">Lists</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Group leads into shortlists you can work through and share.
        </p>
      </header>

      <div className="border-rule bg-sheet mt-6 rounded-lg border px-6 py-14 text-center">
        <p className="text-sm">No lists yet.</p>
        <p className="text-muted-foreground mx-auto mt-1 max-w-sm text-sm">
          Make a list to organise leads by neighbourhood, service, or how
          close they are to a call.
        </p>
        <Button render={<Link href="/leads" />} className="mt-4">
          Browse leads
        </Button>
      </div>
    </div>
  );
}
