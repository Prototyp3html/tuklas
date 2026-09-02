"""Read-only lead (business) endpoints.

Isolation comes from Postgres RLS on the scoped session — there is deliberately
no `WHERE user_id` here, so if a policy regresses `tests/test_isolation.py` goes
red. A miss is a 404 (a 403 would confirm the row exists).
"""

from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from backend.api.deps import CurrentUser, DbSession
from backend.models import Business, BusinessEvidence
from backend.schemas.evidence import EvidenceRead
from backend.schemas.read import BusinessRead

router = APIRouter(tags=["leads"])


@router.get("/leads", response_model=list[BusinessRead])
async def list_leads(user: CurrentUser, db: DbSession) -> list[Business]:
    rows = await db.execute(select(Business).order_by(Business.created_at.desc()))
    return list(rows.scalars().all())


@router.get("/leads/{business_id}", response_model=BusinessRead)
async def get_lead(business_id: UUID, user: CurrentUser, db: DbSession) -> Business:
    business = await db.get(Business, business_id)
    if business is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Not found")
    return business


@router.get("/leads/{business_id}/evidence", response_model=list[EvidenceRead])
async def get_lead_evidence(
    business_id: UUID, user: CurrentUser, db: DbSession
) -> list[BusinessEvidence]:
    if await db.get(Business, business_id) is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Not found")
    rows = await db.execute(
        select(BusinessEvidence)
        .where(BusinessEvidence.business_id == business_id)
        .order_by(BusinessEvidence.collected_at, BusinessEvidence.claim)
    )
    return list(rows.scalars().all())
