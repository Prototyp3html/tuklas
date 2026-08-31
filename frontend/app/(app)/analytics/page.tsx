import { AnalyticsView } from "@/components/analytics/analytics-view";
import { ANALYTICS } from "@/lib/mock-data";

export default function AnalyticsPage() {
  return (
    <div>
      <header className="border-rule border-b pb-5">
        <h1 className="page-title text-2xl">Analytics</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          How opportunities move from found to replied, and which services
          convert.
        </p>
      </header>

      <AnalyticsView data={ANALYTICS} />
    </div>
  );
}
