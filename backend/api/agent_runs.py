"""Read-only agent-run endpoints (Milestone 2 isolation surface only). The run
pipeline itself is Milestone 3+. Isolation is enforced by RLS, not Python."""

from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from backend.api.deps import CurrentUser, DbSession
from backend.models import AgentRun
from backend.schemas.read import AgentRunRead

router = APIRouter(tags=["agent-runs"])


@router.get("/agent-runs", response_model=list[AgentRunRead])
async def list_agent_runs(user: CurrentUser, db: DbSession) -> list[AgentRun]:
    rows = await db.execute(select(AgentRun).order_by(AgentRun.started_at.desc()))
    return list(rows.scalars().all())


@router.get("/agent-runs/{run_id}", response_model=AgentRunRead)
async def get_agent_run(run_id: UUID, user: CurrentUser, db: DbSession) -> AgentRun:
    run = await db.get(AgentRun, run_id)
    if run is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Not found")
    return run
