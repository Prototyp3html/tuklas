"""Schemas for opportunity scoring (Milestone 7).

`OpportunityAnalysis` is the LLM's structured output — a plain `BaseModel` (it is
a prompt contract, not an API shape). The rest are API schemas.
"""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field

from backend.models.enums import RunStatus, ScoreTier
from backend.schemas.base import CamelModel


class OpportunityAnalysis(BaseModel):
    """What the LLM must return. `evidence_ids` must reference real evidence rows
    for the business — the runner rejects anything else."""

    score: int = Field(ge=0, le=100)
    recommended_service: str
    sales_angle: str
    reasoning: str
    confidence: float = Field(ge=0, le=1)
    evidence_ids: list[UUID]


class OpportunityResult(CamelModel):
    """Response for `POST /campaigns/{id}/score`."""

    run_id: UUID
    campaign_id: UUID
    status: RunStatus
    scored: int  # lead_scores rows written (Layer 1, every business)
    qualified: int  # of those, score >= threshold (Layer 2 attempted)
    llm_calls: int  # grounded lead_opportunities rows written
    llm_failures: int  # qualified businesses whose LLM output was rejected
    duration_ms: int


class OpportunityRead(CamelModel):
    recommended_service: str
    sales_angle: str
    reasoning: str
    confidence: float


class LeadScoreRead(CamelModel):
    """`GET /leads/{id}/score` — the deterministic score plus the LLM verdict."""

    business_id: UUID
    score: int
    tier: ScoreTier
    qualified: bool
    breakdown: dict[str, int]
    model_version: str
    scored_at: datetime
    opportunity: OpportunityRead | None
