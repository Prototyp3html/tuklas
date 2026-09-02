"""Shared run-logging wrapper for every pipeline stage.

Each stage opens an `agent_runs` row through `agent_run(...)`: it records
`started_at`/`ended_at`/`duration_ms` and flips `status` to `succeeded` or
`failed`. The row is written on the caller's session and committed (or rolled
back) with the caller's transaction — M3's request path commits once at the end,
so a failed run currently rolls back with it. Durable failure logging on its own
transaction arrives with the real Celery worker.
"""

from __future__ import annotations

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from datetime import UTC, datetime
from time import perf_counter

from sqlalchemy.ext.asyncio import AsyncSession

from backend.models import AgentRun, Campaign
from backend.models.enums import AgentName, RunStatus


@asynccontextmanager
async def agent_run(
    session: AsyncSession, *, campaign: Campaign, agent: AgentName
) -> AsyncIterator[AgentRun]:
    run = AgentRun(
        user_id=campaign.user_id,
        campaign_id=campaign.id,
        agent=agent,
        status=RunStatus.RUNNING,
        started_at=datetime.now(UTC),
    )
    session.add(run)
    await session.flush()  # assign run.id for tool-call/error rows in later milestones

    started = perf_counter()
    try:
        yield run
    except Exception:
        run.status = RunStatus.FAILED
        raise
    else:
        run.status = RunStatus.SUCCEEDED
    finally:
        run.ended_at = datetime.now(UTC)
        run.duration_ms = int((perf_counter() - started) * 1000)
        await session.flush()
