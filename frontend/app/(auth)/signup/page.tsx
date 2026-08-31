import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SignupPage() {
  return (
    <>
      <h1 className="mt-8 text-lg font-medium">Create your account</h1>
      <p className="text-muted-foreground mt-1 mb-7 text-sm">
        Then four questions about what you sell, and your first campaign can
        run.
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
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={10}
            required
            className="mt-2 w-full"
          />
          <p className="text-muted-foreground mt-1.5 text-xs">
            At least 10 characters.
          </p>
        </div>

        <Button type="submit" size="lg" className="w-full">
          Create account
        </Button>
      </form>

      <p className="text-muted-foreground mt-6 text-xs">
        Already have an account?{" "}
        <Link
          href="/login"
          className="text-foreground focus-visible:ring-ring rounded-xs underline underline-offset-2 focus-visible:ring-2 focus-visible:outline-none"
        >
          Sign in
        </Link>
        .
      </p>
    </>
  );
}
