import { Logo } from "@/components/brand/logo";

export function LandingFooter() {
  return (
    <footer className="bg-[var(--lp-paper)]">
      <div className="mx-auto flex w-full max-w-[1120px] flex-col gap-4 px-5 py-10 text-[0.8125rem] text-[var(--lp-muted)] sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <Logo
          size={20}
          wordmarkClassName="text-[0.95rem]"
          className="text-[var(--lp-ink)]"
        />
        <nav className="flex flex-wrap gap-x-6 gap-y-2">
          <a
            href="/login"
            className="transition-colors duration-150 hover:text-[var(--lp-ink)]"
          >
            Sign in
          </a>
          <a
            href="/signup"
            className="transition-colors duration-150 hover:text-[var(--lp-ink)]"
          >
            Create account
          </a>
          {/* Privacy and Terms live here once written — omitted rather than
              linked to 404s before public launch. */}
        </nav>
        <span className="lp-data text-xs">Zamboanga City, Philippines</span>
      </div>
    </footer>
  );
}
