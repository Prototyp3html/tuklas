import Link from "next/link";
import { type ComponentProps } from "react";

import { cn } from "@/lib/utils";

/**
 * The landing page's own button. The product's shadcn Button is plum-tokened;
 * this surface runs on forest green, so rather than fight token overrides the
 * marketing page gets one small purpose-built control.
 */
type Variant = "solid" | "ghost" | "invert";

const base =
  "inline-flex items-center justify-center gap-2 rounded-md px-5 h-11 text-[0.9375rem] font-medium " +
  "font-[family-name:var(--font-bricolage)] tracking-[-0.01em] " +
  "transition-[transform,background-color,color,border-color,box-shadow] duration-150 ease-out " +
  "active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2";

const variants: Record<Variant, string> = {
  solid:
    "bg-[var(--lp-forest)] text-[var(--lp-paper)] shadow-[0_1px_2px_rgba(22,44,34,0.28)] " +
    "hover:bg-[var(--lp-forest-hover)] hover:-translate-y-px hover:shadow-[0_6px_18px_-6px_rgba(22,44,34,0.45)]",
  ghost:
    "text-[var(--lp-ink)] border border-[var(--lp-line)] bg-[var(--lp-surface)] " +
    "hover:border-[var(--lp-forest)] hover:text-[var(--lp-forest)] hover:-translate-y-px",
  invert:
    "bg-[var(--lp-paper)] text-[var(--lp-forest)] " +
    "hover:-translate-y-px hover:shadow-[0_8px_24px_-8px_rgba(0,0,0,0.35)]",
};

type LpButtonProps = ComponentProps<typeof Link> & { variant?: Variant };

export function LpButton({
  variant = "solid",
  className,
  ...props
}: LpButtonProps) {
  return <Link className={cn(base, variants[variant], className)} {...props} />;
}
