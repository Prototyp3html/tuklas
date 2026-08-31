import { type ReactNode } from "react";

import { Reveal } from "../reveal";
import { cn } from "@/lib/utils";

/**
 * The case-file section marker. The label carries an ordered exhibit tag
 * because the page genuinely is a walkthrough of one investigation.
 */
export function SectionHeader({
  tag,
  title,
  lead,
  className,
}: {
  tag: string;
  title: ReactNode;
  lead?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("max-w-2xl", className)}>
      <Reveal>
        <p className="lp-eyebrow">{tag}</p>
      </Reveal>
      <Reveal delay={60}>
        <h2 className="lp-display mt-4 text-[clamp(1.75rem,1.2rem+2.4vw,2.6rem)] text-balance">
          {title}
        </h2>
      </Reveal>
      {lead && (
        <Reveal delay={120}>
          <p className="lp-prose mt-4">{lead}</p>
        </Reveal>
      )}
    </div>
  );
}
