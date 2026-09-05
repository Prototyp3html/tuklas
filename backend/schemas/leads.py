"""Lead list + detail schemas (Milestone 8).

Mirror `frontend/lib/types.ts` `LeadSummary` / `LeadDetail`. `LeadDetail` composes
the same data the `/leads/{id}/evidence`, `/audit`, `/score` sub-resources expose.
"""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from backend.models.enums import LeadStatus, ScoreTier
from backend.schemas.audit import DigitalAuditRead
from backend.schemas.base import CamelModel
from backend.schemas.evidence import EvidenceRead


class LeadSummary(CamelModel):
    id: UUID
    business_name: str
    location: str
    category: str
    score: int
    tier: ScoreTier
    status: LeadStatus
    evidence_count: int
    has_website: bool


class LeadDetail(LeadSummary):
    address: str
    phone: str | None
    domain: str | None
    campaign_id: UUID | None
    evidence: list[EvidenceRead]
    breakdown: dict[str, int]
    audit: DigitalAuditRead | None
    recommended_service: str
    sales_angle: str
    reasoning: str
    confidence: float
    scored_at: datetime | None


class LeadStatusUpdate(CamelModel):
    status: LeadStatus
