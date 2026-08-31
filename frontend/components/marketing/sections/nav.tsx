"use client";

import { useEffect, useState } from "react";

import { LpButton } from "../lp-button";
import { Logo } from "@/components/brand/logo";
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
          className="text-[var(--lp-ink)]"
          aria-label="TUKLAS — home"
        >
          <Logo size={24} />
        </a>

        <nav className="flex items-center gap-1 sm:gap-2">
          <a
            href="#how-it-works"
            className="hidden h-11 items-center px-3 text-sm text-[var(--lp-muted)] transition-colors duration-150 hover:text-[var(--lp-ink)] md:inline-flex"
          >
            How it works
          </a>
          <a
            href="#proof"
            className="hidden h-11 items-center px-3 text-sm text-[var(--lp-muted)] transition-colors duration-150 hover:text-[var(--lp-ink)] md:inline-flex"
          >
            Product
          </a>
          <a
            href="/login"
            className="hidden h-11 items-center px-3 text-sm text-[var(--lp-muted)] transition-colors duration-150 hover:text-[var(--lp-ink)] sm:inline-flex"
          >
            Log in
          </a>
          <LpButton href="/signup" className="h-10 px-4 text-sm">
            Start discovering
          </LpButton>
        </nav>
      </div>
    </header>
  );
}
