import type { ScoreTier } from "./types";

/** ₱30,000 — no decimals; these are project prices, not receipts. */
export function formatPeso(amount: number): string {
  return `₱${amount.toLocaleString("en-PH", { maximumFractionDigits: 0 })}`;
}

/** Compact peso for headline figures. ₱2.6M, ₱480K, ₱30,000. */
export function formatPesoCompact(amount: number): string {
  if (amount >= 1_000_000) return `₱${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 100_000) return `₱${Math.round(amount / 1_000)}K`;
  return formatPeso(amount);
}

/** Sub-peso amounts, for AI cost per run. ₱2.40 */
export function formatPesoPrecise(amount: number): string {
  return `₱${amount.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/** "31 Aug" — short enough to sit inline under an evidence claim. */
export function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-PH", {
    day: "numeric",
    month: "short",
  });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-PH", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

/**
 * "5h ago" / "2d ago" for feeds. Falls back to a short date past a week.
 * `now` is injectable so fixture timestamps read sensibly against a fixed
 * reference rather than the wall clock.
 */
export function formatRelativeTime(iso: string, now: number = Date.now()): string {
  const diffMs = now - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days <= 7) return `${days}d ago`;
  return formatShortDate(iso);
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  const mins = Math.floor(ms / 60_000);
  const secs = Math.round((ms % 60_000) / 1000);
  return `${mins}m ${secs}s`;
}

/** The bands from BUILD_GUIDE Part 4: 80+ high, 60-79 mid, below that low. */
export function scoreTier(score: number): ScoreTier {
  if (score >= 80) return "high";
  if (score >= 60) return "mid";
  return "low";
}

/**
 * One hue in the tier system, not three. Colour means "worth your attention";
 * everything else recedes to ink or muted ink.
 */
export function tierClass(tier: ScoreTier): string {
  switch (tier) {
    case "high":
      return "text-tier-high";
    case "mid":
      return "text-tier-mid";
    case "low":
      return "text-tier-low";
  }
}

/** Source links show their host, not a bare "source" label or an icon. */
export function hostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

/** "no_website" -> "No website" for the breakdown table. */
export function humanizeFactor(factor: string): string {
  const words = factor.replace(/_/g, " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}
