"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { formatPeso } from "@/lib/format";
import type { UserProfile } from "@/lib/types";
import { ChipInput } from "./chip-input";
import { ScoreSlider } from "./score-slider";

const TABS = [
  { value: "profile", label: "Profile" },
  { value: "account", label: "Account" },
  { value: "targeting", label: "Targeting" },
  { value: "notifications", label: "Notifications" },
  { value: "billing", label: "Billing" },
];

function Card({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-rule bg-sheet rounded-xl border p-6 shadow-[0_1px_2px_rgba(26,29,26,0.04)]">
      <h2 className="text-[0.95rem] font-semibold tracking-tight">{title}</h2>
      {description && (
        <p className="text-muted-foreground mt-1 text-sm">{description}</p>
      )}
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Field({
  label,
  hint,
  htmlFor,
  children,
}: {
  label: string;
  hint?: string;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label htmlFor={htmlFor}>{label}</Label>
      <div className="mt-2">{children}</div>
      {hint && <p className="text-muted-foreground mt-1.5 text-xs">{hint}</p>}
    </div>
  );
}

export function SettingsView({ profile }: { profile: UserProfile }) {
  return (
    <Tabs defaultValue="targeting" className="mt-6">
      <TabsList variant="line" className="border-rule w-full justify-start gap-1 border-b pb-0">
        {TABS.map((t) => (
          <TabsTrigger
            key={t.value}
            value={t.value}
            className="flex-none px-3 pb-2"
          >
            {t.label}
          </TabsTrigger>
        ))}
      </TabsList>

      <TabsContent value="profile" className="pt-6">
        <ProfilePanel profile={profile} />
      </TabsContent>
      <TabsContent value="account" className="pt-6">
        <AccountPanel email={profile.email} />
      </TabsContent>
      <TabsContent value="targeting" className="pt-6">
        <TargetingPanel profile={profile} />
      </TabsContent>
      <TabsContent value="notifications" className="pt-6">
        <NotificationsPanel />
      </TabsContent>
      <TabsContent value="billing" className="pt-6">
        <BillingPanel />
      </TabsContent>
    </Tabs>
  );
}

/* -- Profile ------------------------------------------------------------- */

function ProfilePanel({ profile }: { profile: UserProfile }) {
  return (
    <div className="max-w-xl">
      <Card
        title="Your profile"
        description="What you sell, in your own words. It shapes every sales angle the model writes."
      >
        <form className="flex flex-col gap-6">
          <Field label="Name" htmlFor="name">
            <Input id="name" defaultValue="Jones Sevilla" />
          </Field>
          <Field label="Email" htmlFor="email">
            <Input id="email" type="email" defaultValue={profile.email} />
          </Field>
          <Field
            label="Services you offer"
            htmlFor="services"
            hint="One per line."
          >
            <Textarea
              id="services"
              defaultValue={profile.services.join("\n")}
              className="min-h-24"
            />
          </Field>
          <Field
            label="Notes on what makes a good lead"
            htmlFor="icp"
            hint="Passed to the model when it writes the sales angle."
          >
            <Textarea
              id="icp"
              defaultValue={profile.icpNotes}
              className="min-h-28"
            />
          </Field>
          <div>
            <Button type="button" onClick={() => toast.success("Profile saved")}>
              Save changes
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

/* -- Account ----------------------------------------------------------- */

function AccountPanel({ email }: { email: string }) {
  return (
    <div className="flex max-w-xl flex-col gap-4">
      <Card title="Sign-in" description="How you get into TUKLAS.">
        <div className="flex flex-col gap-4">
          <Field label="Email">
            <Input defaultValue={email} type="email" />
          </Field>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Password</p>
              <p className="text-muted-foreground text-xs">
                Last changed 3 months ago.
              </p>
            </div>
            <Button variant="outline" size="sm" type="button">
              Change password
            </Button>
          </div>
          <Field label="Time zone">
            <Select defaultValue="pht">
              <SelectTrigger className="w-full">
                <span className="text-sm">Philippine Time (UTC+8)</span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pht">Philippine Time (UTC+8)</SelectItem>
                <SelectItem value="sgt">Singapore Time (UTC+8)</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>
      </Card>

      <Card
        title="Delete account"
        description="Removes your campaigns, leads and drafts. This can't be undone."
      >
        <Button
          variant="destructive"
          size="sm"
          type="button"
          disabled
          title="Contact support to close your account"
        >
          Delete account
        </Button>
      </Card>
    </div>
  );
}

/* -- Targeting -------------------------------------------------------- */

function TargetingPanel({ profile }: { profile: UserProfile }) {
  const [locations, setLocations] = useState(profile.targetLocations);
  const [categories, setCategories] = useState(profile.targetIndustries);
  const [excludes, setExcludes] = useState<string[]>([
    "Franchises",
    "Chains with 3+ branches",
  ]);
  const [size, setSize] = useState("any");
  const [minScore, setMinScore] = useState(60);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
      <Card
        title="Targeting preferences"
        description="Every campaign scores businesses against this. Industry and location matches are two of the ten scoring factors."
      >
        <div className="flex flex-col gap-6">
          <Field label="Locations" hint="A match is worth 10 points.">
            <ChipInput
              values={locations}
              onChange={setLocations}
              ariaLabel="Target locations"
              placeholder="Add a city or municipality…"
            />
          </Field>
          <Field label="Business categories" hint="A match is worth 20 points.">
            <ChipInput
              values={categories}
              onChange={setCategories}
              ariaLabel="Target business categories"
              placeholder="Add an industry…"
            />
          </Field>
          <Field label="Business size">
            <Select
              value={size}
              onValueChange={(v) => setSize(v ?? "any")}
            >
              <SelectTrigger className="w-full">
                <span className="text-sm">
                  {size === "any"
                    ? "Any size"
                    : size === "small"
                      ? "Small (1–2 locations)"
                      : "Independent only"}
                </span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any size</SelectItem>
                <SelectItem value="small">Small (1–2 locations)</SelectItem>
                <SelectItem value="independent">Independent only</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Exclude">
            <ChipInput
              values={excludes}
              onChange={setExcludes}
              ariaLabel="Exclusions"
              placeholder="Add an exclusion…"
            />
          </Field>
          <Field label="Minimum opportunity score">
            <ScoreSlider value={minScore} onChange={setMinScore} />
          </Field>
        </div>
      </Card>

      <div className="border-rule bg-sheet h-fit rounded-xl border p-5 shadow-[0_1px_2px_rgba(26,29,26,0.04)]">
        <h3 className="text-[0.95rem] font-semibold tracking-tight">
          Your targeting summary
        </h3>
        <dl className="mt-4 flex flex-col gap-3 text-sm">
          <SummaryRow label="Locations" value={`${locations.length}`} />
          <SummaryRow label="Categories" value={`${categories.length}`} />
          <SummaryRow label="Exclusions" value={`${excludes.length}`} />
          <SummaryRow label="Minimum score" value={`${minScore}`} />
          <SummaryRow
            label="Price floor"
            value={formatPeso(profile.priceRangeMin)}
          />
        </dl>
        <Button
          type="button"
          className="mt-5 w-full"
          onClick={() => toast.success("Targeting preferences saved")}
        >
          Save preferences
        </Button>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="tabular font-medium">{value}</dd>
    </div>
  );
}

/* -- Notifications -------------------------------------------------- */

const NOTIFS = [
  {
    id: "campaign-finished",
    label: "Campaign finished",
    hint: "When a run completes and leads are ready.",
    on: true,
  },
  {
    id: "high-priority",
    label: "New high-priority lead",
    hint: "A lead scores 80 or above.",
    on: true,
  },
  {
    id: "reply",
    label: "Reply received",
    hint: "A business replies to your outreach.",
    on: false,
  },
];

function NotificationsPanel() {
  return (
    <div className="max-w-xl">
      <Card
        title="Email notifications"
        description="TUKLAS is quiet by default. Turn on what's worth interrupting you."
      >
        <ul className="divide-rule -my-2 divide-y">
          {NOTIFS.map((n) => (
            <li
              key={n.id}
              className="flex items-center justify-between gap-4 py-3"
            >
              <div>
                <p className="text-sm font-medium">{n.label}</p>
                <p className="text-muted-foreground text-xs">{n.hint}</p>
              </div>
              <Toggle defaultOn={n.on} label={n.label} />
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

function Toggle({ defaultOn, label }: { defaultOn: boolean; label: string }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => setOn(!on)}
      className={`focus-visible:ring-ring relative h-5 w-9 shrink-0 rounded-full transition-colors duration-150 focus-visible:ring-2 focus-visible:outline-none ${
        on ? "bg-verify" : "bg-band"
      }`}
    >
      <span
        className={`bg-sheet absolute top-0.5 size-4 rounded-full shadow-sm transition-transform duration-150 ${
          on ? "translate-x-4" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

/* -- Billing ------------------------------------------------------- */

function BillingPanel() {
  return (
    <div className="flex max-w-xl flex-col gap-4">
      <Card title="Plan" description="You're on the free plan while TUKLAS is in beta.">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium">Free</p>
            <p className="text-muted-foreground text-xs">
              Unlimited campaigns during beta · no card on file
            </p>
          </div>
          <Button variant="outline" size="sm" type="button" disabled>
            Upgrade
          </Button>
        </div>
      </Card>
      <Card title="Usage this month">
        <div className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between text-sm">
            <span>Campaigns run</span>
            <span className="tabular text-muted-foreground">3 of ∞</span>
          </div>
          <div className="bg-band h-1.5 overflow-hidden rounded-full">
            <div className="bg-verify h-full w-1/4 rounded-full" />
          </div>
        </div>
      </Card>
    </div>
  );
}
