import type { DateRange } from "@/lib/types";
import { cn } from "@/lib/utils";

const OPTIONS: { value: DateRange; label: string }[] = [
  { value: "week", label: "This week" },
  { value: "all", label: "All time" },
];

/** Controlled segmented control. Swaps the whole snapshot the dashboard shows. */
export function RangeToggle({
  value,
  onChange,
}: {
  value: DateRange;
  onChange: (next: DateRange) => void;
}) {
  return (
    <div
      role="group"
      aria-label="Date range"
      className="border-rule bg-sheet inline-flex rounded-lg border p-0.5 text-xs"
    >
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "focus-visible:ring-ring rounded-md px-2.5 py-1 transition-colors duration-150 focus-visible:ring-2 focus-visible:outline-none",
            value === option.value
              ? "bg-band text-foreground font-medium"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
