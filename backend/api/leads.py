"""Read-only lead (business) endpoints.

Isolation comes from Postgres RLS on the scoped session — there is deliberately
no `WHERE user_id` here, so if a policy regresses `tests/test_isolation.py` goes
red. A miss is a 404 (a 403 would confirm the row exists).
"""

from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from backend.agents.opportunity import tier_for
from backend.agents.opportunity.weights import LLM_THRESHOLD
from backend.api.deps import CurrentUser, DbSession
from backend.models import (
    Business,
    BusinessEvidence,
    DigitalAudit,
    LeadOpportunity,
    LeadScore,
)
from backend.schemas.audit import DigitalAuditRead
from backend.schemas.evidence import EvidenceRead
from backend.schemas.opportunity import LeadScoreRead, OpportunityRead
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


@router.get("/leads/{business_id}/audit", response_model=DigitalAuditRead)
async def get_lead_audit(
    business_id: UUID, user: CurrentUser, db: DbSession
) -> DigitalAudit:
    if await db.get(Business, business_id) is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Not found")
    audit = await db.get(DigitalAudit, business_id)
    if audit is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Not audited yet")
    return audit


@router.get("/leads/{business_id}/score", response_model=LeadScoreRead)
async def get_lead_score(
    business_id: UUID, user: CurrentUser, db: DbSession
) -> LeadScoreRead:
    if await db.get(Business, business_id) is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Not found")
    # M7 scores the whole business pool, so in practice one row per business; if a
    # business were scored under several campaigns, show the most recent.
    row = (
        await db.execute(
            select(LeadScore)
            .where(LeadScore.business_id == business_id)
            .order_by(LeadScore.scored_at.desc())
        )
    ).scalars().first()
    if row is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Not scored yet")
    opp = await db.get(LeadOpportunity, business_id)
    return LeadScoreRead(
        business_id=row.business_id,
        score=row.score,
        tier=tier_for(row.score),
        qualified=row.score >= LLM_THRESHOLD,
        breakdown=dict(row.breakdown),
        model_version=row.model_version,
        scored_at=row.scored_at,
        opportunity=OpportunityRead.model_validate(opp) if opp is not None else None,
    )
