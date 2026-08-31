"use client";

import {
  ArrowLeft,
  BarChart3,
  Bookmark,
  FileText,
  LayoutDashboard,
  Radar,
  Rows3,
  Send,
  Settings2,
  Share2,
} from "lucide-react";
import { type LucideIcon } from "lucide-react";

import { CompassMark } from "@/components/brand/logo";
import { Gauge } from "./gauge";
import { useReveal } from "./hooks";
import { SAMPLE_DOSSIER } from "./landing-data";
import { cn } from "@/lib/utils";

const NAV: { label: string; icon: LucideIcon; active?: boolean }[] = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Discoveries", icon: Radar, active: true },
  { label: "Campaigns", icon: Rows3 },
  { label: "Dossiers", icon: FileText },
  { label: "Outreach", icon: Send },
  { label: "Analytics", icon: BarChart3 },
  { label: "Saved", icon: Bookmark },
  { label: "Settings", icon: Settings2 },
];

const TABS = ["Overview", "Evidence", "Insights", "Outreach", "Notes"];

export function SampleDossier() {
  const d = SAMPLE_DOSSIER;
  const { ref, inView } = useReveal<HTMLElement>({ threshold: 0.25 });
  const active = inView;

  return (
    <figure
      ref={ref}
      className="overflow-hidden rounded-2xl border border-[var(--lp-line)] bg-[var(--lp-surface)] shadow-[0_1px_0_var(--lp-line),0_44px_90px_-40px_rgba(26,29,26,0.32)]"
    >
      {/* window strip */}
      <div className="flex items-center justify-between border-b border-[var(--lp-line)] px-4 py-2.5">
        <span className="flex items-center gap-1.5 text-[0.6875rem] text-[var(--lp-muted)]">
          <ArrowLeft aria-hidden className="size-3" />
          Back to discoveries
        </span>
        <span className="flex items-center gap-2 text-[0.6875rem] text-[var(--lp-muted)]">
          <span className="flex items-center gap-1">
            <Bookmark aria-hidden className="size-3" /> Save
          </span>
          <span className="flex items-center gap-1">
            <Share2 aria-hidden className="size-3" /> Share
          </span>
        </span>
      </div>

      <div className="flex">
        {/* mini sidebar */}
        <aside className="hidden w-[132px] shrink-0 flex-col border-r border-[var(--lp-line)] p-3 sm:flex">
          <span className="flex items-center gap-1.5 px-1 text-[var(--lp-ink)]">
            <CompassMark size={14} />
            <span className="font-[family-name:var(--font-cormorant)] text-xs font-semibold tracking-[0.06em]">
              TUKLAS
            </span>
          </span>
          <nav className="mt-4 flex flex-col gap-0.5">
            {NAV.map(({ label, icon: Icon, active: on }) => (
              <span
                key={label}
                className={cn(
                  "flex items-center gap-2 rounded-md px-1.5 py-1 text-[0.6875rem]",
                  on
                    ? "bg-[var(--lp-forest-tint)] font-medium text-[var(--lp-ink)]"
                    : "text-[var(--lp-muted)]",
                )}
              >
                <Icon
                  aria-hidden
                  className={cn(
                    "size-3",
                    on && "text-[var(--lp-forest)]",
                  )}
                />
                {label}
              </span>
            ))}
          </nav>
          <span className="mt-auto flex items-center gap-1.5 px-1 pt-4 text-[0.625rem] text-[var(--lp-muted)]">
            <span className="size-4 rounded-full bg-[var(--lp-line)]" />
            Juan Dela Cruz
          </span>
        </aside>

        {/* main */}
        <div className="min-w-0 flex-1 p-4 sm:p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <h3 className="lp-display text-xl">{d.business}</h3>
                {d.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-full bg-[var(--lp-amber-tint)] px-1.5 py-0.5 text-[0.5625rem] font-medium tracking-[0.03em] text-[var(--lp-amber)] uppercase"
                  >
                    {t}
                  </span>
                ))}
              </div>
              <p className="lp-data mt-1 text-[0.6875rem] text-[var(--lp-muted)]">
                {d.location} · Philippines
              </p>
            </div>
            <div className="flex flex-col items-center">
              <span className="lp-eyebrow text-[0.5rem]">Score</span>
              <Gauge value={d.score} active={active} size={52} />
            </div>
          </div>

          <div className="mt-4 flex gap-4 border-b border-[var(--lp-line)] text-[0.75rem]">
            {TABS.map((t, i) => (
              <span
                key={t}
                className={cn(
                  "pb-2",
                  i === 0
                    ? "border-b-2 border-[var(--lp-forest)] font-medium text-[var(--lp-ink)]"
                    : "text-[var(--lp-muted)]",
                )}
              >
                {t}
              </span>
            ))}
          </div>

          <div className="mt-4 grid gap-5 sm:grid-cols-[1.1fr_0.9fr]">
            {/* evidence timeline */}
            <div>
              <p className="lp-eyebrow text-[0.5625rem]">Evidence timeline</p>
              <ol className="mt-3">
                {d.timeline.map((e, i) => (
                  <li
                    key={e.title}
                    data-in={active ? "true" : "false"}
                    style={{ transitionDelay: `${180 + i * 90}ms` }}
                    className="lp-reveal flex gap-2.5 pb-3 last:pb-0"
                  >
                    <span className="flex flex-col items-center pt-1">
                      <span className="size-1.5 rounded-full bg-[var(--lp-forest)]" />
                      {i < d.timeline.length - 1 && (
                        <span className="mt-1 w-px flex-1 bg-[var(--lp-line)]" />
                      )}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[0.8125rem] leading-snug text-[var(--lp-ink)]">
                        {e.title}
                      </span>
                      <span className="lp-data block text-[0.625rem] text-[var(--lp-muted)]">
                        {e.detail} · {e.at}
                      </span>
                    </span>
                  </li>
                ))}
              </ol>
              <span className="mt-1 inline-flex items-center rounded-md border border-[var(--lp-line)] px-2 py-1 text-[0.625rem] text-[var(--lp-muted)]">
                View all evidence
              </span>
            </div>

            {/* insight + service */}
            <div className="flex flex-col gap-3">
              <div className="rounded-lg bg-[var(--lp-forest-tint)] p-3">
                <p className="lp-eyebrow text-[0.5rem] text-[var(--lp-forest)]">
                  Key insight
                </p>
                <p className="mt-1 text-[0.75rem] leading-relaxed text-[var(--lp-ink-soft)]">
                  {d.insight}
                </p>
              </div>
              <div className="rounded-lg border border-[var(--lp-line)] p-3">
                <p className="lp-eyebrow text-[0.5rem]">Recommended service</p>
                <p className="mt-1 text-[0.8125rem] font-semibold text-[var(--lp-ink)]">
                  {d.service.name}
                </p>
                <p className="mt-0.5 text-[0.6875rem] leading-relaxed text-[var(--lp-muted)]">
                  {d.service.blurb}
                </p>
                <p className="lp-data mt-2 text-[0.6875rem] text-[var(--lp-ink)]">
                  {d.service.priceRange}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </figure>
  );
}
