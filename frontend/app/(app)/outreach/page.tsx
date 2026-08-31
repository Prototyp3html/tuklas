import { OutreachView } from "@/components/outreach/outreach-view";
import { OUTREACH_THREADS } from "@/lib/mock-data";

export default function OutreachPage() {
  return (
    <div>
      <header className="border-rule border-b pb-5">
        <h1 className="page-title text-2xl">Outreach</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Every draft and conversation across your campaigns. Messages are
          written from evidence — you send them yourself.
        </p>
      </header>

      <div className="mt-6">
        <OutreachView threads={OUTREACH_THREADS} />
      </div>
    </div>
  );
}
