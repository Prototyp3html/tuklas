"use client";

import { Radar, Reply, ScanSearch, Trophy } from "lucide-react";
import { type LucideIcon } from "lucide-react";

import { useCountUp, useReveal } from "../hooks";
import { STATS, type Stat } from "../landing-data";

const ICON: Record<Stat["icon"], LucideIcon> = {
  scan: ScanSearch,
  target: Radar,
  reply: Reply,
  revenue: Trophy,
};

export function StatsSection() {
  const { ref, inView } = useReveal<HTMLDivElement>({ threshold: 0.4 });

  return (
    <section className="border-b border-[var(--lp-line)] bg-[var(--lp-paper)]">
      <div className="mx-auto w-full max-w-[1120px] px-5 py-16 sm:px-8 lg:py-20">
        <div
          ref={ref}
          className="grid gap-px overflow-hidden rounded-2xl border border-[var(--lp-line)] bg-[var(--lp-line)] sm:grid-cols-2 lg:grid-cols-4"
        >
          {STATS.map((stat, i) => (
            <StatCell key={stat.label} stat={stat} active={inView} index={i} />
          ))}
        </div>
        <p className="lp-data mt-4 text-center text-[0.625rem] text-[var(--lp-muted)]">
          Illustrative — figures from pilot campaigns.
        </p>
      </div>
    </section>
  );
}

function StatCell({
  stat,
  active,
  index,
}: {
  stat: Stat;
  active: boolean;
  index: number;
}) {
  const Icon = ICON[stat.icon];
  const value = useCountUp(stat.value, active, { duration: 1300 + index * 150 });

  return (
    <div className="flex flex-col items-center bg-[var(--lp-surface)] px-4 py-8 text-center">
      <Icon aria-hidden className="size-5 text-[var(--lp-forest)]" />
      <p className="lp-figure mt-3 text-[clamp(1.9rem,1.4rem+1.6vw,2.5rem)] text-[var(--lp-ink)]">
        {stat.display(value)}
      </p>
      <p className="mt-1 text-sm font-medium text-[var(--lp-ink)]">
        {stat.label}
      </p>
      <p className="mt-0.5 text-xs text-[var(--lp-muted)]">{stat.sub}</p>
    </div>
  );
}
