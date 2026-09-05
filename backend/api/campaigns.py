"""Campaign endpoints.

`GET` routes carry the `types.ts` `Campaign` rollups (`leadCount`, `qualifiedCount`).
`POST /campaigns/{id}/run` executes the whole pipeline; `GET /campaigns/{id}/progress`
derives the cost funnel from `agent_runs`. Isolation is Postgres RLS, not Python —
a missing/foreign campaign reads back as `None` -> 404.
"""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import func, select

from backend.agents.audit import run_audit, run_website_audit
from backend.agents.discovery import run_discovery
from backend.agents.opportunity import run_opportunity
from backend.agents.opportunity.weights import LLM_THRESHOLD
from backend.agents.research import run_research
from backend.api.audit import Fetcher
from backend.api.deps import CurrentUser, DbSession
from backend.api.opportunity import Llm
from backend.api.research import Searcher
from backend.models import AgentRun, Business, Campaign, CampaignLead, LeadScore
from backend.models.enums import AgentName, CampaignStatus, RunStatus
from backend.schemas.campaign import (
    CampaignCreate,
    CampaignProgress,
    DiscoveryResult,
    FunnelStage,
)
from backend.schemas.read import CampaignRead

router = APIRouter(tags=["campaigns"])

_STAGE_ORDER = (
    AgentName.DISCOVERY,
    AgentName.RESEARCH,
    AgentName.AUDIT,
    AgentName.OPPORTUNITY,
)
_STAGE_LABEL = {
    AgentName.DISCOVERY: "Discovering",
    AgentName.RESEARCH: "Researching",
    AgentName.AUDIT: "Auditing",
    AgentName.OPPORTUNITY: "Scoring",
}


async def _campaign_read(db: DbSession, campaign: Campaign) -> CampaignRead:
    lead_count = (
        await db.execute(
            select(func.count())
            .select_from(CampaignLead)
            .where(CampaignLead.campaign_id == campaign.id)
        )
    ).scalar() or 0
    qualified_count = (
        await db.execute(
            select(func.count())
            .select_from(LeadScore)
            .where(
                LeadScore.campaign_id == campaign.id,
                LeadScore.score >= LLM_THRESHOLD,
            )
        )
    ).scalar() or 0
    return CampaignRead(
        id=campaign.id,
        name=campaign.name,
        service=campaign.service,
        industries=list(campaign.industries),
        location=campaign.location,
        status=campaign.status,
        budget_min=campaign.budget_min,
        created_at=campaign.created_at,
        lead_count=lead_count,
        qualified_count=qualified_count,
    )


async def _campaign_progress(db: DbSession, campaign: Campaign) -> CampaignProgress:
    runs = list(
        (
            await db.execute(
                select(AgentRun)
                .where(AgentRun.campaign_id == campaign.id)
                .order_by(AgentRun.started_at)
            )
        ).scalars().all()
    )
    latest: dict[AgentName, AgentRun] = {r.agent: r for r in runs}  # asc order -> last wins
    total = (
        await db.execute(select(func.count()).select_from(Business))
    ).scalar() or 0
    qualified = (
        await db.execute(
            select(func.count())
            .select_from(LeadScore)
            .where(LeadScore.campaign_id == campaign.id, LeadScore.score >= LLM_THRESHOLD)
        )
    ).scalar() or 0

    stages: list[FunnelStage] = []
    prev_kept = total
    for agent in _STAGE_ORDER:
        run = latest.get(agent)
        if run is None:
            stages.append(
                FunnelStage(
                    agent=agent,
                    label=_STAGE_LABEL[agent],
                    status=RunStatus.QUEUED,
                    input=prev_kept,
                    kept=None,
                    dropped=0,
                    drop_reason=None,
                )
            )
            continue
        if agent is AgentName.DISCOVERY:
            kept, reason = total, f"{total} found"
        elif agent is AgentName.OPPORTUNITY:
            kept, reason = qualified, f"{qualified} scored ≥ {LLM_THRESHOLD}"
        elif agent is AgentName.RESEARCH:
            kept, reason = run.business_count, f"enriched {run.business_count}"
        else:
            kept, reason = run.business_count, f"audited {run.business_count}"
        stages.append(
            FunnelStage(
                agent=agent,
                label=_STAGE_LABEL[agent],
                status=run.status,
                input=prev_kept,
                kept=kept,
                dropped=max(0, prev_kept - kept),
                drop_reason=reason,
            )
        )
        prev_kept = kept

    statuses = {r.status for r in runs}
    if RunStatus.FAILED in statuses:
        cstatus = CampaignStatus.FAILED
    elif set(_STAGE_ORDER) <= set(latest) and statuses <= {RunStatus.SUCCEEDED}:
        cstatus = CampaignStatus.COMPLETE
    elif runs:
        cstatus = CampaignStatus.RUNNING
    else:
        cstatus = CampaignStatus.DRAFT

    started = runs[0].started_at if runs else campaign.created_at
    ended = (
        max((r.ended_at for r in runs if r.ended_at), default=None)
        if cstatus in (CampaignStatus.COMPLETE, CampaignStatus.FAILED)
        else None
    )
    return CampaignProgress(
        campaign_id=campaign.id,
        status=cstatus,
        stages=stages,
        started_at=started or datetime.now(),
        ended_at=ended,
    )


@router.get("/campaigns", response_model=list[CampaignRead])
async def list_campaigns(user: CurrentUser, db: DbSession) -> list[CampaignRead]:
    rows = (
        await db.execute(select(Campaign).order_by(Campaign.created_at.desc()))
    ).scalars().all()
    return [await _campaign_read(db, c) for c in rows]


@router.post(
    "/campaigns", response_model=CampaignRead, status_code=status.HTTP_201_CREATED
)
async def create_campaign(
    body: CampaignCreate, user: CurrentUser, db: DbSession
) -> CampaignRead:
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
    return await _campaign_read(db, campaign)


@router.get("/campaigns/{campaign_id}", response_model=CampaignRead)
async def get_campaign(
    campaign_id: UUID, user: CurrentUser, db: DbSession
) -> CampaignRead:
    campaign = await db.get(Campaign, campaign_id)
    if campaign is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Not found")
    return await _campaign_read(db, campaign)


@router.get("/campaigns/{campaign_id}/progress", response_model=CampaignProgress)
async def campaign_progress(
    campaign_id: UUID, user: CurrentUser, db: DbSession
) -> CampaignProgress:
    campaign = await db.get(Campaign, campaign_id)
    if campaign is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Not found")
    return await _campaign_progress(db, campaign)


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


@router.post("/campaigns/{campaign_id}/run", response_model=CampaignProgress)
async def run_campaign(
    campaign_id: UUID,
    user: CurrentUser,
    db: DbSession,
    fetch: Fetcher,
    search: Searcher,
    llm: Llm,
) -> CampaignProgress:
    campaign = await db.get(Campaign, campaign_id)
    if campaign is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Not found")

    campaign.status = CampaignStatus.RUNNING
    await run_discovery(db, campaign)
    await run_research(db, campaign, fetch=fetch, search=search)
    await run_website_audit(db, campaign, fetch=fetch)
    await run_audit(db, campaign)
    await run_opportunity(db, campaign, llm=llm)

    progress = await _campaign_progress(db, campaign)
    campaign.status = progress.status
    await db.commit()
    return progress
