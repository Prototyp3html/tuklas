/**
 * Fixtures standing in for the API until the backend exists.
 *
 * These are shaped exactly like `lib/types.ts`, so the screens built against
 * them are already built against the real contract. Replace the reads in the
 * page components with `api()` calls; nothing else should need to change.
 *
 * Scores are *computed* from the evidence weights rather than written by hand,
 * so the ledger on the lead page always sums to its total by construction.
 */

import { scoreTier } from "./format";
import type {
  ActivityEvent,
  AgentRun,
  Campaign,
  CampaignProgress,
  DashboardSnapshot,
  EvidenceRow,
  LeadDetail,
  LeadStatus,
  LeadSummary,
  OutreachDraft,
  OutreachThread,
  ScoreFactor,
  UserProfile,
} from "./types";

/* -------------------------------------------------------------------------- */
/* Evidence construction                                                       */
/* -------------------------------------------------------------------------- */

const COLLECTED = "2026-08-29T09:14:00+08:00";

type EvidenceSeed = {
  factor: ScoreFactor;
  claim: string;
  observed: string;
  source: string;
  confidence?: number;
};

/** Weights from BUILD_GUIDE Part 3, Milestone 7. */
const WEIGHTS: Record<ScoreFactor, number> = {
  no_website: 30,
  broken_website: 25,
  outdated_website: 15,
  no_booking: 20,
  no_ordering: 15,
  active_social: 20,
  high_review_count: 15,
  contactable: 10,
  industry_match: 20,
  location_match: 10,
};

/** A missing thing is an opportunity; a present thing is a signal. */
const GAP_FACTORS = new Set<ScoreFactor>([
  "no_website",
  "broken_website",
  "outdated_website",
  "no_booking",
  "no_ordering",
]);

function buildEvidence(leadId: string, seeds: EvidenceSeed[]): EvidenceRow[] {
  return seeds.map((seed, i) => ({
    id: `${leadId}-ev-${i + 1}`,
    claim: seed.claim,
    observedValue: seed.observed,
    sourceUrl: seed.source,
    collectedAt: COLLECTED,
    confidence: seed.confidence ?? 0.95,
    kind: GAP_FACTORS.has(seed.factor) ? "gap" : "strength",
    weight: WEIGHTS[seed.factor],
    factor: seed.factor,
  }));
}

type LeadSeed = {
  id: string;
  businessName: string;
  location: string;
  address: string;
  category: string;
  phone: string | null;
  domain: string | null;
  status: LeadStatus;
  hasWebsite: boolean;
  recommendedService: string;
  salesAngle: string;
  reasoning: string;
  confidence: number;
  evidence: EvidenceSeed[];
};

function buildLead(seed: LeadSeed): LeadDetail {
  const evidence = buildEvidence(seed.id, seed.evidence);
  const score = evidence.reduce((sum, row) => sum + (row.weight ?? 0), 0);
  const breakdown: Partial<Record<ScoreFactor, number>> = {};
  for (const row of evidence) {
    if (row.factor) breakdown[row.factor] = row.weight ?? 0;
  }

  const gaps = evidence.filter((e) => e.kind === "gap").map((e) => e.claim);

  return {
    id: seed.id,
    businessName: seed.businessName,
    location: seed.location,
    address: seed.address,
    category: seed.category,
    phone: seed.phone,
    domain: seed.domain,
    campaignId: "camp-salons-zc",
    score,
    tier: scoreTier(score),
    status: seed.status,
    evidenceCount: evidence.length,
    hasWebsite: seed.hasWebsite,
    evidence,
    breakdown,
    audit: {
      hasWebsite: seed.hasWebsite,
      websiteStatus: seed.hasWebsite ? "outdated" : "none",
      hasBooking: !seed.evidence.some((e) => e.factor === "no_booking"),
      hasOrdering: !seed.evidence.some((e) => e.factor === "no_ordering"),
      mobileFriendly: seed.hasWebsite ? false : null,
      socialPresence: seed.evidence.some((e) => e.factor === "active_social")
        ? "active"
        : "inactive",
      digitalGaps: gaps,
      auditedAt: COLLECTED,
      confidence: seed.confidence,
    },
    recommendedService: seed.recommendedService,
    salesAngle: seed.salesAngle,
    reasoning: seed.reasoning,
    confidence: seed.confidence,
    scoredAt: "2026-08-29T09:31:00+08:00",
  };
}

/* -------------------------------------------------------------------------- */
/* Leads                                                                       */
/* -------------------------------------------------------------------------- */

const MAPS = "https://www.google.com/maps/place";

