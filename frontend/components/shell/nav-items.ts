import {
  BarChart3,
  Gauge,
  ListChecks,
  Radar,
  Rows3,
  Send,
  Settings2,
  Star,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

/** Primary destinations. */
export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: Gauge },
  { href: "/campaigns", label: "Campaigns", icon: Radar },
  { href: "/leads", label: "Leads", icon: Rows3 },
  { href: "/outreach", label: "Outreach", icon: Send },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings2 },
];

/** Saved collections — lighter-weight than the primary nav. */
export const PAGE_ITEMS: NavItem[] = [
  { href: "/favorites", label: "Favorites", icon: Star },
  { href: "/lists", label: "Lists", icon: ListChecks },
];

/** Part 5's mobile bottom bar is five tabs — Analytics drops off. */
export const MOBILE_NAV_ITEMS: NavItem[] = NAV_ITEMS.filter(
  (item) => item.href !== "/analytics",
);

/** `/leads/abc` should light up `/leads`, but `/` must not light up everything. */
export function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
