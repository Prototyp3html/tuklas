import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * The reset token arrives as `?token=`. Missing or expired tokens get an
 * explanation and a way forward rather than a blank form that fails on submit.
 */
export default async function ResetPasswordPage({
  searchParams,
}: PageProps<"/reset-password">) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <>
        <h1 className="mt-8 text-lg font-medium">This link is incomplete</h1>
        <p className="text-muted-foreground mt-1 mb-7 text-sm">
          The reset link is missing its token, which usually means it was cut
          short by an email client. Request a new one and open it directly.
        </p>
        <Button
          size="lg"
          className="w-full"
          render={<Link href="/forgot-password" />}
        >
          Request a new link
        </Button>
      </>
    );
  }

  return (
    <>
      <h1 className="mt-8 text-lg font-medium">Set a new password</h1>
      <p className="text-muted-foreground mt-1 mb-7 text-sm">
        Choose something you haven&apos;t used here before.
      </p>

      <form className="flex flex-col gap-5">
        <div>
          <Label htmlFor="password">New password</Label>
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

        <div>
          <Label htmlFor="confirm">Confirm new password</Label>
          <Input
            id="confirm"
            name="confirm"
            type="password"
            autoComplete="new-password"
            minLength={10}
            required
            className="mt-2 w-full"
          />
        </div>

        <Button type="submit" size="lg" className="w-full">
          Save password
        </Button>
      </form>
    </>
  );
}