const LEAD_SEEDS: LeadSeed[] = [
  {
    id: "kristines-beauty-lounge",
    businessName: "Kristine's Beauty Lounge",
    location: "Tetuan, Zamboanga City",
    address: "Corner Mayor Jaldon–Tomas Claudio St, Tetuan, Zamboanga City, 7000",
    category: "Salon",
    phone: "+63 917 302 4488",
    domain: null,
    status: "new",
    hasWebsite: false,
    recommendedService: "Website with appointment booking",
    salesAngle:
      "They take every booking by hand in Facebook comments and Messenger, on a page that posts most days. At that volume the comment thread is the bottleneck, not the demand.",
    reasoning:
      "No website found on any search or map listing. Facebook page posts 4–6 times a week with booking requests visible in the comments. 340 Google reviews at 4.6 indicates real, sustained walk-in volume.",
    confidence: 0.92,
    evidence: [
      {
        factor: "no_website",
        claim: "No website",
        observed: "No domain on the map listing; no result in site search",
        source: `${MAPS}/kristines-beauty-lounge-zamboanga-city`,
      },
      {
        factor: "no_booking",
        claim: "No online booking",
        observed: "Bookings requested in Facebook comments and Messenger",
        source: "https://www.facebook.com/kristinesbeautylounge/posts",
      },
      {
        factor: "active_social",
        claim: "Active Facebook, posts weekly",
        observed: "18 posts in the last 30 days, 4.2k followers",
        source: "https://www.facebook.com/kristinesbeautylounge",
      },
      {
        factor: "high_review_count",
        claim: "Strong review volume",
        observed: "340 reviews, 4.6 stars",
        source: `${MAPS}/kristines-beauty-lounge-zamboanga-city/reviews`,
      },
      {
        factor: "location_match",
        claim: "In your target area",
        observed: "Tetuan, Zamboanga City",
        source: `${MAPS}/kristines-beauty-lounge-zamboanga-city`,
      },
    ],
  },
  {
    id: "bahia-seafood-grill",
    businessName: "Bahia Seafood Grill",
    location: "Guiwan, Zamboanga City",
    address: "Governor Camins Ave, Guiwan, Zamboanga City, 7000",
    category: "Restaurant",
    phone: "+63 62 856 2210",
    domain: null,
    status: "new",
    hasWebsite: false,
    recommendedService: "Website with online ordering and delivery pickup",
    salesAngle:
      "They are on foodpanda but have nowhere of their own to send customers, so every order carries a platform commission. A direct ordering page pays for itself against that fee.",
    reasoning:
      "No owned domain. Present on foodpanda only. 612 reviews at 4.4 across two years indicates steady covers, and the Facebook page answers menu questions daily.",
    confidence: 0.9,
    evidence: [
      {
        factor: "no_website",
        claim: "No website",
        observed: "Only a foodpanda storefront; no owned domain",
        source: `${MAPS}/bahia-seafood-grill-zamboanga-city`,
      },
      {
        factor: "no_ordering",
        claim: "No direct online ordering",
        observed: "Orders go through foodpanda at platform commission",
        source: "https://www.foodpanda.ph/restaurant/bahia-seafood-grill",
      },
      {
        factor: "active_social",
        claim: "Active Facebook, posts weekly",
        observed: "23 posts in the last 30 days, 9.1k followers",
        source: "https://www.facebook.com/bahiaseafoodgrill",
      },
      {
        factor: "high_review_count",
        claim: "Strong review volume",
        observed: "612 reviews, 4.4 stars",
        source: `${MAPS}/bahia-seafood-grill-zamboanga-city/reviews`,
      },
      {
        factor: "industry_match",
        claim: "Matches your target industry",
        observed: "Restaurant — on your industry list",
        source: `${MAPS}/bahia-seafood-grill-zamboanga-city`,
      },
      {
        factor: "location_match",
        claim: "In your target area",
        observed: "Guiwan, Zamboanga City",
        source: `${MAPS}/bahia-seafood-grill-zamboanga-city`,
      },
    ],
  },
  {
    id: "salon-de-rosa",
    businessName: "Salon de Rosa",
    location: "Putik, Zamboanga City",
    address: "Nuñez Ext, Putik, Zamboanga City, 7000",
    category: "Salon",
    phone: "+63 917 884 1120",
    domain: "salonderosa.ph",
    status: "contacted",
    hasWebsite: true,
    recommendedService: "Website rebuild with appointment booking",
    salesAngle:
      "The site exists but has not been touched since 2019 and breaks on a phone, which is where nearly all their traffic comes from. The rebuild is an easier sell than a first site.",
    reasoning:
      "Domain resolves but the page carries no mobile viewport tag and the last content change was 2019. Facebook remains active, so the business is healthy and the site is simply stale.",
    confidence: 0.88,
    evidence: [
      {
        factor: "outdated_website",
        claim: "Website is outdated",
        observed: "No mobile viewport tag; last modified 2019",
        source: "https://salonderosa.ph",
      },
      {
        factor: "no_booking",
        claim: "No online booking",
        observed: "Contact form only; no scheduling",
        source: "https://salonderosa.ph/contact",
      },
      {
        factor: "active_social",
        claim: "Active Facebook, posts weekly",
        observed: "14 posts in the last 30 days, 2.8k followers",
        source: "https://www.facebook.com/salonderosazc",
      },
      {
        factor: "high_review_count",
        claim: "Strong review volume",
        observed: "208 reviews, 4.7 stars",
        source: `${MAPS}/salon-de-rosa-zamboanga-city/reviews`,
      },
      {
        factor: "industry_match",
        claim: "Matches your target industry",
        observed: "Salon — on your industry list",
        source: `${MAPS}/salon-de-rosa-zamboanga-city`,
      },
    ],
  },
  {
    id: "glamour-hub-zamboanga",
    businessName: "Glamour Hub Zamboanga",
    location: "Ayala, Zamboanga City",
    address: "MCLL Highway, Zamboanga City, 7000",
    category: "Salon",
    phone: "+63 918 220 7745",
    domain: null,
    status: "new",
    hasWebsite: false,
    recommendedService: "Website with appointment booking",
    salesAngle:
      "Two branches, one Facebook page, and no way to tell which branch a booking is for. A booking page that routes by branch removes a daily source of double-booking.",
    reasoning:
      "No website. Facebook page serves both Ayala and Baliwasan branches from one inbox. 187 reviews at 4.5 across the pair.",
    confidence: 0.85,
    evidence: [
      {
        factor: "no_website",
        claim: "No website",
        observed: "No domain on the map listing or the Facebook page",
        source: `${MAPS}/glamour-hub-zamboanga`,
      },
      {
        factor: "no_booking",
        claim: "No online booking",
        observed: "Messenger only, shared across two branches",
        source: "https://www.facebook.com/glamourhubzamboanga",
      },
      {
        factor: "active_social",
        claim: "Active Facebook, posts weekly",
        observed: "11 posts in the last 30 days, 3.4k followers",
        source: "https://www.facebook.com/glamourhubzamboanga",
      },
      {
        factor: "high_review_count",
        claim: "Strong review volume",
        observed: "187 reviews, 4.5 stars",
        source: `${MAPS}/glamour-hub-zamboanga/reviews`,
      },
    ],
  },
  {
    id: "bella-vita-salon-spa",
    businessName: "Bella Vita Salon & Spa",
    location: "Santa Maria, Zamboanga City",
    address: "La Purisima St, Santa Maria, Zamboanga City, 7000",
    category: "Salon",
    phone: "+63 917 445 9021",
    domain: "bellavitazc.com",
    status: "new",
    hasWebsite: true,
    recommendedService: "Website rebuild with appointment booking",
    salesAngle:
      "Their domain returns a 502 and has for at least three weeks, while they keep printing it on receipts and posting it on Facebook. Every referral that types it in lands on an error.",
    reasoning:
      "Domain resolves but returns 502 Bad Gateway on every attempt over three weeks of checks. The Facebook page still links to it, so the broken address is actively in circulation.",
    confidence: 0.94,
    evidence: [
      {
        factor: "broken_website",
        claim: "Website is broken",
        observed: "502 Bad Gateway on every check since 8 Aug",
        source: "https://bellavitazc.com",
      },
      {
        factor: "no_booking",
        claim: "No online booking",
        observed: "Phone and Messenger only",
        source: "https://www.facebook.com/bellavitazc",
      },
      {
        factor: "active_social",
        claim: "Active Facebook, posts weekly",
        observed: "16 posts in the last 30 days, 5.6k followers",
        source: "https://www.facebook.com/bellavitazc",
      },
      {
        factor: "high_review_count",
        claim: "Strong review volume",
        observed: "254 reviews, 4.8 stars",
        source: `${MAPS}/bella-vita-salon-spa-zamboanga-city/reviews`,
      },
    ],
  },
  {
    id: "tetuan-dental-care",
    businessName: "Tetuan Dental Care",
    location: "Tetuan, Zamboanga City",
    address: "Veterans Ave, Tetuan, Zamboanga City, 7000",
    category: "Dental clinic",
    phone: "+63 62 857 1904",
    domain: "tetuandental.com",
    status: "replied",
    hasWebsite: true,
    recommendedService: "Website rebuild with appointment booking",
    salesAngle:
      "The domain has expired and now parks on an ad page carrying someone else's advertising. For a clinic, that is a trust problem as much as a technical one.",
    reasoning:
      "Domain resolves to a registrar parking page with third-party ads. Facebook page is active and lists a different phone number than the map listing, suggesting the listing is stale too.",
    confidence: 0.9,
    evidence: [
      {
        factor: "broken_website",
        claim: "Website is broken",
        observed: "Domain expired; resolves to a registrar parking page",
        source: "https://tetuandental.com",
      },
      {
        factor: "no_booking",
        claim: "No online booking",
        observed: "Appointments by phone during clinic hours only",
        source: "https://www.facebook.com/tetuandentalcare",
      },
      {
        factor: "active_social",
        claim: "Active Facebook, posts weekly",
        observed: "9 posts in the last 30 days, 1.9k followers",
        source: "https://www.facebook.com/tetuandentalcare",
      },
      {
        factor: "contactable",
        claim: "Reachable contact found",
        observed: "Landline and Messenger both answered within a day",
        source: `${MAPS}/tetuan-dental-care-zamboanga-city`,
      },
    ],
  },
  {
    id: "smile-studio-zamboanga",
    businessName: "Smile Studio Zamboanga",
    location: "San Jose Gusu, Zamboanga City",
    address: "Don Alfaro St, San Jose Gusu, Zamboanga City, 7000",
    category: "Dental clinic",
    phone: "+63 917 771 3388",
    domain: "smilestudiozc.ph",
    status: "new",
    hasWebsite: true,
    recommendedService: "Appointment booking added to the existing site",
    salesAngle:
      "The site is fine. What it does not do is take a booking, so every appointment still costs someone a phone call during clinic hours.",
    reasoning:
      "Website is current and mobile-friendly, so this is an add-on rather than a rebuild. No scheduling on any page. Facebook is active and review volume is strong for a clinic.",
    confidence: 0.87,
    evidence: [
      {
        factor: "no_booking",
        claim: "No online booking",
        observed: "No scheduling on any page; phone number only",
        source: "https://smilestudiozc.ph/appointments",
      },
      {
        factor: "active_social",
        claim: "Active Facebook, posts weekly",
        observed: "12 posts in the last 30 days, 2.2k followers",
        source: "https://www.facebook.com/smilestudiozc",
      },
      {
        factor: "high_review_count",
        claim: "Strong review volume",
        observed: "163 reviews, 4.9 stars",
        source: `${MAPS}/smile-studio-zamboanga/reviews`,
      },
      {
        factor: "industry_match",
        claim: "Matches your target industry",
        observed: "Dental clinic — on your industry list",
        source: `${MAPS}/smile-studio-zamboanga`,
      },
    ],
  },
  {
    id: "kagayan-dental-clinic",
    businessName: "Zamboanga Dental Clinic",
    location: "Tugbungan, Zamboanga City",
    address: "Zamboanga–Pagadian Hwy, Tugbungan, Zamboanga City, 7000",
    category: "Dental clinic",
    phone: "+63 62 855 6612",
    domain: null,
    status: "new",
    hasWebsite: false,
    recommendedService: "Website with appointment booking",
    salesAngle:
      "Long-established clinic with strong reviews and no web presence beyond a map pin. Patients searching for them by name find nothing they control.",
    reasoning:
      "No website and no Facebook page found. 142 reviews at 4.6 over several years indicates an established patient base. Landline verified against two directory listings.",
    confidence: 0.82,
    evidence: [
      {
        factor: "no_website",
        claim: "No website",
        observed: "No domain in any search or directory listing",
        source: `${MAPS}/zamboanga-dental-clinic-zamboanga-city`,
      },
      {
        factor: "no_booking",
        claim: "No online booking",
        observed: "Walk-in and phone appointments only",
        source: `${MAPS}/zamboanga-dental-clinic-zamboanga-city`,
      },
      {
        factor: "high_review_count",
        claim: "Strong review volume",
        observed: "142 reviews, 4.6 stars",
        source: `${MAPS}/zamboanga-dental-clinic-zamboanga-city/reviews`,
      },
      {
        factor: "contactable",
        claim: "Reachable contact found",
        observed: "Landline matches two directory listings",
        source: "https://www.yellowpages.ph/zamboanga-dental-clinic",
      },
    ],
  },
  {
    id: "tita-babys-carinderia",
    businessName: "Tita Baby's Carinderia",
    location: "Canelar, Zamboanga City",
    address: "Canelar Rd, Canelar, Zamboanga City, 7000",
    category: "Carinderia",
    phone: "+63 926 118 5540",
    domain: null,
    status: "new",
    hasWebsite: false,
    recommendedService: "One-page site with menu and order form",
    salesAngle:
      "They post the day's menu to Facebook every morning and take orders in the comments. A single page that holds the menu and an order form fits how they already work.",
    reasoning:
      "No website. Daily menu posts with orders placed in comments. Smaller review count than the restaurants above, so priced as a one-page build rather than a full site.",
    confidence: 0.79,
    evidence: [
      {
        factor: "no_website",
        claim: "No website",
        observed: "No domain on the map listing or Facebook page",
        source: `${MAPS}/tita-babys-carinderia`,
      },
      {
        factor: "no_ordering",
        claim: "No online ordering",
        observed: "Orders taken in Facebook post comments",
        source: "https://www.facebook.com/titababyscarinderia/posts",
      },
      {
        factor: "active_social",
        claim: "Active Facebook, posts daily",
        observed: "28 posts in the last 30 days, 1.1k followers",
        source: "https://www.facebook.com/titababyscarinderia",
      },
      {
        factor: "contactable",
        claim: "Reachable contact found",
        observed: "Mobile number in the page bio, answered on Messenger",
        source: "https://www.facebook.com/titababyscarinderia/about",
      },
    ],
  },
  {
    id: "pearl-laundry-hub",
    businessName: "Pearl Laundry Hub",
    location: "Ayala, Zamboanga City",
    address: "Justice R.T. Lim Blvd, Ayala, Zamboanga City, 7000",
    category: "Laundry",
    phone: "+63 917 663 2201",
    domain: null,
    status: "new",
    hasWebsite: false,
    recommendedService: "One-page site with pickup request form",
    salesAngle:
      "Pickup and delivery is their differentiator and it is currently arranged entirely over Messenger. A request form captures the address once instead of over three messages.",
    reasoning:
      "No website. Facebook page is moderately active and pickup requests are handled in Messenger. Review count is low, so this is a smaller engagement.",
    confidence: 0.74,
    evidence: [
      {
        factor: "no_website",
        claim: "No website",
        observed: "No domain in any listing",
        source: `${MAPS}/pearl-laundry-hub-zamboanga-city`,
      },
      {
        factor: "active_social",
        claim: "Active Facebook, posts weekly",
        observed: "7 posts in the last 30 days, 840 followers",
        source: "https://www.facebook.com/pearllaundryhub",
      },
      {
        factor: "contactable",
        claim: "Reachable contact found",
        observed: "Mobile number in the page bio",
        source: "https://www.facebook.com/pearllaundryhub/about",
      },
    ],
  },
  {
    id: "lola-nenas-kusina",
    businessName: "Lola Nena's Kusina",
    location: "Talon-Talon, Zamboanga City",
    address: "Talon-Talon Rd, Zamboanga City, 7000",
    category: "Carinderia",
    phone: "+63 935 447 1180",
    domain: null,
    status: "new",
    hasWebsite: false,
    recommendedService: "One-page site with menu",
    salesAngle:
      "Small operation with no online presence at all. Worth a call, but price it as a starter page — there is no evidence of the volume that justifies more.",
    reasoning:
      "No website, no active social. Contact number confirmed from the map listing. Evidence is thin: 3 rows, none of them demand signals.",
    confidence: 0.61,
    evidence: [
      {
        factor: "no_website",
        claim: "No website",
        observed: "No domain in any search or directory listing",
        source: `${MAPS}/lola-nenas-kusina-zamboanga-city`,
        confidence: 0.88,
      },
      {
        factor: "no_ordering",
        claim: "No online ordering",
        observed: "Walk-in only; no delivery platform listing",
        source: `${MAPS}/lola-nenas-kusina-zamboanga-city`,
        confidence: 0.7,
      },
      {
        factor: "contactable",
        claim: "Reachable contact found",
        observed: "Mobile number on the map listing, unverified",
        source: `${MAPS}/lola-nenas-kusina-zamboanga-city`,
        confidence: 0.55,
      },
    ],
  },
  {
    id: "jp-auto-repair",
    businessName: "JP Auto Repair",
    location: "Baliwasan, Zamboanga City",
    address: "Zone 4 Baliwasan, Zamboanga City, 7000",
    category: "Auto repair",
    phone: "+63 917 208 9934",
    domain: null,
    status: "new",
    hasWebsite: false,
    recommendedService: "One-page site with services and directions",
    salesAngle:
      "No web presence and no review history to judge demand from. Low confidence — verify by phone before spending time on a pitch.",
    reasoning:
      "No website and no social page found. Only 11 reviews. Location matches your target area but there is not enough evidence here to rank it higher.",
    confidence: 0.58,
    evidence: [
      {
        factor: "no_website",
        claim: "No website",
        observed: "No domain in any listing",
        source: `${MAPS}/jp-auto-repair-zamboanga-city`,
        confidence: 0.86,
      },
      {
        factor: "contactable",
        claim: "Reachable contact found",
        observed: "Mobile number on the map listing",
        source: `${MAPS}/jp-auto-repair-zamboanga-city`,
        confidence: 0.6,
      },
      {
        factor: "location_match",
        claim: "In your target area",
        observed: "Baliwasan, Zamboanga City",
        source: `${MAPS}/jp-auto-repair-zamboanga-city`,
      },
    ],
  },
  {
    id: "golden-thread-tailoring",
    businessName: "Golden Thread Tailoring",
    location: "Mercedes, Zamboanga City",
    address: "Mercedes Rd, Zamboanga City, 7000",
    category: "Tailoring",
    phone: "+63 62 858 3327",
    domain: null,
    status: "new",
    hasWebsite: false,
    recommendedService: "One-page site with services and directions",
    salesAngle:
      "Two pieces of evidence and no demand signal. Included for completeness rather than as a prospect — call only if you are working the area anyway.",
    reasoning:
      "No website found. Landline confirmed. No reviews, no social page, no ordering or booking signals to assess. Low confidence on the whole record.",
    confidence: 0.52,
    evidence: [
      {
        factor: "no_website",
        claim: "No website",
        observed: "No domain in any listing",
        source: `${MAPS}/golden-thread-tailoring-zamboanga-city`,
        confidence: 0.8,
      },
      {
        factor: "contactable",
        claim: "Reachable contact found",
        observed: "Landline on the map listing, unverified",
        source: `${MAPS}/golden-thread-tailoring-zamboanga-city`,
        confidence: 0.5,
      },
    ],
  },
  {
    id: "northbound-motorworks",
    businessName: "Northbound Motorworks",
    location: "Sinunuc, Zamboanga City",
    address: "Zone 2 Sinunuc, Zamboanga City, 7000",
    category: "Auto repair",
    phone: "+63 918 774 5512",
    domain: "northboundmotorworks.com",
    status: "lost",
    hasWebsite: true,
    recommendedService: "Website refresh",
    salesAngle:
      "Site works and loads fine on a phone. The only real finding is that it has not changed in four years. Weak grounds for a pitch.",
    reasoning:
      "Website is reachable and mobile-friendly but has not been updated since 2021. No booking or ordering need for this business type. Nothing else fired.",
    confidence: 0.66,
    evidence: [
      {
        factor: "outdated_website",
        claim: "Website is outdated",
        observed: "Last content change 2021; copyright still reads 2021",
        source: "https://northboundmotorworks.com",
      },
      {
        factor: "contactable",
        claim: "Reachable contact found",
        observed: "Mobile number and contact form both present",
        source: "https://northboundmotorworks.com/contact",
      },
      {
        factor: "location_match",
        claim: "In your target area",
        observed: "Sinunuc, Zamboanga City",
        source: `${MAPS}/northbound-motorworks-zamboanga-city`,
      },
    ],
  },
];

