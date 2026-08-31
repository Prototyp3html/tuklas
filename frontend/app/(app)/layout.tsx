import { AppShell } from "@/components/shell/app-shell";

/**
 * Every signed-in surface renders inside the shell. The `(auth)` group sits
 * outside it deliberately — login has no navigation to offer.
 */
export default function AppGroupLayout({ children }: LayoutProps<"/">) {
  return <AppShell>{children}</AppShell>;
}
