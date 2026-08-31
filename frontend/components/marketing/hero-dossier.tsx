"use client";

import {
  ArrowRight,
  CalendarX2,
  MapPin,
  Share2,
  TrendingUp,
} from "lucide-react";
import { type LucideIcon } from "lucide-react";

import { Gauge } from "./gauge";
import { HERO_PROFILE } from "./landing-data";
import { cn } from "@/lib/utils";

const EVIDENCE_ICON: Record<string, LucideIcon> = {
  "No online booking": CalendarX2,
  "High customer demand": TrendingUp,
  "Active on social media": Share2,
  "High foot-traffic area": MapPin,
};

/**
 * The hero's opportunity dossier — a profile card, not the weight ledger
 * (that's the Exhibit A section further down). Score gauge, the evidence at a
 * glance, the recommended service, and the sources it was built from floating
 * off the edge on a string.
 */
export function HeroDossier({ active = true }: { active?: boolean }) {
  const p = HERO_PROFILE;

  return (
    <div className="relative mx-auto max-w-[400px] lg:mx-0">
      <figure className="relative z-10 overflow-hidden rounded-2xl border border-[var(--lp-line)] bg-[var(--lp-surface)] shadow-[0_1px_0_var(--lp-line),0_36px_70px_-34px_rgba(26,29,26,0.3)]">
        {/* header */}
        <div className="flex items-start justify-between gap-4 border-b border-[var(--lp-line)] p-5">
          <div className="min-w-0">
            <p className="lp-eyebrow text-[0.5625rem]">Opportunity dossier</p>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <h3 className="lp-display text-lg">{p.business}</h3>
              <span className="rounded-full bg-[var(--lp-amber-tint)] px-2 py-0.5 text-[0.625rem] font-medium tracking-[0.04em] text-[var(--lp-amber)] uppercase">
                {p.tag}
              </span>
            </div>
            <p className="lp-data mt-1 text-xs text-[var(--lp-muted)]">
              {p.category} · {p.location}
            </p>
          </div>
          <div className="flex flex-col items-center">
            <span className="lp-eyebrow text-[0.5rem]">Score</span>
            <Gauge value={p.score} active={active} />
          </div>
        </div>

        {/* body */}
        <div className="grid gap-5 p-5 sm:grid-cols-2">
          <div>
            <p className="lp-eyebrow text-[0.5625rem]">Evidence snapshot</p>
            <ul className="mt-3 flex flex-col gap-2.5">
              {p.evidence.map((e, i) => {
                const Icon = EVIDENCE_ICON[e.label] ?? MapPin;
                return (
                  <li
                    key={e.label}
                    data-in={active ? "true" : "false"}
                    style={{ transitionDelay: `${200 + i * 80}ms` }}
                    className="lp-reveal flex items-center gap-2 text-[0.8125rem] text-[var(--lp-ink)]"
                  >
                    <Icon
                      aria-hidden
                      className={cn(
                        "size-3.5 shrink-0",
                        e.kind === "gap"
                          ? "text-[var(--lp-amber)]"
                          : "text-[var(--lp-forest)]",
                      )}
                    />
                    {e.label}
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="sm:border-l sm:border-[var(--lp-line)] sm:pl-5">
            <p className="lp-eyebrow text-[0.5625rem]">Recommended service</p>
            <p className="mt-3 text-sm font-semibold text-[var(--lp-ink)]">
              {p.service.name}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-[var(--lp-muted)]">
              {p.service.blurb}
            </p>
            <p className="lp-data mt-3 text-xs text-[var(--lp-ink)]">
              {p.service.priceRange}
            </p>
            <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-[var(--lp-forest)]">
              View full analysis
              <ArrowRight aria-hidden className="size-3" />
            </span>
          </div>
        </div>
      </figure>

      {/* evidence sources, on a string — decorative, wide screens only */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-7 left-[calc(100%+0.75rem)] hidden w-[8.5rem] flex-col gap-3 xl:flex"
      >
        {p.sources.map((s, i) => (
          <div
            key={s.name}
            data-in={active ? "true" : "false"}
            style={{
              transitionDelay: `${420 + i * 110}ms`,
              animationDelay: `${i * 0.6}s`,
            }}
            className="lp-reveal lp-float flex items-center"
          >
            <span className="h-px w-5 shrink-0 bg-[var(--lp-line)]" />
            <span className="min-w-0 flex-1 rounded-lg border border-[var(--lp-line)] bg-[var(--lp-surface)] px-2.5 py-1.5 shadow-[0_8px_20px_-12px_rgba(26,29,26,0.25)]">
              <span className="flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-[var(--lp-forest)]" />
                <span className="text-[0.6875rem] font-medium text-[var(--lp-ink)]">
                  {s.name}
                </span>
              </span>
              <span className="lp-data mt-0.5 block text-[0.5625rem] text-[var(--lp-muted)]">
                {s.detail}
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
