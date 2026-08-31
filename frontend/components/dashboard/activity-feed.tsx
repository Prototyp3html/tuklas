import Link from "next/link";

import { formatRelativeTime } from "@/lib/format";
import type { ActivityEvent, ActivityKind } from "@/lib/types";
import { cn } from "@/lib/utils";
import { SectionHeading } from "./section-heading";

const DOT: Record<ActivityKind, string> = {
  discovery: "bg-verify",
  evidence: "bg-gap",
  reply: "bg-verify",
  qualified: "bg-gap",
  campaign: "bg-muted-foreground",
};

/** A quiet timeline: a dot in the event's colour, the line, the time. */
export function ActivityFeed({
  events,
  now,
  entered,
}: {
  events: ActivityEvent[];
  now: number;
  entered: boolean;
}) {
  return (
    <section className="border-rule bg-sheet h-full rounded-xl border p-5 shadow-[0_1px_2px_rgba(26,29,26,0.04)]">
      <SectionHeading title="Activity" />
      <ol className="mt-1">
        {events.map((event, i) => {
          const body = (
            <>
              <span className="block text-sm leading-snug">{event.text}</span>
              <span className="tabular text-muted-foreground mt-0.5 block text-xs">
                {formatRelativeTime(event.at, now)}
              </span>
            </>
          );
          return (
            <li
              key={event.id}
              data-in={entered ? "true" : "false"}
              style={{ transitionDelay: `${i * 40}ms` }}
              className="dash-enter flex gap-3 pb-4 last:pb-0"
            >
              <span className="flex flex-col items-center pt-1">
                <span
                  className={cn(
                    "ring-sheet size-2.5 shrink-0 rounded-full ring-2",
                    DOT[event.kind],
                  )}
                />
                {i < events.length - 1 && (
                  <span className="bg-rule mt-1 w-px flex-1" />
                )}
              </span>
              <div className="min-w-0 flex-1">
                {event.href ? (
                  <Link
                    href={event.href}
                    className="hover:text-verify focus-visible:ring-ring block rounded-xs transition-colors duration-150 focus-visible:ring-2 focus-visible:outline-none"
                  >
                    {body}
                  </Link>
                ) : (
                  <div>{body}</div>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
