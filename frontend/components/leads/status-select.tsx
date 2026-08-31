"use client";

import { useState } from "react";
import { toast } from "sonner";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import type { LeadStatus } from "@/lib/types";
import { LEAD_STATUSES, STATUS_LABEL } from "./status";

/**
 * Local-only until the API exists. The toast names the state the lead is now
 * in, matching the vocabulary of the menu the user just used.
 */
export function StatusSelect({ initial }: { initial: LeadStatus }) {
  const [status, setStatus] = useState<LeadStatus>(initial);

  return (
    <Select
      value={status}
      onValueChange={(next) => {
        const value = next as LeadStatus;
        setStatus(value);
        toast(`Marked ${STATUS_LABEL[value].toLowerCase()}`);
      }}
    >
      <SelectTrigger className="w-full" aria-label="Lead status">
        <span className="text-sm">{STATUS_LABEL[status]}</span>
      </SelectTrigger>
      <SelectContent>
        {LEAD_STATUSES.map((value) => (
          <SelectItem key={value} value={value}>
            {STATUS_LABEL[value]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
