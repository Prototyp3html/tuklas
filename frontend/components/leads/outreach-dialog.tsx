"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import type { OutreachDraft } from "@/lib/types";

const CHANNEL_LABEL = {
  email: "Email",
  facebook_dm: "Facebook DM",
} as const;

/**
 * Human-in-the-loop, always. Nothing sends from here — the user copies a draft
 * and sends it themselves, then marks the lead contacted.
 */
export function OutreachDialog({
  businessName,
  drafts,
}: {
  businessName: string;
  drafts: OutreachDraft[];
}) {
  const [bodies, setBodies] = useState<Record<string, string>>(() =>
    Object.fromEntries(drafts.map((d) => [d.channel, d.body])),
  );
  const [open, setOpen] = useState(false);

  async function copy(channel: string) {
    const draft = drafts.find((d) => d.channel === channel);
    const subject = draft?.subject ? `Subject: ${draft.subject}\n\n` : "";
    try {
      await navigator.clipboard.writeText(subject + bodies[channel]);
      toast("Draft copied");
    } catch {
      toast("Couldn't copy", {
        description: "Your browser blocked clipboard access. Select the text and copy it manually.",
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button className="w-full" />}>
        Generate outreach
      </DialogTrigger>

      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Outreach to {businessName}</DialogTitle>
          <DialogDescription>
            Built only from the evidence on this page. Edit anything, copy it,
            and send it yourself.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue={drafts[0]?.channel}>
          <TabsList variant="line">
            {drafts.map((d) => (
              <TabsTrigger key={d.channel} value={d.channel}>
                {CHANNEL_LABEL[d.channel]}
              </TabsTrigger>
            ))}
          </TabsList>

          {drafts.map((d) => (
            <TabsContent key={d.channel} value={d.channel} className="mt-3">
              {d.subject && (
                <p className="text-muted-foreground mb-2 text-xs">
                  Subject:{" "}
                  <span className="text-foreground">{d.subject}</span>
                </p>
              )}
              <Textarea
                aria-label={`${CHANNEL_LABEL[d.channel]} draft`}
                value={bodies[d.channel]}
                onChange={(e) =>
                  setBodies((prev) => ({
                    ...prev,
                    [d.channel]: e.target.value,
                  }))
                }
                className="max-h-72 min-h-56 text-sm"
              />
              <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:justify-end">
                <Button variant="outline" onClick={() => copy(d.channel)}>
                  Copy draft
                </Button>
                <Button
                  onClick={() => {
                    setOpen(false);
                    toast("Marked contacted", {
                      description: `${businessName} moved to Contacted.`,
                    });
                  }}
                >
                  Mark contacted
                </Button>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
