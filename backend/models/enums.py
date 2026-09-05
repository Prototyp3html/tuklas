"""Enum value sets, mirrored verbatim from `frontend/lib/types.ts`.

Stored as ``VARCHAR + CHECK`` (``sa.Enum(..., native_enum=False)``), never as a
native Postgres ``ENUM`` type: autogenerate is blind to native-enum value
changes, ``ALTER TYPE ... ADD VALUE`` fights transactional migrations, and these
lists churn through Milestones 3-9. Values go on the wire as plain strings and
must keep matching the `types.ts` unions exactly (snake_case where multi-word).
"""

from enum import StrEnum


class LeadStatus(StrEnum):
    NEW = "new"
    CONTACTED = "contacted"
    REPLIED = "replied"
    MEETING = "meeting"
    PROPOSAL = "proposal"
    WON = "won"
    LOST = "lost"


class CampaignStatus(StrEnum):
    DRAFT = "draft"
    RUNNING = "running"
    COMPLETE = "complete"
    FAILED = "failed"


class AgentName(StrEnum):
    DISCOVERY = "discovery"
    RESEARCH = "research"
    AUDIT = "audit"
    OPPORTUNITY = "opportunity"
    OUTREACH = "outreach"


class RunStatus(StrEnum):
    QUEUED = "queued"
    RUNNING = "running"
    SUCCEEDED = "succeeded"
    FAILED = "failed"


class WebsiteStatus(StrEnum):
    NONE = "none"
    BROKEN = "broken"
    OUTDATED = "outdated"
    BASIC = "basic"
    GOOD = "good"


class SocialPresence(StrEnum):
    NONE = "none"
    INACTIVE = "inactive"
    ACTIVE = "active"
    VERY_ACTIVE = "very_active"


class ScoreTier(StrEnum):
    HIGH = "high"
    MID = "mid"
    LOW = "low"


class OutreachChannel(StrEnum):
    EMAIL = "email"
    FACEBOOK_DM = "facebook_dm"


class OutreachStatus(StrEnum):
    DRAFT = "draft"
    SENT = "sent"
    REPLIED = "replied"
    BOUNCED = "bounced"


class EvidenceKind(StrEnum):
    GAP = "gap"
    STRENGTH = "strength"


class ScoreFactor(StrEnum):
    NO_WEBSITE = "no_website"
    BROKEN_WEBSITE = "broken_website"
    OUTDATED_WEBSITE = "outdated_website"
    NO_BOOKING = "no_booking"
    NO_ORDERING = "no_ordering"
    ACTIVE_SOCIAL = "active_social"
    HIGH_REVIEW_COUNT = "high_review_count"
    CONTACTABLE = "contactable"
    INDUSTRY_MATCH = "industry_match"
    LOCATION_MATCH = "location_match"


class ActivityKind(StrEnum):
    DISCOVERY = "discovery"
    EVIDENCE = "evidence"
    REPLY = "reply"
    QUALIFIED = "qualified"
    CAMPAIGN = "campaign"


class ContactType(StrEnum):
    """Not in `types.ts` yet — `business_contacts.type`. Kept small; extend as
    Milestone 3 discovery learns what it actually collects."""

    PHONE = "phone"
    EMAIL = "email"
    FACEBOOK = "facebook"
    INSTAGRAM = "instagram"
    WEBSITE = "website"
    OTHER = "other"
