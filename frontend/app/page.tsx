import type { Metadata } from "next";
import { Bricolage_Grotesque, Newsreader } from "next/font/google";

import { Landing } from "@/components/marketing/landing";

// Marketing-only faces, declared here so they load for `/` and nowhere else.
// Grotesque for what the writer concludes; a reading serif for the argument;
// DM Mono (from the root layout) for anything TUKLAS measured.
const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  display: "swap",
});

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "TUKLAS — discover businesses that already need what you sell",
  description:
    "Give TUKLAS a service, an industry, and a city. Get back local Philippine businesses ranked by opportunity, each with cited evidence you can open and check.",
};

export default function LandingPage() {
  return (
    <div className={`${bricolage.variable} ${newsreader.variable}`}>
      <Landing />
    </div>
  );
}
