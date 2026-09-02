"""Pydantic schemas for campaigns and the discovery run result."""

from __future__ import annotations

from uuid import UUID

from pydantic import Field

from backend.models.enums import RunStatus
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
