"""Campaign endpoints.

M2 shipped read-only GET (isolation surface). M3 adds `POST /campaigns` and
`POST /campaigns/{id}/discover`. Isolation is enforced by Postgres RLS, not
Python `WHERE user_id` — a missing/foreign campaign reads back as `None` -> 404.
"""

from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from backend.agents.discovery import run_discovery
from backend.api.deps import CurrentUser, DbSession
from backend.models import Campaign
from backend.models.enums import CampaignStatus
from backend.schemas.campaign import CampaignCreate, DiscoveryResult
from backend.schemas.read import CampaignRead

router = APIRouter(tags=["campaigns"])


@router.get("/campaigns", response_model=list[CampaignRead])
async def list_campaigns(user: CurrentUser, db: DbSession) -> list[Campaign]:
    rows = await db.execute(select(Campaign).order_by(Campaign.created_at.desc()))
    return list(rows.scalars().all())


@router.post(
    "/campaigns",
    response_model=CampaignRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_campaign(
    body: CampaignCreate, user: CurrentUser, db: DbSession
) -> Campaign:
    campaign = Campaign(
        user_id=user.id,
        name=body.name,
        service=body.service,
        industries=body.industries,
        location=body.location,
        budget_min=body.budget_min,
        status=CampaignStatus.DRAFT,
    )
    db.add(campaign)
    await db.commit()
    await db.refresh(campaign)
    return campaign


@router.get("/campaigns/{campaign_id}", response_model=CampaignRead)
async def get_campaign(campaign_id: UUID, user: CurrentUser, db: DbSession) -> Campaign:
    campaign = await db.get(Campaign, campaign_id)
    if campaign is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Not found")
    return campaign


@router.post("/campaigns/{campaign_id}/discover", response_model=DiscoveryResult)
async def discover(
    campaign_id: UUID, user: CurrentUser, db: DbSession
) -> DiscoveryResult:
    campaign = await db.get(Campaign, campaign_id)
    if campaign is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Not found")
    campaign.status = CampaignStatus.RUNNING
    result = await run_discovery(db, campaign)
    await db.commit()
    return result
