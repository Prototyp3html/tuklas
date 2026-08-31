"use client";

/** Native range, restyled. Controlled; a value bubble tracks the thumb. */
export function ScoreSlider({
  value,
  onChange,
  min = 0,
  max = 100,
}: {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
}) {
  const pct = ((value - min) / (max - min)) * 100;

  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between">
        <span className="text-muted-foreground text-xs">
          Only surface leads scoring at least
        </span>
        <span className="tabular text-verify text-sm font-medium">{value}</span>
      </div>
      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          aria-label="Minimum opportunity score"
          className="h-1.5 w-full cursor-pointer appearance-none rounded-full outline-none [&::-moz-range-thumb]:size-4 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-[var(--sheet)] [&::-moz-range-thumb]:bg-[var(--verify)] [&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[var(--sheet)] [&::-webkit-slider-thumb]:bg-[var(--verify)] [&::-webkit-slider-thumb]:shadow-[0_1px_3px_rgba(26,29,26,0.3)]"
          style={{
            background: `linear-gradient(to right, var(--verify) ${pct}%, var(--band) ${pct}%)`,
          }}
        />
      </div>
      <div className="text-muted-foreground tabular mt-1 flex justify-between text-[0.6875rem]">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}