export const LEADS: LeadDetail[] = LEAD_SEEDS.map(buildLead).sort(
  (a, b) => b.score - a.score,
);

export const LEAD_SUMMARIES: LeadSummary[] = LEADS.map(
  ({
    id,
    businessName,
    location,
    category,
    score,
    tier,
    status,
    evidenceCount,
    hasWebsite,
  }) => ({
    id,
    businessName,
    location,
    category,
    score,
    tier,
    status,
    evidenceCount,
    hasWebsite,
  }),
);

export function getLead(id: string): LeadDetail | undefined {
  return LEADS.find((lead) => lead.id === id);
}

/* -------------------------------------------------------------------------- */
/* Outreach drafts                                                             */
/* -------------------------------------------------------------------------- */

export function getDrafts(lead: LeadDetail): OutreachDraft[] {
  const first = lead.businessName.split(/[' ]/)[0];
  return [
    {
      channel: "email",
      subject: `${lead.businessName} — booking requests in your comments`,
      body: `Hi ${first} team,\n\nI came across your Facebook page and noticed you're taking booking requests in the post comments — you posted 18 times in the last month, so that's a lot of threads to keep track of.\n\nI build booking pages for salons here in Zamboanga. It would give your customers one link to pick a time, and you'd see the day's schedule in one place instead of scrolling comments.\n\nHappy to show you what it would look like for ${lead.businessName} — no charge for the mockup.\n\n— Jones\nWeb developer, Zamboanga City`,
      approved: false,
    },
    {
      channel: "facebook_dm",
      subject: null,
      body: `Hi! I saw you take booking requests in your post comments. I build booking pages for salons here in Zamboanga — one link your customers can use to pick a time, so you're not scrolling comments to find who booked what.\n\nWant me to put together a quick mockup for ${lead.businessName}? Free, no obligation.`,
      approved: false,
    },
  ];
}

/* -------------------------------------------------------------------------- */
/* Campaigns                                                                   */
/* -------------------------------------------------------------------------- */

export const CAMPAIGNS: Campaign[] = [
  {
    id: "camp-salons-zc",
    name: "Salons — Zamboanga City",
    service: "Websites and appointment booking systems",
    industries: ["Salon", "Spa"],
    location: "Zamboanga City",
    budgetMin: 30000,
    status: "running",
    createdAt: "2026-08-29T08:40:00+08:00",
    leadCount: 64,
    qualifiedCount: 31,
    replies: 7,
    replyRate: 0.13,
  },
  {
    id: "camp-restaurants-zc",
    name: "Restaurants — Guiwan & Tetuan",
    service: "Websites with online ordering",
    industries: ["Restaurant", "Carinderia"],
    location: "Zamboanga City",
    budgetMin: 25000,
    status: "complete",
    createdAt: "2026-08-22T10:12:00+08:00",
    leadCount: 88,
    qualifiedCount: 41,
    replies: 13,
    replyRate: 0.176,
  },
  {
    id: "camp-dental-zc",
    name: "Dental clinics — Zamboanga City",
    service: "Websites and appointment booking systems",
    industries: ["Dental clinic"],
    location: "Zamboanga City",
    budgetMin: 35000,
    status: "complete",
    createdAt: "2026-08-14T14:05:00+08:00",
    leadCount: 42,
    qualifiedCount: 19,
    replies: 4,
    replyRate: 0.111,
  },
  {
    id: "camp-pagadian-pilot",
    name: "Pagadian pilot — mixed",
    service: "Websites",
    industries: ["Salon", "Restaurant", "Auto repair"],
    location: "Pagadian",
    budgetMin: 20000,
    status: "failed",
    createdAt: "2026-08-08T09:30:00+08:00",
    leadCount: 47,
    qualifiedCount: 0,
    replies: 0,
    replyRate: 0,
  },
];

export function getCampaign(id: string): Campaign | undefined {
  return CAMPAIGNS.find((c) => c.id === id);
}

/**
 * A mid-run snapshot so the narrowing funnel is visible without a backend.
 * Each stage discards; `kept` is what survived, `dropped` is what did not.
 */
export const CAMPAIGN_PROGRESS: Record<string, CampaignProgress> = {
  "camp-salons-zc": {
    campaignId: "camp-salons-zc",
    status: "running",
    startedAt: "2026-08-29T08:40:00+08:00",
    endedAt: null,
    stages: [
      {
        agent: "discovery",
        label: "Discovering",
        status: "succeeded",
        input: 247,
        kept: 247,
        dropped: 0,
        dropReason: null,
      },
      {
        agent: "research",
        label: "Researching",
        status: "succeeded",
        input: 247,
        kept: 118,
        dropped: 129,
        dropReason: "duplicate or wrong category",
      },
      {
        agent: "audit",
        label: "Auditing",
        status: "succeeded",
        input: 118,
        kept: 64,
        dropped: 54,
        dropReason: "no reachable domain or listing",
      },
      {
        agent: "opportunity",
        label: "Scoring",
        status: "running",
        input: 64,
        kept: null,
        dropped: 33,
        dropReason: "below the qualifying threshold",
      },
      {
        agent: "outreach",
        label: "Drafting outreach",
        status: "queued",
        input: 31,
        kept: null,
        dropped: 0,
        dropReason: null,
      },
    ],
  },
  "camp-restaurants-zc": {
    campaignId: "camp-restaurants-zc",
    status: "complete",
    startedAt: "2026-08-22T10:12:00+08:00",
    endedAt: "2026-08-22T10:39:00+08:00",
    stages: [
      {
        agent: "discovery",
        label: "Discovering",
        status: "succeeded",
        input: 312,
        kept: 312,
        dropped: 0,
        dropReason: null,
      },
      {
        agent: "research",
        label: "Researching",
        status: "succeeded",
        input: 312,
        kept: 164,
        dropped: 148,
        dropReason: "duplicate or wrong category",
      },
      {
        agent: "audit",
        label: "Auditing",
        status: "succeeded",
        input: 164,
        kept: 88,
        dropped: 76,
        dropReason: "no reachable domain or listing",
      },
      {
        agent: "opportunity",
        label: "Scoring",
        status: "succeeded",
        input: 88,
        kept: 41,
        dropped: 47,
        dropReason: "below the qualifying threshold",
      },
      {
        agent: "outreach",
        label: "Drafting outreach",
        status: "succeeded",
        input: 41,
        kept: 41,
        dropped: 0,
        dropReason: null,
      },
    ],
  },
};

/* -------------------------------------------------------------------------- */
/* Dashboard                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Two windows the dashboard can show. `week` carries deltas against the prior
 * week; `all` has no comparable period so its deltas are null. Both funnels
 * decrease monotonically — that is the point of the view.
 */
export const DASHBOARD_SNAPSHOTS: Record<"week" | "all", DashboardSnapshot> = {
  week: {
    range: "week",
    kpis: [
      { key: "scanned", label: "Businesses scanned", value: 694, deltaPct: 12, hint: "across 3 running campaigns" },
      { key: "analyzed", label: "Analyzed", value: 434, deltaPct: 8, hint: "survived the cheap checks" },
      { key: "qualified", label: "Opportunities found", value: 91, deltaPct: 21, hint: "scored above your threshold" },
      { key: "highPriority", label: "High potential", value: 28, deltaPct: 3, hint: "scored 80 and up" },
      { key: "replies", label: "Replies", value: 24, deltaPct: 5, hint: "from outreach this week" },
    ],
    funnel: [
      { key: "scanned", label: "Scanned", count: 694, dropped: 0, dropReason: null },
      { key: "researched", label: "Researched", count: 512, dropped: 182, dropReason: "duplicate or wrong category" },
      { key: "analyzed", label: "Analyzed", count: 434, dropped: 78, dropReason: "no reachable site or listing" },
      { key: "qualified", label: "Qualified", count: 91, dropped: 343, dropReason: "below your score threshold" },
      { key: "priority", label: "High-priority", count: 28, dropped: 63, dropReason: "scored under 80" },
    ],
  },
  all: {
    range: "all",
    kpis: [
      { key: "scanned", label: "Businesses scanned", value: 3210, deltaPct: null, hint: "since your first campaign" },
      { key: "analyzed", label: "Analyzed", value: 1984, deltaPct: null, hint: "survived the cheap checks" },
      { key: "qualified", label: "Opportunities found", value: 452, deltaPct: null, hint: "scored above your threshold" },
      { key: "highPriority", label: "High potential", value: 137, deltaPct: null, hint: "scored 80 and up" },
      { key: "replies", label: "Replies", value: 118, deltaPct: null, hint: "from outreach, all-time" },
    ],
    funnel: [
      { key: "scanned", label: "Scanned", count: 3210, dropped: 0, dropReason: null },
      { key: "researched", label: "Researched", count: 2361, dropped: 849, dropReason: "duplicate or wrong category" },
      { key: "analyzed", label: "Analyzed", count: 1984, dropped: 377, dropReason: "no reachable site or listing" },
      { key: "qualified", label: "Qualified", count: 452, dropped: 1532, dropReason: "below your score threshold" },
      { key: "priority", label: "High-priority", count: 137, dropped: 315, dropReason: "scored under 80" },
    ],
  },
};

/**
 * Recent events for the activity feed. Illustrative — the backend has no
 * event stream yet — but every item points at a real fixture route.
 */
export const DASHBOARD_ACTIVITY: ActivityEvent[] = [
  {
    id: "act-1",
    kind: "campaign",
    text: "Scoring finished on Salons — Zamboanga City: 31 of 64 qualified",
    at: "2026-08-31T09:10:00+08:00",
    href: "/campaigns/camp-salons-zc",
  },
  {
    id: "act-2",
    kind: "reply",
    text: "Salon de Rosa replied to your outreach",
    at: "2026-08-31T06:35:00+08:00",
    href: "/leads/salon-de-rosa",
  },
  {
    id: "act-3",
    kind: "evidence",
    text: "Audit found no online booking at Bella Vita Salon & Spa",
    at: "2026-08-31T03:20:00+08:00",
    href: "/leads/bella-vita-salon-spa",
  },
  {
    id: "act-4",
    kind: "qualified",
    text: "Bahia Seafood Grill qualified at 110",
    at: "2026-08-30T16:05:00+08:00",
    href: "/leads/bahia-seafood-grill",
  },
  {
    id: "act-5",
    kind: "discovery",
    text: "Discovery added 47 salons across Tetuan and Guiwan",
    at: "2026-08-30T11:40:00+08:00",
    href: "/campaigns/camp-salons-zc",
  },
  {
    id: "act-6",
    kind: "campaign",
    text: "New campaign started: Dental clinics — Zamboanga City",
    at: "2026-08-28T14:05:00+08:00",
    href: "/campaigns/camp-dental-zc",
  },
];

/* -------------------------------------------------------------------------- */
/* Analytics                                                                   */
/* -------------------------------------------------------------------------- */

export type AnalyticsStat = {
  key: string;
  label: string;
  value: number;
  deltaPct: number;
  format: "number" | "percent" | "peso";
};

export type AnalyticsData = {
  rangeLabel: string;
  stats: AnalyticsStat[];
  overTime: { date: string; found: number; qualified: number }[];
  byService: { service: string; count: number }[];
  replyRate: { date: string; rate: number }[];
};

/**
 * Illustrative — there is no recorded-outcome history yet. Shapes match what
 * the analytics endpoint will return once Milestone 11 lands.
 */
export const ANALYTICS: AnalyticsData = {
  rangeLabel: "Last 12 weeks",
  stats: [
    { key: "found", label: "Opportunities found", value: 1203, deltaPct: 33.7, format: "number" },
    { key: "qualified", label: "Qualified", value: 452, deltaPct: 18.2, format: "number" },
    { key: "replies", label: "Replies", value: 156, deltaPct: 12.5, format: "number" },
    { key: "replyRate", label: "Reply rate", value: 12.9, deltaPct: 2.1, format: "percent" },
    { key: "meetings", label: "Meetings booked", value: 11, deltaPct: 12.5, format: "number" },
    { key: "pipeline", label: "Pipeline value", value: 316000, deltaPct: 50, format: "peso" },
  ],
  overTime: [
    { date: "Jun 9", found: 61, qualified: 22 },
    { date: "Jun 16", found: 74, qualified: 29 },
    { date: "Jun 23", found: 88, qualified: 31 },
    { date: "Jun 30", found: 79, qualified: 34 },
    { date: "Jul 7", found: 96, qualified: 41 },
    { date: "Jul 14", found: 112, qualified: 44 },
    { date: "Jul 21", found: 104, qualified: 47 },
    { date: "Jul 28", found: 121, qualified: 52 },
    { date: "Aug 4", found: 133, qualified: 49 },
    { date: "Aug 11", found: 118, qualified: 55 },
    { date: "Aug 18", found: 142, qualified: 61 },
    { date: "Aug 25", found: 156, qualified: 58 },
  ],
  byService: [
    { service: "Booking page", count: 486 },
    { service: "One-page site", count: 372 },
    { service: "Online ordering", count: 214 },
    { service: "Website rebuild", count: 131 },
  ],
  replyRate: [
    { date: "Jun 9", rate: 9.1 },
    { date: "Jun 16", rate: 9.6 },
    { date: "Jun 23", rate: 8.9 },
    { date: "Jun 30", rate: 10.2 },
    { date: "Jul 7", rate: 10.8 },
    { date: "Jul 14", rate: 11.1 },
    { date: "Jul 21", rate: 10.7 },
    { date: "Jul 28", rate: 11.9 },
    { date: "Aug 4", rate: 12.2 },
    { date: "Aug 11", rate: 12.0 },
    { date: "Aug 18", rate: 12.6 },
    { date: "Aug 25", rate: 12.9 },
  ],
};

/* -------------------------------------------------------------------------- */
/* Outreach                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Threads spanning every status. Nothing here is actually sent — the "sent"
 * and "replied" states are illustrative so the inbox has a real shape.
 */
export const OUTREACH_THREADS: OutreachThread[] = [
  {
    id: "ot-1",
    leadId: "salon-de-rosa",
    business: "Salon de Rosa",
    location: "Putik, Zamboanga City",
    channel: "email",
    status: "replied",
    subject: "Salon de Rosa — a booking page for your Messenger enquiries",
    updatedAt: "2026-08-31T06:35:00+08:00",
    messages: [
      {
        from: "you",
        at: "2026-08-30T09:12:00+08:00",
        body: "Hi Rosa team,\n\nI noticed most of your bookings come in through Messenger, and you're replying to each one by hand. I build booking pages for salons here in Zamboanga — one link your customers use to pick a time, and you see the day's schedule in one place.\n\nHappy to put together a free mockup for Salon de Rosa. Would that be useful?\n\n— Jones",
      },
      {
        from: "them",
        at: "2026-08-31T06:35:00+08:00",
        body: "Hi Jones, yes please send the mockup. We are very interested — Messenger is getting hard to keep up with. What do you need from us?",
      },
    ],
  },
  {
    id: "ot-2",
    leadId: "bahia-seafood-grill",
    business: "Bahia Seafood Grill",
    location: "Guiwan, Zamboanga City",
    channel: "email",
    status: "sent",
    subject: "Bahia Seafood Grill — a direct ordering page vs foodpanda fees",
    updatedAt: "2026-08-30T15:40:00+08:00",
    messages: [
      {
        from: "you",
        at: "2026-08-30T15:40:00+08:00",
        body: "Hi,\n\nEvery order through foodpanda carries a platform commission. A direct ordering page on your own domain pays for itself against that fee — customers who already know you order straight from you.\n\nI can show you what that would look like for Bahia Seafood Grill, no charge for the mockup.\n\n— Jones",
      },
    ],
  },
  {
    id: "ot-3",
    leadId: "kristines-beauty-lounge",
    business: "Kristine's Beauty Lounge",
    location: "Tetuan, Zamboanga City",
    channel: "facebook_dm",
    status: "draft",
    subject: null,
    updatedAt: "2026-08-31T08:05:00+08:00",
    messages: [
      {
        from: "you",
        at: "2026-08-31T08:05:00+08:00",
        body: "Hi! I saw you take booking requests in your post comments — you're posting most days, so that's a lot of threads to track. I build booking pages for salons here in Zamboanga: one link your customers use to pick a time, so you're not scrolling comments to find who booked what.\n\nWant a free mockup for Kristine's Beauty Lounge?",
      },
    ],
  },
  {
    id: "ot-4",
    leadId: "glamour-hub-zamboanga",
    business: "Glamour Hub Zamboanga",
    location: "Ayala, Zamboanga City",
    channel: "facebook_dm",
    status: "draft",
    subject: null,
    updatedAt: "2026-08-31T07:20:00+08:00",
    messages: [
      {
        from: "you",
        at: "2026-08-31T07:20:00+08:00",
        body: "Hi Glamour Hub! No website turned up for you in search — just the Facebook page. A one-page site with your services, hours and a booking link would catch the customers who look you up on Google first. Free mockup if you're interested?",
      },
    ],
  },
  {
    id: "ot-5",
    leadId: "tetuan-dental-care",
    business: "Tetuan Dental Care",
    location: "Tetuan, Zamboanga City",
    channel: "email",
    status: "replied",
    subject: "Tetuan Dental Care — appointment booking on your site",
    updatedAt: "2026-08-29T17:10:00+08:00",
    messages: [
      {
        from: "you",
        at: "2026-08-28T10:00:00+08:00",
        body: "Hi,\n\nYour site looks good but there's no way to request an appointment on it — patients still have to call. Adding a booking form would let them pick a slot after hours, which is when most people actually get around to it.\n\nHappy to scope this for Tetuan Dental Care.\n\n— Jones",
      },
      {
        from: "them",
        at: "2026-08-29T17:10:00+08:00",
        body: "Thanks for reaching out. We're reviewing options with our current web person first — can you send pricing so we can compare?",
      },
    ],
  },
  {
    id: "ot-6",
    leadId: "northbound-motorworks",
    business: "Northbound Motorworks",
    location: "Sinunuc, Zamboanga City",
    channel: "email",
    status: "bounced",
    subject: "Northbound Motorworks — a simple site for your shop",
    updatedAt: "2026-08-27T11:45:00+08:00",
    messages: [
      {
        from: "you",
        at: "2026-08-27T11:45:00+08:00",
        body: "Hi,\n\nA one-page site with your services, directions and contact would help customers find you — right now there's only a map pin. I can put together a mockup for Northbound Motorworks at no cost.\n\n— Jones",
      },
    ],
  },
];

/* -------------------------------------------------------------------------- */
/* Agent runs                                                                  */
/* -------------------------------------------------------------------------- */

export const AGENT_RUNS: AgentRun[] = [
  {
    id: "run-8f2a41",
    campaignId: "camp-salons-zc",
    campaignName: "Salons — Zamboanga City",
    agent: "opportunity",
    status: "running",
    startedAt: "2026-08-29T09:28:00+08:00",
    endedAt: null,
    durationMs: null,
    costUsd: 0.021,
    businessCount: 64,
    toolCalls: [
      {
        id: "tc-1",
        tool: "llm.complete_structured",
        input: { schema: "OpportunityAnalysis", tier: "cheap", business_id: "kristines-beauty-lounge" },
        output: { score: 95, recommended_service: "Website with appointment booking", evidence_ids: 5 },
        ms: 3120,
      },
      {
        id: "tc-2",
        tool: "evidence.validate_ids",
        input: { claimed: 5, campaign_id: "camp-salons-zc" },
        output: { valid: 5, missing: 0 },
        ms: 14,
      },
    ],
    errors: [],
  },
  {
    id: "run-8f2a3e",
    campaignId: "camp-salons-zc",
    campaignName: "Salons — Zamboanga City",
    agent: "audit",
    status: "succeeded",
    startedAt: "2026-08-29T09:11:00+08:00",
    endedAt: "2026-08-29T09:27:00+08:00",
    durationMs: 964_000,
    costUsd: 0,
    businessCount: 118,
    toolCalls: [
      {
        id: "tc-3",
        tool: "website.check",
        input: { domain: "bellavitazc.com", timeout_s: 5 },
        output: { reachable: true, status: 502, https: true, mobile_viewport: null },
        ms: 5021,
      },
      {
        id: "tc-4",
        tool: "website.check",
        input: { domain: "salonderosa.ph", timeout_s: 5 },
        output: { reachable: true, status: 200, https: true, mobile_viewport: false, last_modified: "2019-04-11" },
        ms: 812,
      },
      {
        id: "tc-5",
        tool: "audit.compose",
        input: { businesses: 118 },
        output: { audits_written: 64, skipped_no_domain: 54 },
        ms: 2204,
      },
    ],
    errors: [],
  },
  {
    id: "run-8f2a2c",
    campaignId: "camp-salons-zc",
    campaignName: "Salons — Zamboanga City",
    agent: "research",
    status: "succeeded",
    startedAt: "2026-08-29T08:52:00+08:00",
    endedAt: "2026-08-29T09:10:00+08:00",
    durationMs: 1_098_000,
    costUsd: 0,
    businessCount: 247,
    toolCalls: [
      {
        id: "tc-6",
        tool: "search.web",
        input: { query: "Kristine's Beauty Lounge Zamboanga City", limit: 5 },
        output: { results: 5, facebook_page_found: true },
        ms: 1740,
      },
      {
        id: "tc-7",
        tool: "page.fetch",
        input: { url: "https://www.facebook.com/kristinesbeautylounge", ssrf_checked: true },
        output: { status: 200, bytes: 184_220, posts_30d: 18 },
        ms: 2210,
      },
      {
        id: "tc-8",
        tool: "evidence.save",
        input: { business_id: "kristines-beauty-lounge", claims: 5 },
        output: { written: 5, rejected_no_source: 0 },
        ms: 41,
      },
    ],
    errors: [],
  },
  {
    id: "run-8f29d0",
    campaignId: "camp-pagadian-pilot",
    campaignName: "Pagadian pilot — mixed",
    agent: "discovery",
    status: "failed",
    startedAt: "2026-08-08T09:30:00+08:00",
    endedAt: "2026-08-08T09:34:00+08:00",
    durationMs: 241_000,
    costUsd: 0,
    businessCount: 47,
    toolCalls: [
      {
        id: "tc-9",
        tool: "maps.search",
        input: { category: "Salon", location: "Pagadian", limit: 100 },
        output: { returned: 47, rate_limited_at: 47 },
        ms: 238_400,
      },
    ],
    errors: [
      {
        errorType: "RateLimitError",
        message: "Google Maps returned 429 after 47 results. 47 businesses were saved.",
        traceback:
          "providers/business_data/maps_scraper.py:118 in search\n  raise RateLimitError(f\"429 after {count} results\")",
      },
    ],
  },
];

export function getRun(id: string): AgentRun | undefined {
  return AGENT_RUNS.find((r) => r.id === id);
}

/* -------------------------------------------------------------------------- */
/* User                                                                        */
/* -------------------------------------------------------------------------- */

export const USER_PROFILE: UserProfile = {
  email: "jones@example.com",
  services: [
    "Business websites",
    "Appointment booking systems",
    "Online ordering pages",
  ],
  targetIndustries: ["Salon", "Restaurant", "Dental clinic", "Carinderia"],
  targetLocations: ["Zamboanga City", "Pagadian"],
  priceRangeMin: 15000,
  priceRangeMax: 45000,
  icpNotes:
    "Best fits so far: businesses already busy on Facebook but handling bookings by hand. Skip anyone with fewer than 50 reviews unless they post daily.",
};
