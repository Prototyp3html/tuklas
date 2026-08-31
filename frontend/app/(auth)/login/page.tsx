import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  return (
    <>
      <h1 className="mt-8 text-lg font-medium">Sign in</h1>
      <p className="text-muted-foreground mt-1 mb-7 text-sm">
        Pick up where your last campaign left off.
      </p>

      <form className="flex flex-col gap-5">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="mt-2 w-full"
          />
        </div>

        <div>
          <div className="flex items-baseline justify-between">
            <Label htmlFor="password">Password</Label>
            <Link
              href="/forgot-password"
              className="text-muted-foreground hover:text-foreground focus-visible:ring-ring rounded-xs text-xs transition-colors focus-visible:ring-2 focus-visible:outline-none"
            >
              Forgot password?
            </Link>
          </div>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="mt-2 w-full"
          />
        </div>

        <Button type="submit" size="lg" className="w-full">
          Sign in
        </Button>
      </form>

      <p className="text-muted-foreground mt-6 text-xs">
        No account yet?{" "}
        <Link
          href="/signup"
          className="text-foreground focus-visible:ring-ring rounded-xs underline underline-offset-2 focus-visible:ring-2 focus-visible:outline-none"
        >
          Create one
        </Link>
        .
      </p>
    </>
  );
}
