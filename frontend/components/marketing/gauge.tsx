"use client";

import { useCountUp } from "./hooks";
import { cn } from "@/lib/utils";

/** Circular opportunity-score gauge. The arc fills and the number counts up
 *  once `active` flips on. */
export function Gauge({
  value,
  active,
  size = 60,
  className,
}: {
  value: number;
  active: boolean;
  size?: number;
  className?: string;
}) {
  const shown = Math.round(useCountUp(value, active, { duration: 1200 }));
  const stroke = size < 52 ? 4 : 4.5;
  const r = (size - stroke) / 2 - 1;
  const c = 2 * Math.PI * r;
  const offset = active ? c * (1 - Math.min(value, 100) / 100) : c;

  return (
    <span
      className={cn(
        "relative inline-grid shrink-0 place-items-center",
        className,
      )}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--lp-line)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--lp-forest)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1.1s var(--lp-ease)" }}
        />
      </svg>
      <span
        className="lp-figure absolute font-semibold text-[var(--lp-forest)]"
        style={{ fontSize: size * 0.32 }}
      >
        {shown}
      </span>
    </span>
  );
}
