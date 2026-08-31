"""The 16 tables of BUILD_GUIDE.md Part 2, plus the non-negotiable rules
(every user-owned row has `user_id`, `created_at`, `updated_at`; RLS on every
user-owned table — enabled in migration 0003).

Ownership shape:
- directly owned (`UserOwnedMixin`): user_profiles, campaigns, businesses,
  agent_runs, lead_activity
- transitively owned (`DenormUserMixin` + composite FK to parent's
  `(id, user_id)`): business_sources, business_contacts, business_evidence,
  digital_audits, lead_scores, lead_opportunities, campaign_leads,
  outreach_messages, agent_tool_calls, agent_errors
- outside RLS: users (register inserts / login-by-email happen before any
  identity exists; no route looks a user up by anything but the token `sub`)
"""

from __future__ import annotations

import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    Enum,
    ForeignKey,
    ForeignKeyConstraint,
    Index,
    Numeric,
    String,
    Text,
    UniqueConstraint,
    func,
    text,
)
from sqlalchemy.dialects.postgresql import ARRAY, JSONB
from sqlalchemy.orm import Mapped, mapped_column

from backend.models.base import (
    Base,
    DenormUserMixin,
    TimestampMixin,
    UserOwnedMixin,
    pk_uuid,
)
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


def _enum(py_enum, **kw):
    """VARCHAR + CHECK, storing the enum *value* (not its name)."""
    return mapped_column(
        Enum(
            py_enum,
            native_enum=False,
            create_constraint=True,
            length=32,
            name=py_enum.__name__.lower(),
            values_callable=lambda e: [m.value for m in e],
        ),
        **kw,
    )


_ts = lambda **kw: mapped_column(DateTime(timezone=True), **kw)  # noqa: E731
_now = dict(nullable=False, server_default=func.now())


