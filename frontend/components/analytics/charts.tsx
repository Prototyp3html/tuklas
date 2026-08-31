"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { AnalyticsData } from "@/lib/mock-data";

const AXIS = {
  stroke: "var(--rule)",
  tick: { fill: "var(--muted-ink)", fontSize: 11 },
  tickLine: false,
  axisLine: false,
} as const;

type Tip = {
  active?: boolean;
  label?: string | number;
  payload?: { name?: string; value?: number; color?: string }[];
};

function ChartTooltip({ active, label, payload, suffix = "" }: Tip & { suffix?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="border-rule bg-sheet rounded-lg border px-2.5 py-1.5 text-xs shadow-[0_4px_16px_-8px_rgba(26,29,26,0.3)]">
      {label != null && (
        <p className="text-muted-foreground mb-1 font-medium">{label}</p>
      )}
      {payload.map((p, i) => (
        <p key={i} className="flex items-center gap-1.5">
          <span
            aria-hidden
            className="size-2 rounded-[2px]"
            style={{ background: p.color }}
          />
          <span className="text-muted-foreground capitalize">{p.name}</span>
          <span className="tabular text-foreground ml-auto font-medium">
            {p.value?.toLocaleString()}
            {suffix}
          </span>
        </p>
      ))}
    </div>
  );
}

export function OverTimeChart({ data }: { data: AnalyticsData["overTime"] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -12 }}>
        <defs>
          <linearGradient id="a-found" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--verify)" stopOpacity={0.16} />
            <stop offset="100%" stopColor="var(--verify)" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="a-qual" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--mark)" stopOpacity={0.16} />
            <stop offset="100%" stopColor="var(--mark)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="var(--rule)" strokeDasharray="2 4" />
        <XAxis dataKey="date" {...AXIS} interval="preserveStartEnd" />
        <YAxis {...AXIS} width={40} />
        <Tooltip
          content={<ChartTooltip />}
          cursor={{ stroke: "var(--rule)" }}
        />
        <Area
          type="monotone"
          dataKey="found"
          name="found"
          stroke="var(--verify)"
          strokeWidth={2}
          fill="url(#a-found)"
        />
        <Area
          type="monotone"
          dataKey="qualified"
          name="qualified"
          stroke="var(--mark)"
          strokeWidth={2}
          fill="url(#a-qual)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function ReplyRateChart({ data }: { data: AnalyticsData["replyRate"] }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -12 }}>
        <defs>
          <linearGradient id="a-reply" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--verify)" stopOpacity={0.18} />
            <stop offset="100%" stopColor="var(--verify)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="var(--rule)" strokeDasharray="2 4" />
        <XAxis dataKey="date" {...AXIS} interval="preserveStartEnd" />
        <YAxis {...AXIS} width={40} domain={[6, 15]} unit="%" />
        <Tooltip
          content={<ChartTooltip suffix="%" />}
          cursor={{ stroke: "var(--rule)" }}
        />
        <Area
          type="monotone"
          dataKey="rate"
          name="reply rate"
          stroke="var(--verify)"
          strokeWidth={2}
          fill="url(#a-reply)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function ServicesBars({
  data,
}: {
  data: AnalyticsData["byService"];
}) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 0, right: 12, bottom: 0, left: 0 }}
      >
        <CartesianGrid horizontal={false} stroke="var(--rule)" strokeDasharray="2 4" />
        <XAxis type="number" {...AXIS} />
        <YAxis
          type="category"
          dataKey="service"
          {...AXIS}
          width={110}
          tick={{ fill: "var(--ink)", fontSize: 12 }}
        />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--band)" }} />
        <Bar dataKey="count" name="opportunities" radius={[0, 4, 4, 0]} barSize={18}>
          {data.map((_, i) => (
            <Cell key={i} fill="var(--verify)" />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
