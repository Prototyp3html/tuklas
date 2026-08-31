import { cn } from "@/lib/utils";

/**
 * The TUKLAS mark: a compass rose — outline ring with cardinal ticks, a gold
 * needle-diamond, and a fixed centre point. Dark strokes ride `currentColor`
 * so the mark takes the colour of whatever it sits in; the needle stays gold.
 */
export function CompassMark({
  size = 24,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      aria-hidden
      className={cn("shrink-0", className)}
    >
      <circle cx="20" cy="20" r="14" stroke="currentColor" strokeWidth="1.6" />
      <line x1="20" y1="6" x2="20" y2="9" stroke="currentColor" strokeWidth="1.6" />
      <line x1="34" y1="20" x2="31" y2="20" stroke="currentColor" strokeWidth="1.6" />
      <line x1="20" y1="34" x2="20" y2="31" stroke="currentColor" strokeWidth="1.6" />
      <line x1="6" y1="20" x2="9" y2="20" stroke="currentColor" strokeWidth="1.6" />
      <polygon
        points="20,10 26,20 20,30 14,20"
        stroke="var(--brand-gold)"
        strokeWidth="1.4"
        fill="none"
      />
      <circle cx="20" cy="20" r="1.6" fill="currentColor" />
    </svg>
  );
}

/**
 * Mark + wordmark. The wordmark is Cormorant Garamond 600; the caller owns
 * text colour and the wordmark's font-size.
 */
export function Logo({
  size = 24,
  wordmark = true,
  className,
  wordmarkClassName,
}: {
  size?: number;
  wordmark?: boolean;
  className?: string;
  wordmarkClassName?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <CompassMark size={size} />
      {wordmark && (
        <span
          className={cn(
            "font-[family-name:var(--font-cormorant)] text-[1.0625rem] leading-none font-semibold tracking-[0.03em]",
            wordmarkClassName,
          )}
        >
          TUKLAS
        </span>
      )}
    </span>
  );
}
