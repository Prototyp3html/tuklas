"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type RefObject,
} from "react";

/**
 * Motion utilities for the landing page. All of them degrade to "show the
 * final state immediately" when the visitor prefers reduced motion or when
 * the page is rendered without JS, so nothing is ever gated behind an
 * animation that might not run.
 */

const noop = () => () => {};

/** True only after hydration on the client. */
function useIsClient(): boolean {
  return useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );
}

export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => true, // SSR: assume reduced motion, i.e. no animation
  );
}

/** True once JS has mounted and motion is permitted. Gates `.lp-anim`. */
export function useMotionEnabled(): boolean {
  const isClient = useIsClient();
  const reduced = usePrefersReducedMotion();
  return isClient && !reduced;
}

type RevealOptions = {
  rootMargin?: string;
  threshold?: number;
  /** stay revealed once seen (default true) */
  once?: boolean;
};

/**
 * Reveal an element when it scrolls into view. Returns a ref and the current
 * in-view state; pair with the `.lp-reveal` class and `data-in`. Starts
 * `false` on both server and client so hydration matches — the `.lp-anim`
 * gate (which also checks for IntersectionObserver support) is what makes a
 * still-hidden element possible.
 */
export function useReveal<T extends HTMLElement = HTMLDivElement>(
  options: RevealOptions = {},
): { ref: RefObject<T | null>; inView: boolean } {
  const {
    rootMargin = "0px 0px -12% 0px",
    threshold = 0.15,
    once = true,
  } = options;
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          if (once) observer.disconnect();
        } else if (!once) {
          setInView(false);
        }
      },
      { rootMargin, threshold },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [rootMargin, threshold, once]);

  return { ref, inView };
}

/**
 * Count from `0` to `end` once `active` turns true. Holds at `end` for
 * reduced-motion visitors and for server render, so the real number always
 * ships.
 */
export function useCountUp(
  end: number,
  active: boolean,
  { duration = 1100 }: { duration?: number } = {},
): number {
  const reduced = usePrefersReducedMotion();
  const [value, setValue] = useState(end);
  const frame = useRef<number | null>(null);

  useEffect(() => {
    if (!active || reduced) return;

    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      // easeOutCubic — quick arrival, gentle settle
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(end * eased);
      if (t < 1) frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
    return () => {
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, [end, active, duration, reduced]);

  return value;
}

/**
 * Progress (0..1) of the viewport travelling through `ref`'s element. Drives
 * the parallax drift and the horizontal "how it works" track. rAF-throttled,
 * passive listener.
 */
export function useScrollProgress(ref: RefObject<HTMLElement | null>): number {
  const [progress, setProgress] = useState(0);
  const ticking = useRef(false);

  const measure = useCallback(() => {
    const node = ref.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    const total = rect.height - window.innerHeight;
    const next = total <= 0 ? 0 : Math.min(Math.max(-rect.top / total, 0), 1);
    setProgress(next);
  }, [ref]);

  useEffect(() => {
    const onScroll = () => {
      if (ticking.current) return;
      ticking.current = true;
      requestAnimationFrame(() => {
        measure();
        ticking.current = false;
      });
    };
    const raf = requestAnimationFrame(measure);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [measure]);

  return progress;
}

/**
 * Small vertical parallax drift for an element, clamped to `max` pixels.
 * Returns a ref to attach and a transform string ("" when motion is disabled
 * or the pointer is coarse, so touch users get a still image).
 */
export function useParallax<T extends HTMLElement = HTMLDivElement>(
  strength = 0.05,
  max = 44,
): { ref: RefObject<T | null>; transform: string } {
  const reduced = usePrefersReducedMotion();
  const ref = useRef<T>(null);
  const [offset, setOffset] = useState(0);
  const ticking = useRef(false);

  useEffect(() => {
    if (reduced) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;

    const update = () => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const fromCenter = rect.top + rect.height / 2 - window.innerHeight / 2;
      setOffset(Math.max(Math.min(-fromCenter * strength, max), -max));
    };
    const onScroll = () => {
      if (ticking.current) return;
      ticking.current = true;
      requestAnimationFrame(() => {
        update();
        ticking.current = false;
      });
    };
    const raf = requestAnimationFrame(update);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [strength, max, reduced]);

  return {
    ref,
    transform: offset ? `translate3d(0, ${offset.toFixed(1)}px, 0)` : "",
  };
}
