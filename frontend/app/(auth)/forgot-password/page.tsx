import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPasswordPage() {
  return (
    <>
      <h1 className="mt-8 text-lg font-medium">Reset your password</h1>
      <p className="text-muted-foreground mt-1 mb-7 text-sm">
        Enter your email and we&apos;ll send a link to set a new password. The
        link works once and expires after an hour.
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

        <Button type="submit" size="lg" className="w-full">
          Send reset link
        </Button>
      </form>

      <p className="text-muted-foreground mt-6 text-xs">
        Remembered it?{" "}
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
