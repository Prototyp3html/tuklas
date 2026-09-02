"""Audit endpoints. M4: run the deterministic website analyzer over a campaign.

Isolation is Postgres RLS, not Python — a missing/foreign campaign reads back as
`None` -> 404.
"""

from __future__ import annotations

from collections.abc import AsyncIterator
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status

from backend.agents.audit import http_fetcher, run_website_audit
from backend.agents.audit.website import Fetch
from backend.api.deps import CurrentUser, DbSession
from backend.models import Campaign
from backend.schemas.audit import WebsiteAuditResult

router = APIRouter(tags=["audit"])


async def get_fetcher() -> AsyncIterator[Fetch]:
    """Real HTTP fetcher. Tests override this via `app.dependency_overrides`."""
    async with http_fetcher() as fetch:
        yield fetch


Fetcher = Annotated[Fetch, Depends(get_fetcher)]


@router.post(
    "/campaigns/{campaign_id}/audit-websites", response_model=WebsiteAuditResult
)
async def audit_websites(
    campaign_id: UUID, user: CurrentUser, db: DbSession, fetch: Fetcher
) -> WebsiteAuditResult:
    # Businesses aren't linked to a specific campaign until `campaign_leads`
    # (later milestone); for now this audits the user's whole business pool.
    campaign = await db.get(Campaign, campaign_id)
    if campaign is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Not found")
    result = await run_website_audit(db, campaign, fetch=fetch)
    await db.commit()
    return result
