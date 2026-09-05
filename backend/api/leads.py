"""Lead (business) endpoints.

Isolation comes from Postgres RLS on the scoped session — there is deliberately
no `WHERE user_id` here, so if a policy regresses `tests/test_isolation.py` goes
red. A miss is a 404 (a 403 would confirm the row exists).

`GET /leads` and `GET /leads/{id}` return the rich `types.ts` `LeadSummary` /
`LeadDetail`; the `/evidence`, `/audit`, `/score` sub-resources expose the same
data piecewise (kept for granular use and the M5–M7 tests).
"""

from __future__ import annotations

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy import func, select, update

from backend.agents.opportunity import tier_for
from backend.agents.opportunity.weights import LLM_THRESHOLD
from backend.api.deps import CurrentUser, DbSession
from backend.models import (
    Business,
    BusinessEvidence,
    CampaignLead,
    DigitalAudit,
    LeadOpportunity,
    LeadScore,
)
from backend.models.enums import LeadStatus
from backend.schemas.audit import DigitalAuditRead
from backend.schemas.evidence import EvidenceRead
from backend.schemas.leads import LeadDetail, LeadStatusUpdate, LeadSummary
from backend.schemas.opportunity import LeadScoreRead, OpportunityRead

router = APIRouter(tags=["leads"])


def _location(address: str | None) -> str:
    if not address:
        return ""
    parts = [p.strip() for p in address.split(",") if p.strip()]
    return ", ".join(parts[-2:]) if parts else ""


def _score_sq():
    return (
        select(func.max(LeadScore.score))
        .where(LeadScore.business_id == Business.id)
        .correlate(Business)
        .scalar_subquery()
    )


def _has_website_expr():
    audit_sq = (
        select(DigitalAudit.has_website)
        .where(DigitalAudit.business_id == Business.id)
        .correlate(Business)
        .scalar_subquery()
    )
    return func.coalesce(audit_sq, Business.domain.isnot(None))


def _status_sq():
    return (
        select(CampaignLead.status)
        .where(CampaignLead.business_id == Business.id)
        .correlate(Business)
        .order_by(CampaignLead.added_at.desc())
        .limit(1)
        .scalar_subquery()
    )


def _evidence_count_sq():
    return (
        select(func.count())
        .select_from(BusinessEvidence)
        .where(BusinessEvidence.business_id == Business.id)
        .correlate(Business)
        .scalar_subquery()
    )


def _summary(biz: Business, score, lead_status, has_website, evidence_count) -> LeadSummary:
    s = int(score or 0)
    return LeadSummary(
        id=biz.id,
        business_name=biz.name,
        location=_location(biz.address),
        category=biz.category or "",
        score=s,
        tier=tier_for(s),
        status=lead_status or LeadStatus.NEW,
        evidence_count=int(evidence_count or 0),
        has_website=bool(has_website),
    )


@router.get("/leads", response_model=list[LeadSummary])
async def list_leads(
    user: CurrentUser,
    db: DbSession,
    score_min: Annotated[int | None, Query(alias="scoreMin", ge=0, le=100)] = None,
    score_max: Annotated[int | None, Query(alias="scoreMax", ge=0, le=100)] = None,
    lead_status: Annotated[LeadStatus | None, Query(alias="status")] = None,
    industry: Annotated[str | None, Query()] = None,
    has_website: Annotated[bool | None, Query(alias="hasWebsite")] = None,
) -> list[LeadSummary]:
    score = _score_sq()
    www = _has_website_expr()
    lstatus = _status_sq()
    ev_count = _evidence_count_sq()

    stmt = select(Business, score, lstatus, www, ev_count)
    if score_min is not None:
        stmt = stmt.where(func.coalesce(score, 0) >= score_min)
    if score_max is not None:
        stmt = stmt.where(func.coalesce(score, 0) <= score_max)
    if lead_status is not None:
        stmt = stmt.where(func.coalesce(lstatus, LeadStatus.NEW.value) == lead_status.value)
    if industry:
        stmt = stmt.where(Business.category.ilike(f"%{industry}%"))
    if has_website is not None:
        stmt = stmt.where(www == has_website)
    stmt = stmt.order_by(func.coalesce(score, 0).desc(), Business.created_at.desc())

    rows = (await db.execute(stmt)).all()
    return [_summary(*row) for row in rows]


@router.get("/leads/{business_id}", response_model=LeadDetail)
async def get_lead(business_id: UUID, user: CurrentUser, db: DbSession) -> LeadDetail:
    business = await db.get(Business, business_id)
    if business is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Not found")

    score_row = (
        await db.execute(
            select(LeadScore)
            .where(LeadScore.business_id == business_id)
            .order_by(LeadScore.scored_at.desc())
        )
    ).scalars().first()
    audit = await db.get(DigitalAudit, business_id)
    opp = await db.get(LeadOpportunity, business_id)
    lead = (
        await db.execute(
            select(CampaignLead)
            .where(CampaignLead.business_id == business_id)
            .order_by(CampaignLead.added_at.desc())
        )
    ).scalars().first()
    evidence = list(
        (
            await db.execute(
                select(BusinessEvidence)
                .where(BusinessEvidence.business_id == business_id)
                .order_by(BusinessEvidence.collected_at, BusinessEvidence.claim)
            )
        ).scalars().all()
    )

    score = score_row.score if score_row else 0
    summary = _summary(
        business,
        score,
        lead.status if lead else None,
        audit.has_website if audit else bool(business.domain),
        len(evidence),
    )
    return LeadDetail(
        **summary.model_dump(by_alias=False),
        address=business.address or "",
        phone=business.phone,
        domain=business.domain,
        campaign_id=lead.campaign_id if lead else None,
        evidence=[EvidenceRead.model_validate(e) for e in evidence],
        breakdown=dict(score_row.breakdown) if score_row else {},
        audit=DigitalAuditRead.model_validate(audit) if audit else None,
        recommended_service=opp.recommended_service if opp else "",
        sales_angle=opp.sales_angle if opp else "",
        reasoning=opp.reasoning if opp else "",
        confidence=opp.confidence if opp else 0.0,
        scored_at=score_row.scored_at if score_row else None,
    )


@router.patch("/leads/{business_id}/status", response_model=LeadSummary)
async def set_lead_status(
    business_id: UUID, body: LeadStatusUpdate, user: CurrentUser, db: DbSession
) -> LeadSummary:
    if await db.get(Business, business_id) is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Not found")
    result = await db.execute(
        update(CampaignLead)
        .where(CampaignLead.business_id == business_id)
        .values(status=body.status)
    )
    if result.rowcount == 0:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Lead is not in a campaign yet")
    await db.commit()

    row = (
        await db.execute(
            select(
                Business, _score_sq(), _status_sq(), _has_website_expr(), _evidence_count_sq()
            ).where(Business.id == business_id)
        )
    ).one()
    return _summary(*row)


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
