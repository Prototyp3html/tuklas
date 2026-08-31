import Link from "next/link";
import { type ReactNode } from "react";

/** Sentence-case section title with an optional trailing link. */
export function SectionHeading({
  title,
  action,
  children,
}: {
  title: string;
  action?: { label: string; href: string };
  children?: ReactNode;
}) {
  return (
    <div className="mb-3 flex items-baseline justify-between gap-4">
      <h2 className="text-[0.95rem] font-semibold tracking-tight">{title}</h2>
      {action && (
        <Link
          href={action.href}
          className="text-muted-foreground hover:text-foreground focus-visible:ring-ring shrink-0 rounded-xs text-xs transition-colors duration-150 focus-visible:ring-2 focus-visible:outline-none"
        >
          {action.label} →
        </Link>
      )}
      {children}
    </div>
  );
}
