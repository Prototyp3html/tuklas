import Link from "next/link";

/**
 * Auth pages render outside the AppShell — there is no navigation to offer
 * someone who isn't signed in yet.
 */
export default function AuthLayout({ children }: LayoutProps<"/"> ) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-[22rem]">
        <Link
          href="/"
          className="record-heading focus-visible:ring-ring inline-block rounded-xs text-2xl focus-visible:ring-2 focus-visible:outline-none"
        >
          Tuklas
        </Link>
        {children}
      </div>
    </main>
  );
}
