"use client";

import { type ElementType, type ReactNode } from "react";

import { useReveal } from "./hooks";
import { cn } from "@/lib/utils";

type RevealProps = {
  children: ReactNode;
  /** ms delay after the group enters, for staggering siblings */
  delay?: number;
  className?: string;
  as?: ElementType;
  rootMargin?: string;
  once?: boolean;
};

/**
 * Fades and lifts its children into place when scrolled into view. Inert
 * until the root gets `.lp-anim` (client + motion allowed), so the content
 * is always in the DOM and visible without JS.
 */
export function Reveal({
  children,
  delay = 0,
  className,
  as,
  rootMargin,
  once = true,
}: RevealProps) {
  const Tag = (as ?? "div") as ElementType;
  const { ref, inView } = useReveal<HTMLElement>({ rootMargin, once });

  return (
    <Tag
      ref={ref}
      data-in={inView ? "true" : "false"}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
      className={cn("lp-reveal", className)}
    >
      {children}
    </Tag>
  );
}
