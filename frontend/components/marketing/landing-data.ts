/**
 * Copy and illustrative figures for the marketing landing. Numbers are
 * illustrative — labelled as such on the page.
 */

/* -- hero dossier -------------------------------------------------- */

export type HeroEvidence = { label: string; kind: "gap" | "signal" };
export type HeroSource = { name: string; detail: string };

export const HERO_PROFILE = {
  business: "Café Amihan",
  location: "Guiwan, Zamboanga City",
  category: "Café",
  score: 92,
  tag: "High potential",
  evidence: [
    { label: "No online booking", kind: "gap" },
    { label: "High customer demand", kind: "signal" },
    { label: "Active on social media", kind: "signal" },
    { label: "High foot-traffic area", kind: "signal" },
  ] as HeroEvidence[],
  service: {
    name: "Online booking system",
    blurb: "Let regulars hold a table without the Messenger back-and-forth.",
    priceRange: "₱25,000 – ₱35,000",
  },
  sources: [
    { name: "Facebook Page", detail: "posts, hours, enquiries" },
    { name: "Google Maps", detail: "reviews, foot traffic" },
    { name: "Website scan", detail: "no booking, no site" },
  ] as HeroSource[],
};

/* -- how TUKLAS works ------------------------------------------- */

export type Stage = {
  n: string;
  name: string;
  blurb: string;
  icon: "compass" | "research" | "audit" | "score" | "outreach";
};

export const STAGES: Stage[] = [
  {
    n: "1",
    name: "Discovery",
    blurb:
      "We scan the market to find active local businesses in your area.",
    icon: "compass",
  },
  {
    n: "2",
    name: "Research",
    blurb:
      "We collect digital signals — reviews, social activity, and contactability.",
    icon: "research",
  },
  {
    n: "3",
    name: "Audit",
    blurb:
      "Our AI audits each digital presence to find gaps and missed opportunities.",
    icon: "audit",
  },
  {
    n: "4",
    name: "Score",
    blurb:
      "We score each business on fit, urgency, and confidence.",
    icon: "score",
  },
  {
    n: "5",
    name: "Outreach",
    blurb:
      "Get a ranked list, pitch suggestions, and ready-to-send messages.",
    icon: "outreach",
  },
];

/* -- proof section: the checklist + the sample dossier ---------- */

export const PROOF_POINTS = [
  "Source links you can verify",
  "Confidence scores you can trust",
  "Insights you can act on",
  "Pitches that convert",
];

export const SAMPLE_DOSSIER = {
  business: "Café Amihan",
  location: "Guiwan, Zamboanga City",
  tags: ["Non-ceramic", "Salon"],
  score: 92,
  timeline: [
    { title: "No online booking found", detail: "Website scan", at: "May 28" },
    { title: "Active Facebook page", detail: "23 posts this month", at: "May 28" },
    { title: "High customer demand", detail: "4.6★ from 128 reviews", at: "May 27" },
    { title: "Busy foot-traffic area", detail: "Near a commercial strip", at: "May 26" },
  ],
  insight:
    "Regulars keep asking to reserve tables in the comments, but the café still books everything by hand.",
  service: {
    name: "Online booking system",
    blurb: "Let customers book tables and events online, 24/7.",
    priceRange: "₱25,000 – ₱35,000",
  },
};

/* -- stats band ----------------------------------------------- */

export type Stat = {
  icon: "scan" | "target" | "reply" | "revenue";
  value: number;
  display: (n: number) => string;
  label: string;
  sub: string;
};

export const STATS: Stat[] = [
  {
    icon: "scan",
    value: 12548,
    display: (n) => `${Math.round(n).toLocaleString()}+`,
    label: "Businesses scanned",
    sub: "Across Zamboanga & Pagadian",
  },
  {
    icon: "target",
    value: 3482,
    display: (n) => `${Math.round(n).toLocaleString()}+`,
    label: "Opportunities found",
    sub: "High-potential matches",
  },
  {
    icon: "reply",
    value: 28.6,
    display: (n) => `${n.toFixed(1)}%`,
    label: "Avg. reply rate",
    sub: "From outreach campaigns",
  },
  {
    icon: "revenue",
    value: 1.4,
    display: (n) => `₱${n.toFixed(1)}M+`,
    label: "Revenue generated",
    sub: "By freelancers on TUKLAS",
  },
];
