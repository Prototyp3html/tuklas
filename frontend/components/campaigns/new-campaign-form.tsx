"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatPeso } from "@/lib/format";
import { cn } from "@/lib/utils";

const INDUSTRIES = [
  "Salon",
  "Spa",
  "Restaurant",
  "Carinderia",
  "Dental clinic",
  "Auto repair",
  "Laundry",
  "Tailoring",
];

const STAGES = ["Discover", "Research", "Audit", "Score", "Draft"];

/**
 * The campaign brief — four questions, numbered because that is genuinely all
 * there is to it. A live panel on the right shows what the run will look for
 * and roughly how big it will be, so the screen has a sense of consequence
 * without asking for anything more.
 */
export function NewCampaignForm() {
  const router = useRouter();
  const [service, setService] = useState(
    "Websites and appointment booking systems",
  );
  const [industries, setIndustries] = useState<string[]>(["Salon"]);
  const [location, setLocation] = useState("Zamboanga City");
  const [budget, setBudget] = useState(30000);
  const [submitting, setSubmitting] = useState(false);

  const toggle = (industry: string) =>
    setIndustries((prev) =>
      prev.includes(industry)
        ? prev.filter((i) => i !== industry)
        : [...prev, industry],
    );

  // Illustrative — roughly what discovery tends to turn up per industry.
  const estimate = useMemo(() => {
    const count = Math.round((industries.length * 78 + 55) / 5) * 5;
    return { count, minutes: Math.max(4, Math.round(count / 16)) };
  }, [industries.length]);

  const ready = industries.length > 0 && service.trim() && location.trim();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!ready) return;
        setSubmitting(true);
        router.push("/campaigns/camp-salons-zc");
      }}
      className="grid gap-6 lg:grid-cols-[1fr_20rem]"
    >
      <div className="border-rule bg-sheet rounded-xl border p-6 shadow-[0_1px_2px_rgba(26,29,26,0.04)] sm:p-8">
        <ol className="flex flex-col gap-8">
          <Step n="01" label="What do you sell?">
            <Textarea
              value={service}
              onChange={(e) => setService(e.target.value)}
              required
              className="min-h-20"
              aria-label="What do you sell?"
            />
            <Hint>
              Plain words are fine — this shapes which gaps count as
              opportunities.
            </Hint>
          </Step>

          <Step n="02" label="Who do you sell it to?">
            <div className="flex flex-wrap gap-2">
              {INDUSTRIES.map((industry) => {
                const on = industries.includes(industry);
                return (
                  <button
                    key={industry}
                    type="button"
                    onClick={() => toggle(industry)}
                    aria-pressed={on}
                    className={cn(
                      "focus-visible:ring-ring rounded-lg border px-3 py-1.5 text-sm transition-colors duration-150 focus-visible:ring-2 focus-visible:outline-none",
                      on
                        ? "border-verify/40 bg-verify/10 text-verify font-medium"
                        : "border-rule text-muted-foreground hover:border-foreground/30 hover:text-foreground",
                    )}
                  >
                    {industry}
                  </button>
                );
              })}
            </div>
            {industries.length === 0 && (
              <p className="text-destructive mt-2 text-xs">
                Pick at least one so discovery knows what to search for.
              </p>
            )}
          </Step>

          <Step n="03" label="Where?">
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
              aria-label="Where?"
            />
            <Hint>
              One city or municipality. Narrower searches finish faster and get
              rate-limited less.
            </Hint>
          </Step>

          <Step n="04" label="Smallest project worth your time">
            <div className="relative">
              <span className="text-muted-foreground tabular pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-sm">
                ₱
              </span>
              <Input
                type="number"
                inputMode="numeric"
                min={0}
                step={1000}
                required
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value) || 0)}
                aria-label="Smallest project worth your time, in pesos"
                className="tabular pl-6"
              />
            </div>
            <Hint>
              Ranks results — it doesn&apos;t exclude anyone. Smaller jobs still
              appear, lower down.
            </Hint>
          </Step>
        </ol>
      </div>

      {/* live summary */}
      <div className="border-rule bg-sheet h-fit rounded-xl border p-5 shadow-[0_1px_2px_rgba(26,29,26,0.04)] lg:sticky lg:top-16">
        <h2 className="text-[0.95rem] font-semibold tracking-tight">
          What will run
        </h2>

        <dl className="mt-4 flex flex-col gap-3 text-sm">
          <div>
            <dt className="text-muted-foreground text-xs">Looking for</dt>
            <dd className="mt-0.5 line-clamp-2">{service || "—"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-xs">Among</dt>
            <dd className="mt-1 flex flex-wrap gap-1">
              {industries.length === 0 ? (
                <span className="text-muted-foreground">—</span>
              ) : (
                industries.map((i) => (
                  <span
                    key={i}
                    className="bg-band rounded-md px-1.5 py-0.5 text-xs"
                  >
                    {i}
                  </span>
                ))
              )}
            </dd>
          </div>
          <div className="flex items-baseline justify-between">
            <dt className="text-muted-foreground text-xs">In</dt>
            <dd>{location || "—"}</dd>
          </div>
          <div className="flex items-baseline justify-between">
            <dt className="text-muted-foreground text-xs">Price floor</dt>
            <dd className="tabular">{formatPeso(budget)}</dd>
          </div>
        </dl>

        <div className="border-rule mt-4 border-t pt-4">
          <p className="text-sm">
            <span className="tabular font-medium">≈ {estimate.count}</span>{" "}
            <span className="text-muted-foreground">
              businesses to scan · ~{estimate.minutes} min
            </span>
          </p>
          <ol className="text-muted-foreground mt-3 flex flex-wrap items-center gap-x-1 gap-y-1 text-[0.6875rem]">
            {STAGES.map((stage, i) => (
              <li key={stage} className="flex items-center gap-1">
                {stage}
                {i < STAGES.length - 1 && (
                  <span aria-hidden className="text-rule">
                    →
                  </span>
                )}
              </li>
            ))}
          </ol>
        </div>

        <Button
          type="submit"
          size="lg"
          className="mt-5 w-full"
          disabled={!ready || submitting}
        >
          {submitting ? "Starting…" : "Find opportunities"}
        </Button>
        <p className="text-muted-foreground mt-2.5 text-xs">
          Nothing is contacted. You approve every message before it sends.
        </p>
      </div>
    </form>
  );
}

function Step({
  n,
  label,
  children,
}: {
  n: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <li className="flex gap-4">
      <span className="tabular text-verify pt-1 text-xs font-medium">{n}</span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{label}</p>
        <div className="mt-2">{children}</div>
      </div>
    </li>
  );
}

function Hint({ children }: { children: React.ReactNode }) {
  return <p className="text-muted-foreground mt-1.5 text-xs">{children}</p>;
}