# --------------------------------------------------------------------------- #
# Identity                                                                     #
# --------------------------------------------------------------------------- #
class User(TimestampMixin, Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = pk_uuid()
    email: Mapped[str] = mapped_column(String(320), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(Text, nullable=False)
    # BUILD_GUIDE.md:1070 — /admin/* must 403 from the backend, not a hidden link.
    is_admin: Mapped[bool] = mapped_column(nullable=False, server_default=text("false"))


class UserProfile(TimestampMixin, Base):
    __tablename__ = "user_profiles"

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    services: Mapped[list[str]] = mapped_column(
        ARRAY(Text), nullable=False, server_default=text("'{}'")
    )
    target_industries: Mapped[list[str]] = mapped_column(
        ARRAY(Text), nullable=False, server_default=text("'{}'")
    )
    target_locations: Mapped[list[str]] = mapped_column(
        ARRAY(Text), nullable=False, server_default=text("'{}'")
    )
    price_range_min: Mapped[int] = mapped_column(nullable=False, server_default=text("0"))
    price_range_max: Mapped[int] = mapped_column(nullable=False, server_default=text("0"))
    icp_notes: Mapped[str] = mapped_column(Text, nullable=False, server_default=text("''"))


# --------------------------------------------------------------------------- #
# Campaigns & businesses                                                       #
# --------------------------------------------------------------------------- #
class Campaign(UserOwnedMixin, Base):
    __tablename__ = "campaigns"
    __table_args__ = (
        UniqueConstraint("id", "user_id", name="uq_campaigns_id_user_id"),
    )

    id: Mapped[uuid.UUID] = pk_uuid()
    name: Mapped[str] = mapped_column(Text, nullable=False)
    service: Mapped[str] = mapped_column(Text, nullable=False)
    industries: Mapped[list[str]] = mapped_column(
        ARRAY(Text), nullable=False, server_default=text("'{}'")
    )
    location: Mapped[str] = mapped_column(Text, nullable=False)
    budget_min: Mapped[int] = mapped_column(nullable=False, server_default=text("0"))
    status: Mapped[CampaignStatus] = _enum(
        CampaignStatus, nullable=False, server_default=text("'draft'")
    )


class Business(UserOwnedMixin, Base):
    __tablename__ = "businesses"
    __table_args__ = (
        UniqueConstraint("id", "user_id", name="uq_businesses_id_user_id"),
        # Free now, painful later: Milestone 3 dedup.
        Index(
            "uq_businesses_user_domain",
            "user_id",
            "domain",
            unique=True,
            postgresql_where=text("domain IS NOT NULL"),
        ),
        Index("ix_businesses_user_normalized_name", "user_id", "normalized_name"),
    )

    id: Mapped[uuid.UUID] = pk_uuid()
    name: Mapped[str] = mapped_column(Text, nullable=False)
    normalized_name: Mapped[str] = mapped_column(Text, nullable=False)
    domain: Mapped[str | None] = mapped_column(Text)
    address: Mapped[str | None] = mapped_column(Text)
    phone: Mapped[str | None] = mapped_column(Text)
    category: Mapped[str | None] = mapped_column(Text)
    lat: Mapped[float | None] = mapped_column()
    lng: Mapped[float | None] = mapped_column()


class BusinessSource(DenormUserMixin, Base):
    __tablename__ = "business_sources"
    __table_args__ = (
        ForeignKeyConstraint(
            ["business_id", "user_id"],
            ["businesses.id", "businesses.user_id"],
            ondelete="CASCADE",
            name="fk_business_sources_business",
        ),
        Index("ix_business_sources_business_id", "business_id"),
    )

    id: Mapped[uuid.UUID] = pk_uuid()
    business_id: Mapped[uuid.UUID] = mapped_column(nullable=False)
    source_name: Mapped[str] = mapped_column(Text, nullable=False)
    source_id: Mapped[str | None] = mapped_column(Text)
    fetched_at: Mapped[datetime] = _ts(**_now)


class BusinessContact(DenormUserMixin, Base):
    __tablename__ = "business_contacts"
    __table_args__ = (
        ForeignKeyConstraint(
            ["business_id", "user_id"],
            ["businesses.id", "businesses.user_id"],
            ondelete="CASCADE",
            name="fk_business_contacts_business",
        ),
        CheckConstraint(
            "confidence >= 0 AND confidence <= 1",
            name="confidence_range",
        ),
        Index("ix_business_contacts_business_id", "business_id"),
    )

    id: Mapped[uuid.UUID] = pk_uuid()
    business_id: Mapped[uuid.UUID] = mapped_column(nullable=False)
    type: Mapped[ContactType] = _enum(ContactType, nullable=False)
    value: Mapped[str] = mapped_column(Text, nullable=False)
    confidence: Mapped[float] = mapped_column(nullable=False, server_default=text("0"))


# --------------------------------------------------------------------------- #
# Evidence & audit                                                             #
# --------------------------------------------------------------------------- #
class BusinessEvidence(DenormUserMixin, Base):
    __tablename__ = "business_evidence"
    __table_args__ = (
        ForeignKeyConstraint(
            ["business_id", "user_id"],
            ["businesses.id", "businesses.user_id"],
            ondelete="CASCADE",
            name="fk_business_evidence_business",
        ),
        CheckConstraint(
            "confidence >= 0 AND confidence <= 1",
            name="confidence_range",
        ),
        Index("ix_business_evidence_business_id", "business_id"),
    )

    id: Mapped[uuid.UUID] = pk_uuid()
    business_id: Mapped[uuid.UUID] = mapped_column(nullable=False)
    claim: Mapped[str] = mapped_column(Text, nullable=False)
    observed_value: Mapped[str] = mapped_column(Text, nullable=False)
    source_url: Mapped[str] = mapped_column(Text, nullable=False)
    confidence: Mapped[float] = mapped_column(nullable=False, server_default=text("0"))
    collected_at: Mapped[datetime] = _ts(**_now)
    # nullable now (from types.ts) — populated by Milestones 5-7.
    kind: Mapped[EvidenceKind | None] = _enum(EvidenceKind)
    weight: Mapped[int | None] = mapped_column()
    factor: Mapped[ScoreFactor | None] = _enum(ScoreFactor)


class DigitalAudit(DenormUserMixin, Base):
    __tablename__ = "digital_audits"
    __table_args__ = (
        ForeignKeyConstraint(
            ["business_id", "user_id"],
            ["businesses.id", "businesses.user_id"],
            ondelete="CASCADE",
            name="fk_digital_audits_business",
        ),
        CheckConstraint(
            "confidence >= 0 AND confidence <= 1",
            name="confidence_range",
        ),
    )

    business_id: Mapped[uuid.UUID] = mapped_column(primary_key=True)
    has_website: Mapped[bool] = mapped_column(nullable=False, server_default=text("false"))
    website_status: Mapped[WebsiteStatus] = _enum(
        WebsiteStatus, nullable=False, server_default=text("'none'")
    )
    has_booking: Mapped[bool] = mapped_column(nullable=False, server_default=text("false"))
    has_ordering: Mapped[bool] = mapped_column(nullable=False, server_default=text("false"))
    mobile_friendly: Mapped[bool | None] = mapped_column()
    social_presence: Mapped[SocialPresence] = _enum(
        SocialPresence, nullable=False, server_default=text("'none'")
    )
    digital_gaps: Mapped[list[str]] = mapped_column(
        ARRAY(Text), nullable=False, server_default=text("'{}'")
    )
    confidence: Mapped[float] = mapped_column(nullable=False, server_default=text("0"))
    audited_at: Mapped[datetime] = _ts(**_now)


# --------------------------------------------------------------------------- #
# Scoring                                                                      #
# --------------------------------------------------------------------------- #
class LeadScore(DenormUserMixin, Base):
    __tablename__ = "lead_scores"
    __table_args__ = (
        ForeignKeyConstraint(
            ["business_id", "user_id"],
            ["businesses.id", "businesses.user_id"],
            ondelete="CASCADE",
            name="fk_lead_scores_business",
        ),
        ForeignKeyConstraint(
            ["campaign_id", "user_id"],
            ["campaigns.id", "campaigns.user_id"],
            ondelete="CASCADE",
            name="fk_lead_scores_campaign",
        ),
        CheckConstraint("score >= 0", name="score_nonneg"),
        Index("ix_lead_scores_campaign_score", "campaign_id", text("score DESC")),
    )

    business_id: Mapped[uuid.UUID] = mapped_column(primary_key=True)
    campaign_id: Mapped[uuid.UUID] = mapped_column(primary_key=True)
    score: Mapped[int] = mapped_column(nullable=False, server_default=text("0"))
    breakdown: Mapped[dict] = mapped_column(
        JSONB, nullable=False, server_default=text("'{}'::jsonb")
    )
    model_version: Mapped[str] = mapped_column(
        Text, nullable=False, server_default=text("''")
    )
    scored_at: Mapped[datetime] = _ts(**_now)


class LeadOpportunity(DenormUserMixin, Base):
    __tablename__ = "lead_opportunities"
    __table_args__ = (
        ForeignKeyConstraint(
            ["business_id", "user_id"],
            ["businesses.id", "businesses.user_id"],
            ondelete="CASCADE",
            name="fk_lead_opportunities_business",
        ),
        CheckConstraint(
            "confidence >= 0 AND confidence <= 1",
            name="confidence_range",
        ),
    )

    business_id: Mapped[uuid.UUID] = mapped_column(primary_key=True)
    recommended_service: Mapped[str] = mapped_column(
        Text, nullable=False, server_default=text("''")
    )
    sales_angle: Mapped[str] = mapped_column(Text, nullable=False, server_default=text("''"))
    reasoning: Mapped[str] = mapped_column(Text, nullable=False, server_default=text("''"))
    confidence: Mapped[float] = mapped_column(nullable=False, server_default=text("0"))


# --------------------------------------------------------------------------- #
# Campaign membership & activity                                               #
# --------------------------------------------------------------------------- #
class CampaignLead(DenormUserMixin, Base):
    __tablename__ = "campaign_leads"
    __table_args__ = (
        ForeignKeyConstraint(
            ["campaign_id", "user_id"],
            ["campaigns.id", "campaigns.user_id"],
            ondelete="CASCADE",
            name="fk_campaign_leads_campaign",
        ),
        ForeignKeyConstraint(
            ["business_id", "user_id"],
            ["businesses.id", "businesses.user_id"],
            ondelete="CASCADE",
            name="fk_campaign_leads_business",
        ),
        # PK (campaign_id, business_id): its leading column discharges the guide's
        # required campaign_leads(campaign_id) index.
        Index("ix_campaign_leads_business_id", "business_id"),
    )

    campaign_id: Mapped[uuid.UUID] = mapped_column(primary_key=True)
    business_id: Mapped[uuid.UUID] = mapped_column(primary_key=True)
    status: Mapped[LeadStatus] = _enum(
        LeadStatus, nullable=False, server_default=text("'new'")
    )
    added_at: Mapped[datetime] = _ts(**_now)


class LeadActivity(UserOwnedMixin, Base):
    __tablename__ = "lead_activity"
    __table_args__ = (
        ForeignKeyConstraint(
            ["business_id", "user_id"],
            ["businesses.id", "businesses.user_id"],
            ondelete="CASCADE",
            name="fk_lead_activity_business",
        ),
    )

    id: Mapped[uuid.UUID] = pk_uuid()
    business_id: Mapped[uuid.UUID] = mapped_column(nullable=False)
    type: Mapped[ActivityKind] = _enum(ActivityKind, nullable=False)
    note: Mapped[str] = mapped_column(Text, nullable=False, server_default=text("''"))


# --------------------------------------------------------------------------- #
# Outreach                                                                     #
# --------------------------------------------------------------------------- #
class OutreachMessage(DenormUserMixin, Base):
    __tablename__ = "outreach_messages"
    __table_args__ = (
        ForeignKeyConstraint(
            ["business_id", "user_id"],
            ["businesses.id", "businesses.user_id"],
            ondelete="CASCADE",
            name="fk_outreach_messages_business",
        ),
        Index("ix_outreach_messages_business_id", "business_id"),
    )

    id: Mapped[uuid.UUID] = pk_uuid()
    business_id: Mapped[uuid.UUID] = mapped_column(nullable=False)
    channel: Mapped[OutreachChannel] = _enum(OutreachChannel, nullable=False)
    subject: Mapped[str | None] = mapped_column(Text)
    draft: Mapped[str] = mapped_column(Text, nullable=False, server_default=text("''"))
    approved: Mapped[bool] = mapped_column(nullable=False, server_default=text("false"))
    status: Mapped[OutreachStatus] = _enum(
        OutreachStatus, nullable=False, server_default=text("'draft'")
    )
    sent_at: Mapped[datetime | None] = _ts()
    edited_by_user: Mapped[bool] = mapped_column(
        nullable=False, server_default=text("false")
    )


# --------------------------------------------------------------------------- #
# Observability                                                                #
# --------------------------------------------------------------------------- #
class AgentRun(UserOwnedMixin, Base):
    __tablename__ = "agent_runs"
    __table_args__ = (
        UniqueConstraint("id", "user_id", name="uq_agent_runs_id_user_id"),
        ForeignKeyConstraint(
            ["campaign_id", "user_id"],
            ["campaigns.id", "campaigns.user_id"],
            ondelete="CASCADE",
            name="fk_agent_runs_campaign",
        ),
        Index("ix_agent_runs_campaign_started", "campaign_id", "started_at"),
    )

    id: Mapped[uuid.UUID] = pk_uuid()
    campaign_id: Mapped[uuid.UUID] = mapped_column(nullable=False)
    agent: Mapped[AgentName] = _enum(AgentName, nullable=False)
    status: Mapped[RunStatus] = _enum(
        RunStatus, nullable=False, server_default=text("'queued'")
    )
    started_at: Mapped[datetime] = _ts(**_now)
    ended_at: Mapped[datetime | None] = _ts()
    duration_ms: Mapped[int | None] = mapped_column()
    cost_usd: Mapped[Decimal] = mapped_column(
        Numeric(10, 4), nullable=False, server_default=text("0")
    )
    business_count: Mapped[int] = mapped_column(nullable=False, server_default=text("0"))


class AgentToolCall(DenormUserMixin, Base):
    __tablename__ = "agent_tool_calls"
    __table_args__ = (
        ForeignKeyConstraint(
            ["run_id", "user_id"],
            ["agent_runs.id", "agent_runs.user_id"],
            ondelete="CASCADE",
            name="fk_agent_tool_calls_run",
        ),
        Index("ix_agent_tool_calls_run_id", "run_id"),
    )

    id: Mapped[uuid.UUID] = pk_uuid()
    run_id: Mapped[uuid.UUID] = mapped_column(nullable=False)
    tool: Mapped[str] = mapped_column(Text, nullable=False)
    input: Mapped[dict] = mapped_column(
        JSONB, nullable=False, server_default=text("'{}'::jsonb")
    )
    output: Mapped[dict] = mapped_column(
        JSONB, nullable=False, server_default=text("'{}'::jsonb")
    )
    ms: Mapped[int] = mapped_column(nullable=False, server_default=text("0"))


class AgentErrorRow(DenormUserMixin, Base):
    __tablename__ = "agent_errors"
    __table_args__ = (
        ForeignKeyConstraint(
            ["run_id", "user_id"],
            ["agent_runs.id", "agent_runs.user_id"],
            ondelete="CASCADE",
            name="fk_agent_errors_run",
        ),
        Index("ix_agent_errors_run_id", "run_id"),
    )

    id: Mapped[uuid.UUID] = pk_uuid()
    run_id: Mapped[uuid.UUID] = mapped_column(nullable=False)
    error_type: Mapped[str] = mapped_column(Text, nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False, server_default=text("''"))
    traceback: Mapped[str | None] = mapped_column(Text)
