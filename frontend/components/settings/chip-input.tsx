"use client";

import { type KeyboardEvent, useState } from "react";
import { X } from "lucide-react";

/** Controlled tag input — Enter or comma commits, × removes. No combobox. */
export function ChipInput({
  values,
  onChange,
  placeholder = "Add…",
  ariaLabel,
}: {
  values: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  ariaLabel: string;
}) {
  const [draft, setDraft] = useState("");

  const commit = () => {
    const v = draft.trim().replace(/,$/, "");
    if (v && !values.includes(v)) onChange([...values, v]);
    setDraft("");
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      commit();
    } else if (e.key === "Backspace" && draft === "" && values.length > 0) {
      onChange(values.slice(0, -1));
    }
  };

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className="border-input bg-sheet focus-within:border-ring focus-within:ring-ring/40 flex flex-wrap items-center gap-1.5 rounded-lg border p-1.5 transition-[border-color,box-shadow] focus-within:ring-3"
    >
      {values.map((chip) => (
        <span
          key={chip}
          className="bg-band inline-flex items-center gap-1 rounded-md py-0.5 pr-1 pl-2 text-xs"
        >
          {chip}
          <button
            type="button"
            onClick={() => onChange(values.filter((c) => c !== chip))}
            aria-label={`Remove ${chip}`}
            className="hover:text-foreground text-muted-foreground rounded-xs"
          >
            <X aria-hidden className="size-3" />
          </button>
        </span>
      ))}
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={commit}
        placeholder={values.length === 0 ? placeholder : ""}
        className="min-w-[6rem] flex-1 bg-transparent px-1 py-0.5 text-sm outline-none"
      />
    </div>
  );
}
