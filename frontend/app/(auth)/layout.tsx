import Link from "next/link";

import { Logo } from "@/components/brand/logo";

/**
 * Auth pages render outside the AppShell — there is no navigation to offer
 * someone who isn't signed in yet.
 */
export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-[22rem]">
        <Link
          href="/"
          aria-label="TUKLAS — home"
          className="text-foreground focus-visible:ring-ring inline-flex rounded-xs focus-visible:ring-2 focus-visible:outline-none"
        >
          <Logo size={28} wordmarkClassName="text-[1.5rem]" />
        </Link>
        {children}
      </div>
    </main>
  );
}
