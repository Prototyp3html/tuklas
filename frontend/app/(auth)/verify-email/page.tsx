import Link from "next/link";

import { Button } from "@/components/ui/button";

/**
 * Two states, both reached by URL: waiting for the user to open their email
 * (no token), and the result of following the link (token present).
 */
export default async function VerifyEmailPage({
  searchParams,
}: PageProps<"/verify-email">) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <>
        <h1 className="mt-8 text-lg font-medium">Check your email</h1>
        <p className="text-muted-foreground mt-1 mb-7 text-sm leading-6">
          We sent a verification link to the address you signed up with. Open
          it and you&apos;ll land back here, ready to set up your first
          campaign.
        </p>
        <p className="text-muted-foreground text-xs leading-5">
          Nothing after a few minutes? Check spam, then{" "}
          <button
            type="button"
            className="text-foreground focus-visible:ring-ring rounded-xs underline underline-offset-2 focus-visible:ring-2 focus-visible:outline-none"
          >
            send it again
          </button>
          .
        </p>
      </>
    );
  }

  return (
    <>
      <h1 className="mt-8 text-lg font-medium">Email verified</h1>
      <p className="text-muted-foreground mt-1 mb-7 text-sm leading-6">
        Your account is ready. Next you&apos;ll tell TUKLAS what you sell and
        who you sell it to — that&apos;s what every campaign scores against.
      </p>
      <Button size="lg" className="w-full" render={<Link href="/dashboard" />}>
        Continue
      </Button>
    </>
  );
}
