"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Breadcrumb } from "./breadcrumb";

/**
 * Spans the content area, fixed while content scrolls. Breadcrumb left, search
 * and notifications right. Search hands off to the leads table via `?q=`.
 */
export function TopBar() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `/leads?q=${encodeURIComponent(q)}` : "/leads");
  };

  return (
    <header className="bg-paper/85 border-rule sticky top-0 z-30 flex h-12 items-center justify-between gap-3 border-b px-4 backdrop-blur-sm sm:px-6">
      <Breadcrumb />

      <div className="flex shrink-0 items-center gap-2">
        <form onSubmit={submit} className="relative hidden sm:block">
          <Search
            aria-hidden
            className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search opportunities…"
            aria-label="Search opportunities"
            className="border-rule bg-sheet focus-visible:border-ring focus-visible:ring-ring/40 h-8 w-44 rounded-lg border pl-8 pr-2.5 text-sm transition-[width,border-color] duration-200 ease-out outline-none focus-visible:w-60 focus-visible:ring-3"
          />
        </form>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" size="icon-sm" aria-label="Notifications" />
            }
          >
            <Bell aria-hidden />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <div className="px-2 py-6 text-center">
              <p className="text-sm">No new notifications.</p>
              <p className="text-muted-foreground mt-1 text-xs">
                Campaign results and ready drafts show up here.
              </p>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
