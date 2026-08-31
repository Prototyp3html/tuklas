/**
 * The frontend's data contract.
 *
 * These mirror the tables and Pydantic sketches in `docs/BUILD_GUIDE.md` Part 2.
 * The backend is still stubs, so this file is currently the *authoritative*
 * shape — treat it as the target the FastAPI schemas must satisfy, not as a
 * guess about them.
 *
 * TODO (Milestone 2+): once routes exist, regenerate from the FastAPI OpenAPI
 * schema (`openapi-typescript`) and delete the hand-written half.
 */

/* -------------------------------------------------------------------------- */
/* Enums                                                                       */
/* -------------------------------------------------------------------------- */

/** Score bands. high >= 80, mid 60-79, low < 60. See lib/format.ts. */
export type ScoreTier = "high" | "mid" | "low";

export type LeadStatus =
  | "new"
  | "contacted"
  | "replied"
  | "meeting"
  | "proposal"
  | "won"
  | "lost";

export type CampaignStatus = "draft" | "running" | "complete" | "failed";

/** The deterministic pipeline, in execution order. Agents 1-3 make no LLM calls. */
export type AgentName =
  | "discovery"
  | "research"
  | "audit"
  | "opportunity"
  | "outreach";

export type RunStatus = "queued" | "running" | "succeeded" | "failed";

export type WebsiteStatus = "none" | "broken" | "outdated" | "basic" | "good";

export type SocialPresence = "none" | "inactive" | "active" | "very_active";

export type OutreachChannel = "email" | "facebook_dm";

/** A gap is a missing thing, which is money. Never render it as an error. */
export type EvidenceKind = "gap" | "strength";

/** The ten weight keys from BUILD_GUIDE Part 3, Milestone 7. */
export type ScoreFactor =
  | "no_website"
  | "broken_website"
  | "outdated_website"
  | "no_booking"
  | "no_ordering"
  | "active_social"
  | "high_review_count"
  | "contactable"
  | "industry_match"
  | "location_match";

/* -------------------------------------------------------------------------- */
/* Evidence — nothing is a fact without a source URL and a collection time      */
/* -------------------------------------------------------------------------- */

export interface EvidenceRow {
  id: string;
  /** What was claimed, in the user's language. "No online booking". */
  claim: string;
  /** What was actually observed. "340 reviews, 4.6 stars". */
  observedValue: string;
  /** Non-negotiable. If you can't cite it, you don't know it. */
  sourceUrl: string;
  collectedAt: string;
  confidence: number;
  kind: EvidenceKind;
  /**
   * The ledger line. How many points this observation contributed to the score,
   * or null when the observation is context that carries no weight.
   */
  weight: number | null;
  /** Which scoring factor this line maps to, for auditing the breakdown. */
  factor: ScoreFactor | null;
}

export interface DigitalAudit {
  hasWebsite: boolean;
  websiteStatus: WebsiteStatus;
  hasBooking: boolean;
  hasOrdering: boolean;
  mobileFriendly: boolean | null;
  socialPresence: SocialPresence;
  digitalGaps: string[];
  auditedAt: string;
  confidence: number;
}

/* -------------------------------------------------------------------------- */
/* Leads                                                                       */
/* -------------------------------------------------------------------------- */

export interface LeadSummary {
  id: string;
  businessName: string;
  /** Barangay / district, then city. "Tetuan, Zamboanga City". */
  location: string;
  category: string;
  score: number;
  tier: ScoreTier;
  status: LeadStatus;
  evidenceCount: number;
  hasWebsite: boolean;
}

export interface LeadDetail extends LeadSummary {
  address: string;
  phone: string | null;
  domain: string | null;
  campaignId: string;

  /** The ledger, in display order. */
  evidence: EvidenceRow[];
  /** The stored breakdown, so the total is auditable independently of the rows. */
  breakdown: Partial<Record<ScoreFactor, number>>;
  audit: DigitalAudit;

  /* The only fields on this screen produced by a model rather than observed. */
  recommendedService: string;
  salesAngle: string;
  reasoning: string;
  confidence: number;

  scoredAt: string;
}

export interface OutreachDraft {
  channel: OutreachChannel;
  subject: string | null;
  body: string;
  approved: boolean;
}

