"""Minimal read schemas for the M2 isolation-test endpoints.

Deliberately thin — these routes exist only so `tests/test_isolation.py` is real.
The rich `types.ts` shapes (LeadSummary/LeadDetail with score, tier, evidence
counts, ...) arrive in Milestone 8 with the OpenAPI regen.
"""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from uuid import UUID

from backend.models.enums import AgentName, CampaignStatus, OutreachChannel, OutreachStatus
from backend.schemas.base import CamelModel


class BusinessRead(CamelModel):
    id: UUID
    name: str
    normalized_name: str
    domain: str | None
    address: str | None
    phone: str | None
    category: str | None
    created_at: datetime


class CampaignRead(CamelModel):
    id: UUID
    name: str
    service: str
    location: str
    status: CampaignStatus
    budget_min: int
    created_at: datetime


class OutreachRead(CamelModel):
    id: UUID
    business_id: UUID
    channel: OutreachChannel
    status: OutreachStatus
    subject: str | None
    approved: bool
    created_at: datetime


class AgentRunRead(CamelModel):
    id: UUID
    campaign_id: UUID
    agent: AgentName
    status: str
    business_count: int
    cost_usd: Decimal
    started_at: datetime
    ended_at: datetime | None
