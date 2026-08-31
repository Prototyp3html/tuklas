"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Copy, Mail, MessageCircle } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatRelativeTime } from "@/lib/format";
import type { OutreachStatus, OutreachThread } from "@/lib/types";
import { cn } from "@/lib/utils";

const NOW = new Date("2026-08-31T12:00:00+08:00").getTime();

const STATUS_LABEL: Record<OutreachStatus, string> = {
  draft: "Draft",
  sent: "Sent",
  replied: "Replied",
  bounced: "Bounced",
};

const STATUS_CLASS: Record<OutreachStatus, string> = {
  draft: "bg-band text-muted-foreground",
  sent: "bg-verify/10 text-verify",
  replied: "bg-tier-high/10 text-tier-high",
  bounced: "bg-destructive/10 text-destructive",
};

const FILTERS = [
  { key: "all", label: "All" },
  { key: "draft", label: "Drafts" },
  { key: "sent", label: "Sent" },
  { key: "replied", label: "Replied" },
] as const;

type FilterKey = (typeof FILTERS)[number]["key"];

function ChannelIcon({ channel }: { channel: OutreachThread["channel"] }) {
  const Icon = channel === "email" ? Mail : MessageCircle;
  return <Icon aria-hidden className="text-muted-foreground size-3.5 shrink-0" />;
}

export function OutreachView({ threads }: { threads: OutreachThread[] }) {
  const [filter, setFilter] = useState<FilterKey>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const list = useMemo(
    () =>
      (filter === "all"
        ? threads
        : threads.filter((t) => t.status === filter)
      ).slice(),
    [threads, filter],
  );

  const selected = threads.find((t) => t.id === selectedId) ?? null;

  return (
    <div className="lg:grid lg:grid-cols-[21rem_1fr] lg:gap-4">
      {/* list */}
      <div className={cn(selected && "hidden lg:block")}>
        <div className="mb-3 flex flex-wrap gap-1">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              aria-pressed={filter === f.key}
              className={cn(
                "focus-visible:ring-ring rounded-lg px-2.5 py-1 text-sm transition-colors duration-150 focus-visible:ring-2 focus-visible:outline-none",
                filter === f.key
                  ? "bg-band text-foreground font-medium"
                  : "text-muted-foreground hover:bg-band/60 hover:text-foreground",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        <ol className="border-rule bg-sheet divide-rule divide-y overflow-hidden rounded-lg border">
          {list.map((t) => (
            <li key={t.id}>
              <button
                type="button"
                onClick={() => setSelectedId(t.id)}
                className={cn(
                  "hover:bg-band/40 focus-visible:ring-ring flex w-full flex-col gap-1 px-3.5 py-3 text-left transition-colors duration-150 focus-visible:-outline-offset-2 focus-visible:ring-2 focus-visible:outline-none",
                  selectedId === t.id && "bg-band/50",
                )}
              >
                <div className="flex items-center gap-2">
                  <ChannelIcon channel={t.channel} />
                  <span className="flex-1 truncate text-sm font-medium">
                    {t.business}
                  </span>
                  <span
                    className={cn(
                      "shrink-0 rounded-md px-1.5 py-0.5 text-[0.6875rem] font-medium",
                      STATUS_CLASS[t.status],
                    )}
                  >
                    {STATUS_LABEL[t.status]}
                  </span>
                </div>
                <p className="text-muted-foreground line-clamp-1 text-xs">
                  {t.messages[t.messages.length - 1]?.body}
                </p>
                <p className="tabular text-muted-foreground text-[0.6875rem]">
                  {formatRelativeTime(t.updatedAt, NOW)}
                </p>
              </button>
            </li>
          ))}
        </ol>
      </div>

      {/* detail */}
      <div className={cn("mt-4 lg:mt-0", !selected && "hidden lg:block")}>
        {selected ? (
          <ThreadDetail
            key={selected.id}
            thread={selected}
            onBack={() => setSelectedId(null)}
          />
        ) : (
          <div className="border-rule bg-sheet text-muted-foreground hidden h-full min-h-72 place-items-center rounded-lg border text-sm lg:grid">
            Pick a thread to read it.
          </div>
        )}
      </div>
    </div>
  );
}

function ThreadDetail({
  thread,
  onBack,
}: {
  thread: OutreachThread;
  onBack: () => void;
}) {
  const [draft, setDraft] = useState(thread.messages[0]?.body ?? "");
  const [sent, setSent] = useState(thread.status === "sent");

  return (
    <div className="border-rule bg-sheet rounded-lg border">
      <header className="border-rule flex items-start justify-between gap-3 border-b p-4">
        <div className="min-w-0">
          <button
            type="button"
            onClick={onBack}
            className="text-muted-foreground hover:text-foreground -ml-1 mb-1 inline-flex items-center gap-1 text-xs lg:hidden"
          >
            <ArrowLeft aria-hidden className="size-3.5" />
            All threads
          </button>
          <div className="flex items-center gap-2">
            <ChannelIcon channel={thread.channel} />
            <h2 className="truncate text-sm font-semibold">
              {thread.business}
            </h2>
          </div>
          <p className="text-muted-foreground mt-0.5 text-xs">
            {thread.location} ·{" "}
            {thread.channel === "email" ? "Email" : "Facebook DM"}
          </p>
        </div>
        <Link
          href={`/leads/${thread.leadId}`}
          className="text-verify shrink-0 text-xs font-medium hover:underline"
        >
          Open lead →
        </Link>
      </header>

      <div className="flex flex-col gap-3 p-4">
        {thread.subject && (
          <p className="text-muted-foreground text-xs">
            Subject: <span className="text-foreground">{thread.subject}</span>
          </p>
        )}
        {thread.messages.map((m, i) => (
          <div
            key={i}
            className={cn(
              "max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm whitespace-pre-wrap",
              m.from === "you"
                ? "bg-verify/8 ml-auto"
                : "bg-band mr-auto",
            )}
          >
            {m.body}
            <span className="tabular text-muted-foreground mt-1.5 block text-[0.6875rem]">
              {m.from === "you" ? "You" : thread.business} ·{" "}
              {formatRelativeTime(m.at, NOW)}
            </span>
          </div>
        ))}
      </div>

      {thread.status === "draft" && (
        <div className="border-rule border-t p-4">
          <p className="text-muted-foreground mb-2 text-xs">
            Draft — edit, then copy it into {thread.channel === "email"
              ? "your email client"
              : "Messenger"}. Nothing sends from here.
          </p>
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="min-h-40 text-sm"
            aria-label="Draft message"
          />
          <div className="mt-3 flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                navigator.clipboard?.writeText(draft);
                toast.success("Copied to clipboard");
              }}
            >
              <Copy aria-hidden />
              Copy
            </Button>
            <Button
              size="sm"
              disabled={sent}
              onClick={() => {
                setSent(true);
                toast.success("Marked sent");
              }}
            >
              {sent ? "Marked sent" : "Mark sent"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
