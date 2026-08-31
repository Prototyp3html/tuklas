import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function FavoritesPage() {
  return (
    <div>
      <header className="border-rule border-b pb-5">
        <h1 className="page-title text-2xl">Favorites</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          The leads you&apos;ve pinned, in one place.
        </p>
      </header>

      <div className="border-rule bg-sheet mt-6 rounded-lg border px-6 py-14 text-center">
        <p className="text-sm">Nothing pinned yet.</p>
        <p className="text-muted-foreground mx-auto mt-1 max-w-sm text-sm">
          Open a lead&apos;s dossier and bookmark it — the ones you want to
          come back to will collect here.
        </p>
        <Button render={<Link href="/leads" />} className="mt-4">
          Browse leads
        </Button>
      </div>
    </div>
  );
}
