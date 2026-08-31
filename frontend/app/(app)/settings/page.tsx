import { SettingsView } from "@/components/settings/settings-view";
import { USER_PROFILE } from "@/lib/mock-data";

export default function SettingsPage() {
  return (
    <div>
      <header className="border-rule border-b pb-5">
        <h1 className="page-title text-2xl">Settings</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Your profile, your targeting, and what TUKLAS is allowed to
          interrupt you for.
        </p>
      </header>

      <SettingsView profile={USER_PROFILE} />
    </div>
  );
}
