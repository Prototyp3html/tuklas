"use client";

import { useSyncExternalStore } from "react";

import { cn } from "@/lib/utils";
import { MobileTabBar } from "./mobile-tab-bar";
import { SidebarNav } from "./sidebar-nav";
import { TopBar } from "./top-bar";

const STORAGE_KEY = "tuklas.sidebar";
const CHANGE_EVENT = "tuklas:sidebar";

function readCollapsed(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "collapsed";
  } catch {
    return false;
  }
}

function setCollapsed(next: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, next ? "collapsed" : "expanded");
  } catch {
    // storage unavailable — the toggle just won't persist
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

/** Subscribes to the persisted collapse choice; same-tab writes re-render via
 *  a custom event, other tabs via `storage`. */
function useCollapsed(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      window.addEventListener(CHANGE_EVENT, onChange);
      window.addEventListener("storage", onChange);
      return () => {
        window.removeEventListener(CHANGE_EVENT, onChange);
        window.removeEventListener("storage", onChange);
      };
    },
    readCollapsed,
    () => false,
  );
}

/**
 * Wraps App routes only. The sidebar collapse state lives here so the rail
 * width and the content offset stay in step. Public, auth and onboarding
 * pages render without this.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const collapsed = useCollapsed();

  return (
    <div
      className={cn(
        "transition-[padding] duration-200 ease-out",
        collapsed ? "md:pl-16" : "md:pl-56",
      )}
    >
      <SidebarNav
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
      />
      <TopBar />
      <main className="mx-auto w-full max-w-[1440px] px-4 pt-6 pb-24 sm:px-6 md:px-10 md:py-10 md:pb-20">
        {children}
      </main>
      <MobileTabBar />
    </div>
  );
}
