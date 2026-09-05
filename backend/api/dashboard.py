"""Dashboard snapshot (Milestone 8): four/five KPI cards + the opportunity funnel.

`range=all` (default) counts everything and reports no deltas; `range=week` counts
the last 7 days and compares to the 7 days before.
"""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from typing import Annotated

from fastapi import APIRouter, Query
from sqlalchemy import ColumnElement, func, select

from backend.agents.opportunity.weights import LLM_THRESHOLD
from backend.api.deps import CurrentUser, DbSession
from backend.models import Business, DigitalAudit, LeadScore
from backend.schemas.dashboard import (
    DashboardFunnelStage,
    DashboardKpi,
    DashboardSnapshot,
    DateRange,
)

router = APIRouter(tags=["dashboard"])
_HIGH_PRIORITY = 80


@router.get("/dashboard", response_model=DashboardSnapshot)
async def dashboard(
    user: CurrentUser,
    db: DbSession,
    range: Annotated[DateRange, Query()] = "all",
) -> DashboardSnapshot:
    now = datetime.now(UTC)
    cur_start = now - timedelta(days=7)
    prev_start = now - timedelta(days=14)

    async def kpi(model, ts_col: ColumnElement, *where: ColumnElement) -> tuple[int, float | None]:
        base = select(func.count()).select_from(model)
        for clause in where:
            base = base.where(clause)
        if range == "all":
            return (await db.execute(base)).scalar() or 0, None
        cur = (await db.execute(base.where(ts_col >= cur_start))).scalar() or 0
        prev = (
            await db.execute(base.where(ts_col >= prev_start, ts_col < cur_start))
        ).scalar() or 0
        delta = None if prev == 0 else round((cur - prev) / prev * 100, 1)
        return cur, delta

    scanned, d_scanned = await kpi(Business, Business.created_at)
    analyzed, d_analyzed = await kpi(DigitalAudit, DigitalAudit.audited_at)
    qualified, d_qualified = await kpi(
        LeadScore, LeadScore.scored_at, LeadScore.score >= LLM_THRESHOLD
    )
    high, d_high = await kpi(
        LeadScore, LeadScore.scored_at, LeadScore.score >= _HIGH_PRIORITY
    )

    kpis = [
        DashboardKpi(key="scanned", label="Businesses scanned", value=scanned,
                     delta_pct=d_scanned, hint="Discovered across all campaigns"),
        DashboardKpi(key="analyzed", label="Websites analyzed", value=analyzed,
                     delta_pct=d_analyzed, hint="Have a digital audit on file"),
        DashboardKpi(key="qualified", label="Qualified leads", value=qualified,
                     delta_pct=d_qualified, hint=f"Score {LLM_THRESHOLD} or higher"),
        DashboardKpi(key="highPriority", label="High priority", value=high,
                     delta_pct=d_high, hint=f"Score {_HIGH_PRIORITY} or higher"),
        DashboardKpi(key="replies", label="Replies", value=0,
                     delta_pct=None, hint="Outreach responses (coming soon)"),
    ]

    bands = [
        ("discovered", "Discovered", scanned),
        ("analyzed", "Analyzed", analyzed),
        ("qualified", "Qualified", qualified),
        ("highPriority", "High priority", high),
    ]
    reasons = {
        "analyzed": "not yet audited",
        "qualified": "below the score threshold",
        "highPriority": "qualified but under 80",
    }
    funnel: list[DashboardFunnelStage] = []
    prev = None
    for key, label, count in bands:
        dropped = 0 if prev is None else max(0, prev - count)
        funnel.append(
            DashboardFunnelStage(
                key=key, label=label, count=count,
                dropped=dropped, drop_reason=reasons.get(key) if dropped else None,
            )
        )
        prev = count

    return DashboardSnapshot(range=range, kpis=kpis, funnel=funnel)
