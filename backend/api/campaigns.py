"""Read-only campaign endpoints (Milestone 2 isolation surface only — no CRUD,
no discovery; that is Milestone 3). Isolation is enforced by RLS, not Python."""

from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from backend.api.deps import CurrentUser, DbSession
from backend.models import Campaign
from backend.schemas.read import CampaignRead

router = APIRouter(tags=["campaigns"])


@router.get("/campaigns", response_model=list[CampaignRead])
async def list_campaigns(user: CurrentUser, db: DbSession) -> list[Campaign]:
    rows = await db.execute(select(Campaign).order_by(Campaign.created_at.desc()))
    return list(rows.scalars().all())


@router.get("/campaigns/{campaign_id}", response_model=CampaignRead)
async def get_campaign(campaign_id: UUID, user: CurrentUser, db: DbSession) -> Campaign:
    campaign = await db.get(Campaign, campaign_id)
    if campaign is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Not found")
    return campaign
