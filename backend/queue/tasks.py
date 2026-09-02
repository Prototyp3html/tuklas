"""Celery task definitions wrapping the pipeline stages.

The request path does NOT go through here — `backend/api/campaigns.py` awaits
`run_discovery` directly (see the plan: `asyncio.run` inside a running event loop
would raise). `discovery_task` exists for the eventual real worker and is
exercised in eager mode from synchronous test code.
"""

from __future__ import annotations

import asyncio
from uuid import UUID

from backend.agents.discovery import run_discovery
from backend.db.session import SessionLocal, set_rls_user
from backend.models import Campaign
from backend.queue.celery_app import celery_app


async def _run_discovery(user_id: str, campaign_id: str) -> dict:
    async with SessionLocal() as session:
        await set_rls_user(session, UUID(user_id))
        campaign = await session.get(Campaign, UUID(campaign_id))
        if campaign is None:  # RLS hides other users' campaigns -> also None
            raise ValueError(f"campaign {campaign_id} not visible to user {user_id}")
        result = await run_discovery(session, campaign)
        await session.commit()
        return result.model_dump(mode="json")


@celery_app.task(name="discovery.run")
def discovery_task(user_id: str, campaign_id: str) -> dict:
    """Sync Celery entry point. Safe to call from a non-async context only."""
    return asyncio.run(_run_discovery(user_id, campaign_id))
