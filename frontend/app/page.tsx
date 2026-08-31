import type { Metadata } from "next";
import { Newsreader } from "next/font/google";

import { Landing } from "@/components/marketing/landing";

// Marketing body face. Headings use Cormorant Garamond (root layout), data
// uses DM Mono (root layout).
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
    <div className={newsreader.variable}>
      <Landing />
    </div>
  );
}
