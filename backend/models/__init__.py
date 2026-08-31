"""SQLAlchemy models for every table in BUILD_GUIDE.md Part 2.

Import surface: `from backend.models import Base` pulls all 16 tables' metadata
(Alembic autogenerate needs a single import that reaches everything).
"""

from backend.models.base import Base, DenormUserMixin, TimestampMixin, UserOwnedMixin
from backend.models.enums import (
    ActivityKind,
    AgentName,
    CampaignStatus,
    ContactType,
    EvidenceKind,
    LeadStatus,
    OutreachChannel,
    OutreachStatus,
    RunStatus,
    ScoreFactor,
    SocialPresence,
    WebsiteStatus,
)
from backend.models.tables import (
    AgentErrorRow,
    AgentRun,
    AgentToolCall,
    Business,
    BusinessContact,
    BusinessEvidence,
    BusinessSource,
    Campaign,
    CampaignLead,
    DigitalAudit,
    LeadActivity,
    LeadOpportunity,
    LeadScore,
    OutreachMessage,
    User,
    UserProfile,
)

# Every table except `users` carries RLS (enabled in migration 0003). Imported by
# the migration and by tests/test_rls.py so the list has one home.
USER_OWNED_TABLES: tuple[str, ...] = (
    "user_profiles",
    "campaigns",
    "businesses",
    "business_sources",
    "business_contacts",
    "business_evidence",
    "digital_audits",
    "lead_scores",
    "lead_opportunities",
    "campaign_leads",
    "lead_activity",
    "outreach_messages",
    "agent_runs",
    "agent_tool_calls",
    "agent_errors",
)

__all__ = [
    "Base",
    "TimestampMixin",
    "UserOwnedMixin",
    "DenormUserMixin",
    "USER_OWNED_TABLES",
    # enums
    "ActivityKind",
    "AgentName",
    "CampaignStatus",
    "ContactType",
    "EvidenceKind",
    "LeadStatus",
    "OutreachChannel",
    "OutreachStatus",
    "RunStatus",
    "ScoreFactor",
    "SocialPresence",
    "WebsiteStatus",
    # tables
    "User",
    "UserProfile",
    "Campaign",
    "Business",
    "BusinessSource",
    "BusinessContact",
    "BusinessEvidence",
    "DigitalAudit",
    "LeadScore",
    "LeadOpportunity",
    "CampaignLead",
    "LeadActivity",
    "OutreachMessage",
    "AgentRun",
    "AgentToolCall",
    "AgentErrorRow",
]
