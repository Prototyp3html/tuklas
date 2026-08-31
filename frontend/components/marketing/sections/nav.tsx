"use client";

import { useEffect, useState } from "react";

import { LpButton } from "../lp-button";
import { cn } from "@/lib/utils";

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 bg-[var(--lp-paper)] transition-[border-color,box-shadow] duration-200 ease-out",
        scrolled
          ? "border-b border-[var(--lp-line)] shadow-[0_1px_0_var(--lp-line-soft)]"
          : "border-b border-transparent",
      )}
    >
      <div className="mx-auto flex h-16 w-full max-w-[1120px] items-center justify-between px-5 sm:px-8">
        <a
          href="#top"
          className="flex items-center gap-2.5"
          aria-label="TUKLAS — home"
        >
          <span
            aria-hidden
            className="grid h-6 w-6 place-items-center rounded-[5px] bg-[var(--lp-forest)]"
          >
            <span className="h-1.5 w-1.5 rounded-[1px] bg-[var(--lp-amber-mark)]" />
          </span>
          <span className="font-[family-name:var(--font-bricolage)] text-[0.95rem] font-semibold tracking-[0.14em] text-[var(--lp-ink)]">
            TUKLAS
          </span>
        </a>

        <nav className="flex items-center gap-2 sm:gap-3">
          <a
            href="/login"
            className="hidden h-11 items-center px-3 text-sm text-[var(--lp-muted)] transition-colors duration-150 hover:text-[var(--lp-ink)] sm:inline-flex"
          >
            Sign in
          </a>
          <LpButton href="/signup" className="h-10 px-4 text-sm">
            Get started
          </LpButton>
        </nav>
      </div>
    </header>
  );
}
