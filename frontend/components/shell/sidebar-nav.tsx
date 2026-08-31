"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";

import { Logo } from "@/components/brand/logo";
import { cn } from "@/lib/utils";
import { NAV_ITEMS, PAGE_ITEMS, type NavItem, isActive } from "./nav-items";

/**
 * Labelled left navigation, desktop only. Collapses to a 64px icon rail; the
 * choice persists (see AppShell). The mobile equivalent is MobileTabBar.
 */
export function SidebarNav({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  const pathname = usePathname();

  return (
    <aside
      data-collapsed={collapsed || undefined}
      className={cn(
        "bg-sheet border-rule fixed inset-y-0 left-0 z-40 hidden flex-col border-r px-3 py-4 transition-[width] duration-200 ease-out md:flex",
        collapsed ? "w-16 items-center" : "w-56",
      )}
    >
      <div
        className={cn(
          "flex items-center",
          collapsed ? "flex-col gap-3" : "justify-between",
        )}
      >
        <Link
          href="/dashboard"
          aria-label="TUKLAS — home"
          className="text-foreground focus-visible:ring-ring rounded-md focus-visible:ring-2 focus-visible:outline-none"
        >
          <Logo size={22} wordmark={!collapsed} />
        </Link>
        <button
          type="button"
          onClick={onToggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="text-muted-foreground hover:bg-band/60 hover:text-foreground focus-visible:ring-ring grid size-7 shrink-0 place-items-center rounded-md transition-colors duration-150 focus-visible:ring-2 focus-visible:outline-none"
        >
          {collapsed ? (
            <PanelLeftOpen aria-hidden className="size-4" />
          ) : (
            <PanelLeftClose aria-hidden className="size-4" />
          )}
        </button>
      </div>

      <nav className="mt-6 flex flex-1 flex-col gap-0.5">
        <Group label="Main" items={NAV_ITEMS} pathname={pathname} collapsed={collapsed} />
        <Group
          label="Pages"
          items={PAGE_ITEMS}
          pathname={pathname}
          collapsed={collapsed}
          className="mt-6"
        />
      </nav>

      <Link
        href="/settings"
        title="Jones Sevilla"
        className={cn(
          "hover:bg-band/60 focus-visible:ring-ring mt-2 flex items-center gap-2.5 rounded-lg px-2 py-2 transition-colors duration-150 focus-visible:ring-2 focus-visible:outline-none",
          collapsed && "px-0",
        )}
      >
        <span
          aria-hidden
          className="bg-band text-muted-foreground tabular grid size-7 shrink-0 place-items-center rounded-full text-[0.6875rem]"
        >
          JS
        </span>
        {!collapsed && (
          <span className="min-w-0">
            <span className="block truncate text-sm">Jones Sevilla</span>
            <span className="text-muted-foreground block truncate text-xs">
              Free plan
            </span>
          </span>
        )}
      </Link>
    </aside>
  );
}

function Group({
  label,
  items,
  pathname,
  collapsed,
  className,
}: {
  label: string;
  items: NavItem[];
  pathname: string;
  collapsed: boolean;
  className?: string;
}) {
  return (
    <div className={className}>
      {!collapsed && (
        <p className="text-muted-foreground px-2.5 pb-1 text-[0.625rem] font-medium tracking-[0.1em] uppercase">
          {label}
        </p>
      )}
      <div className="flex flex-col gap-0.5">
        {items.map(({ href, label: itemLabel, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? itemLabel : undefined}
              aria-label={collapsed ? itemLabel : undefined}
              aria-current={active ? "page" : undefined}
              className={cn(
                "focus-visible:ring-ring flex items-center gap-2.5 rounded-lg text-sm transition-colors duration-150 focus-visible:ring-2 focus-visible:outline-none",
                collapsed ? "size-10 justify-center" : "px-2.5 py-2",
                active
                  ? "bg-band text-foreground font-medium"
                  : "text-muted-foreground hover:bg-band/60 hover:text-foreground",
              )}
            >
              <Icon
                aria-hidden
                className={cn("size-[1.05rem] shrink-0", active && "text-verify")}
              />
              {!collapsed && itemLabel}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
