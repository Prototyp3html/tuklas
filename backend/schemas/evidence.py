"""Pydantic schemas for evidence rows and the research run result."""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from backend.models.enums import EvidenceKind, RunStatus, ScoreFactor
from backend.schemas.base import CamelModel


class EvidenceRead(CamelModel):
    id: UUID
    claim: str
    observed_value: str
    source_url: str
    confidence: float
    collected_at: datetime
    # M6 fills `kind`; `weight`/`factor` stay null until M7 scoring.
    kind: EvidenceKind | None = None
    weight: int | None = None
    factor: ScoreFactor | None = None


class ResearchResult(CamelModel):
    run_id: UUID
    campaign_id: UUID
    status: RunStatus
    businesses_researched: int
    evidence_written: int
    pages_fetched: int
    duration_ms: int
