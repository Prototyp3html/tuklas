import type { ScoreTier } from "@/lib/types";
import { cn } from "@/lib/utils";

const ARC: Record<ScoreTier, string> = {
  high: "var(--mark)",
  mid: "var(--verify)",
  low: "var(--muted-ink)",
};

const NUM: Record<ScoreTier, string> = {
  high: "text-tier-high",
  mid: "text-tier-mid",
  low: "text-tier-low",
};

/**
 * A small circular gauge — score over 100. The arc draws from empty once
 * `entered` flips; the number is always shown, so no information is gated
 * behind the animation.
 */
export function ScoreRing({
  score,
  tier,
  entered,
  size = 42,
  delay = 0,
}: {
  score: number;
  tier: ScoreTier;
  entered: boolean;
  size?: number;
  delay?: number;
}) {
  const stroke = 3.5;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const shown = Math.min(Math.max(score, 0), 100) / 100;
  const offset = entered ? circumference * (1 - shown) : circumference;

  return (
    <span
      className="relative inline-flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
        aria-hidden
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--rule)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={ARC[tier]}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            transition: "stroke-dashoffset 0.7s var(--ease-out)",
            transitionDelay: `${delay}ms`,
          }}
        />
      </svg>
      <span
        className={cn("tabular absolute text-[0.8125rem] font-medium", NUM[tier])}
      >
        {score}
      </span>
    </span>
  );
}
