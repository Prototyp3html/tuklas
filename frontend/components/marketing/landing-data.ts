import type { DossierData } from "./dossier";

/**
 * Copy and illustrative figures for the landing page. The funnel volumes
 * (1,000 → 50) are the product's real architectural design targets. The
 * results metrics are illustrative and labelled as such on the page.
 */

export const HERO_DOSSIER: DossierData = {
  business: "Kristine's Beauty Lounge",
  location: "Tetuan, Zamboanga City",
  category: "Salon",
  lines: [
    { kind: "gap", claim: "No website", source: "google.com/maps", weight: 30 },
    {
      kind: "gap",
      claim: "Takes bookings in Facebook comments",
      source: "facebook.com",
      weight: 18,
    },
    {
      kind: "strength",
      claim: "Posts to Facebook weekly",
      source: "facebook.com",
      weight: 16,
    },
    {
      kind: "strength",
      claim: "340 reviews · 4.6 stars",
      source: "google.com/maps",
      weight: 14,
    },
  ],
};

export const EXHIBIT_DOSSIER: DossierData = {
  business: "Bahia Seafood Grill",
  location: "Guiwan, Zamboanga City",
  category: "Restaurant",
  lines: [
    {
      kind: "gap",
      claim: "No website",
      source: "google.com/maps",
      weight: 30,
    },
    {
      kind: "gap",
      claim: "No online ordering or reservations",
      source: "facebook.com",
      weight: 20,
    },
    {
      kind: "gap",
      claim: "Menu only exists as photos in a 2023 post",
      source: "facebook.com",
      weight: 12,
    },
    {
      kind: "strength",
      claim: "Active on Facebook, replies to comments",
      source: "facebook.com",
      weight: 9,
    },
    {
      kind: "strength",
      claim: "210 reviews · 4.5 stars",
      source: "google.com/maps",
      weight: 6,
    },
  ],
  recommendation:
    "Pitch a one-page site with a live menu and a reservation form. Lead with the ordering gap — they are turning enquiries into a comment thread.",
};

export const PROBLEM_PAINS = [
  {
    title: "Prospecting eats the week",
    body: "Hours in Maps and Facebook, opening tabs, checking whether a place already has a site. None of it is billable.",
  },
  {
    title: "A listing hides who needs you",
    body: "A salon with a tidy site is not a prospect. One taking bookings in comments is. From the listing they look the same.",
  },
  {
    title: "Cold outreach lands nowhere",
    body: "A generic message to a business you know nothing about reads like every other generic message that week.",
  },
];

export const PROBLEM_ANSWERS = [
  {
    title: "One ranked list",
    body: "Every business already filtered to your service, your industries, your city. Sorted by how much opportunity is in it.",
  },
  {
    title: "The gap is a number, sourced",
    body: "“No website, +30” links to the Maps listing it came from. You can check the claim before you dial.",
  },
  {
    title: "A draft built from evidence",
    body: "The outreach references what was actually observed about that business. You edit it and send it yourself.",
  },
];

export type Stage = {
  n: string;
  name: string;
  verb: string;
  body: string;
  volume: number;
  drop?: string;
};

export const STAGES: Stage[] = [
  {
    n: "01",
    name: "Discovery",
    verb: "Walk the listings",
    body: "Sweep public directories for every business matching your service and city.",
    volume: 1000,
  },
  {
    n: "02",
    name: "Research",
    verb: "Drop the noise",
    body: "Remove duplicates, closed places, and the wrong categories.",
    volume: 400,
    drop: "600 dropped — duplicate or wrong category",
  },
  {
    n: "03",
    name: "Audit",
    verb: "Check what exists",
    body: "Visit each site and profile. Record what is there and what is missing, with the URL.",
    volume: 200,
    drop: "200 dropped — no reachable presence to assess",
  },
  {
    n: "04",
    name: "Scoring",
    verb: "Weigh the evidence",
    body: "Add up the gaps and strengths into one opportunity score per business.",
    volume: 100,
    drop: "100 dropped — below your score threshold",
  },
  {
    n: "05",
    name: "Outreach",
    verb: "Draft the opener",
    body: "Write a first message from the evidence. Nothing sends without you.",
    volume: 50,
    drop: "50 ready to contact",
  },
];

export const TRUST_STEPS = [
  { label: "Scan listing", detail: "Maps, directories, socials" },
  { label: "Fetch page", detail: "the real site, if there is one" },
  { label: "Parse signals", detail: "booking, menu, hours, contact" },
  { label: "Weigh evidence", detail: "gaps and strengths, scored" },
  { label: "Cite source", detail: "every point links out" },
];

export const RESULT_METRICS = [
  {
    value: 1000,
    suffix: "",
    label: "businesses swept per campaign",
    note: "design target",
  },
  {
    value: 58,
    suffix: "%",
    label: "had a gap worth pitching",
    note: "illustrative — pilot testing",
  },
  {
    value: 30000,
    prefix: "₱",
    label: "typical value of a first booked project",
    note: "illustrative — pilot testing",
  },
];

export const FUNNEL = [
  { label: "Discovered", value: 1000 },
  { label: "Researched", value: 400 },
  { label: "Audited", value: 200 },
  { label: "Scored", value: 100 },
  { label: "Ready to contact", value: 50 },
];

export const EARLY_NOTES = [
  {
    quote:
      "I used to spend Saturday mornings scrolling Maps. Now I open the list and start calling.",
    who: "Freelance web developer, Zamboanga City",
  },
  {
    quote:
      "The source links are the part that matters. I can check a claim before I pick up the phone.",
    who: "Small agency owner, Pagadian",
  },
];
