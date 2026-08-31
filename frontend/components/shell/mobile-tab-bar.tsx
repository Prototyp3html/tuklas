"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { MOBILE_NAV_ITEMS, isActive } from "./nav-items";

/**
 * Replaces the sidebar under 768px. Filipino freelancers work on phones
 * constantly, so this is a first-class surface. Targets clear 44px and the
 * iOS home indicator.
 */
export function MobileTabBar() {
  const pathname = usePathname();

  return (
    <nav className="bg-sheet border-rule fixed inset-x-0 bottom-0 z-40 border-t pb-[env(safe-area-inset-bottom)] md:hidden">
      <ul className="flex">
        {MOBILE_NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "focus-visible:ring-ring flex min-h-[3.25rem] flex-col items-center justify-center gap-1 px-1 py-2 text-[0.6875rem] transition-colors focus-visible:-outline-offset-2 focus-visible:ring-2 focus-visible:outline-none",
                  active
                    ? "text-foreground font-medium"
                    : "text-muted-foreground",
                )}
              >
                <Icon
                  aria-hidden
                  className={cn("size-5", active && "text-verify")}
                />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
