"""Pydantic schemas for campaigns, the discovery run result, and campaign progress."""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import Field

from backend.models.enums import AgentName, CampaignStatus, RunStatus
from backend.schemas.base import CamelModel


class CampaignCreate(CamelModel):
    name: str = Field(min_length=1, max_length=200)
    service: str = Field(min_length=1, max_length=200)
    industries: list[str] = Field(default_factory=list)
    location: str = Field(min_length=1, max_length=200)
    budget_min: int = Field(default=0, ge=0)


class DiscoveryResult(CamelModel):
    """Outcome of one `POST /campaigns/{id}/discover`. In eager mode the request
    blocks until this is final, so `status` is already `succeeded`/`failed`."""

    run_id: UUID
    campaign_id: UUID
    status: RunStatus
    discovered: int  # rows the source returned
    inserted: int  # new businesses written this run
    duplicates: int  # candidates skipped as already-known
    duration_ms: int


class FunnelStage(CamelModel):
    """One stage of the cost funnel, derived from an `agent_runs` row. `kept`
    shrinks down the pipeline; `dropped`/`drop_reason` make the narrowing legible."""

    agent: AgentName
    label: str
    status: RunStatus
    input: int
    kept: int | None  # null while the stage has not run
    dropped: int
    drop_reason: str | None


class CampaignProgress(CamelModel):
    campaign_id: UUID
    status: CampaignStatus
    stages: list[FunnelStage]
    started_at: datetime
    ended_at: datetime | None
