"use client";

import { useEffect, useState } from "react";

/**
 * Load-only motion for the dashboard. `.dash-enter` / `.funnel-band` in
 * globals.css start hidden and reveal when their `data-in` flips to "true",
 * which this does one frame after mount — so the entrance plays exactly once
 * per visit and never re-triggers on re-render. Reduced motion collapses the
 * transition (global block), so it just snaps in.
 */
export function useEntered(): boolean {
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(id);
  }, []);
  return entered;
}
