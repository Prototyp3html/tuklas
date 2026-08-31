import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { formatPeso } from "@/lib/format";
import type { AnalyticsData, AnalyticsStat } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { OverTimeChart, ReplyRateChart, ServicesBars } from "./charts";

function formatStat(stat: AnalyticsStat): string {
  if (stat.format === "peso") return formatPeso(stat.value);
  if (stat.format === "percent") return `${stat.value}%`;
  return stat.value.toLocaleString();
}

function StatCard({ stat }: { stat: AnalyticsStat }) {
  const up = stat.deltaPct >= 0;
  return (
    <div className="border-rule bg-sheet rounded-xl border p-4 shadow-[0_1px_2px_rgba(26,29,26,0.04)]">
      <p className="text-muted-foreground text-xs font-medium">{stat.label}</p>
      <p className="tabular mt-1.5 text-[1.75rem] leading-none">
        {formatStat(stat)}
      </p>
      <p
        className={cn(
          "tabular mt-2 text-xs font-medium",
          up ? "text-verify" : "text-destructive",
        )}
      >
        {up ? "▲" : "▼"} {Math.abs(stat.deltaPct)}%
      </p>
    </div>
  );
}

function ChartCard({
  title,
  legend,
  children,
}: {
  title: string;
  legend?: { label: string; color: string }[];
  children: React.ReactNode;
}) {
  return (
    <section className="border-rule bg-sheet rounded-xl border p-5 shadow-[0_1px_2px_rgba(26,29,26,0.04)]">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-[0.95rem] font-semibold tracking-tight">{title}</h2>
        {legend && (
          <ul className="flex flex-wrap gap-x-4 gap-y-1">
            {legend.map((l) => (
              <li
                key={l.label}
                className="text-muted-foreground flex items-center gap-1.5 text-xs"
              >
                <span
                  aria-hidden
                  className="size-2 rounded-[2px]"
                  style={{ background: l.color }}
                />
                {l.label}
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function AnalyticsView({ data }: { data: AnalyticsData }) {
  const total = data.byService.reduce((s, x) => s + x.count, 0);
  const replyNow = data.replyRate[data.replyRate.length - 1].rate;

  return (
    <div className="mt-6 space-y-6">
      <div className="flex items-center justify-end">
        <Select defaultValue="12w">
          <SelectTrigger size="sm">
            <span className="text-sm">{data.rangeLabel}</span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="4w">Last 4 weeks</SelectItem>
            <SelectItem value="12w">Last 12 weeks</SelectItem>
            <SelectItem value="all">All time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {data.stats.map((stat) => (
          <StatCard key={stat.key} stat={stat} />
        ))}
      </dl>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          title="Opportunities over time"
          legend={[
            { label: "Found", color: "var(--verify)" },
            { label: "Qualified", color: "var(--mark)" },
          ]}
        >
          <OverTimeChart data={data.overTime} />
        </ChartCard>

        <ChartCard title="Top service opportunities">
          <p className="text-muted-foreground -mt-1 mb-2 text-xs">
            <span className="tabular text-foreground text-lg font-medium">
              {total.toLocaleString()}
            </span>{" "}
            opportunities across four service types
          </p>
          <ServicesBars data={data.byService} />
        </ChartCard>
      </div>

      <ChartCard title="Reply rate over time">
        <p className="text-muted-foreground -mt-1 mb-2 text-xs">
          <span className="tabular text-verify text-2xl font-medium">
            {replyNow}%
          </span>{" "}
          this week
        </p>
        <ReplyRateChart data={data.replyRate} />
      </ChartCard>

      <p className="text-muted-foreground text-xs">
        Illustrative — real figures appear once outreach outcomes accumulate.
      </p>
    </div>
  );
}