export type OutreachStatus = "draft" | "sent" | "replied" | "bounced";

export interface OutreachMessage {
  from: "you" | "them";
  body: string;
  at: string;
}

/** One conversation with a lead, across a single channel. */
export interface OutreachThread {
  id: string;
  leadId: string;
  business: string;
  location: string;
  channel: OutreachChannel;
  status: OutreachStatus;
  subject: string | null;
  updatedAt: string;
  messages: OutreachMessage[];
}

/* -------------------------------------------------------------------------- */
/* Campaigns                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * One stage of the cost funnel. Every stage discards — that discarding is why
 * the pipeline is cheap — so the UI shows `kept` shrinking, not progress
 * filling. `dropped` and `dropReason` are what make the narrowing legible.
 */
export interface FunnelStage {
  agent: AgentName;
  label: string;
  status: RunStatus;
  /** How many entered this stage. */
  input: number;
  /** How many survived it. Null while the stage is still running. */
  kept: number | null;
  dropped: number;
  /** Plain-language reason, shown next to the count. */
  dropReason: string | null;
}

export interface Campaign {
  id: string;
  name: string;
  service: string;
  industries: string[];
  location: string;
  budgetMin: number;
  status: CampaignStatus;
  createdAt: string;
  leadCount: number;
  qualifiedCount: number;
  /** Outreach sent from this campaign's leads that got a response. */
  replies: number;
  /** replies / contacted, 0–1. */
  replyRate: number;
}

export interface CampaignProgress {
  campaignId: string;
  status: CampaignStatus;
  stages: FunnelStage[];
  startedAt: string;
  endedAt: string | null;
}

/* -------------------------------------------------------------------------- */
/* Dashboard and analytics                                                     */
/* -------------------------------------------------------------------------- */

/** The window the dashboard is showing. `all` has no comparable prior period. */
export type DateRange = "week" | "all";

export interface DashboardKpi {
  key: "scanned" | "analyzed" | "qualified" | "highPriority" | "replies";
  label: string;
  value: number;
  /** percent change vs the previous comparable period; null when not comparable */
  deltaPct: number | null;
  /** one plain line under the number */
  hint: string;
}

/**
 * One band of the dashboard funnel. Not 1:1 with agents — the last two bands
 * both come out of scoring (qualified = above threshold, high-priority = 80+).
 * `dropped` / `dropReason` are what make the narrowing legible.
 */
export interface DashboardFunnelStage {
  key: string;
  label: string;
  count: number;
  dropped: number;
  dropReason: string | null;
}

export interface DashboardSnapshot {
  range: DateRange;
  kpis: DashboardKpi[];
  funnel: DashboardFunnelStage[];
}

export type ActivityKind =
  | "discovery"
  | "evidence"
  | "reply"
  | "qualified"
  | "campaign";

export interface ActivityEvent {
  id: string;
  kind: ActivityKind;
  /** already written in the user's language, one line */
  text: string;
  at: string;
  /** where the event points, or null */
  href: string | null;
}

/* -------------------------------------------------------------------------- */
/* Observability                                                               */
/* -------------------------------------------------------------------------- */

export interface AgentToolCall {
  id: string;
  tool: string;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  ms: number;
}

export interface AgentError {
  errorType: string;
  message: string;
  traceback: string | null;
}

/**
 * Never carries model chain-of-thought. Tool calls and decisions only —
 * BUILD_GUIDE Milestone 10 is explicit about this.
 */
export interface AgentRun {
  id: string;
  campaignId: string;
  campaignName: string;
  agent: AgentName;
  status: RunStatus;
  startedAt: string;
  endedAt: string | null;
  durationMs: number | null;
  costUsd: number;
  /** How many businesses this stage processed. Shown on the run row. */
  businessCount: number;
  toolCalls: AgentToolCall[];
  errors: AgentError[];
}

/* -------------------------------------------------------------------------- */
/* User                                                                        */
/* -------------------------------------------------------------------------- */

export interface UserProfile {
  email: string;
  services: string[];
  targetIndustries: string[];
  targetLocations: string[];
  priceRangeMin: number;
  priceRangeMax: number;
  icpNotes: string;
}
