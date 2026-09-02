"""Research endpoints. M5: gather cited evidence for a campaign's businesses.

Isolation is Postgres RLS — a missing/foreign campaign reads back as `None` -> 404.
"""

from __future__ import annotations

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status

from backend.agents.research import run_research
from backend.api.audit import Fetcher
from backend.api.deps import CurrentUser, DbSession
from backend.models import Campaign
from backend.providers.search import SearchProvider, get_search_provider
from backend.schemas.evidence import ResearchResult

router = APIRouter(tags=["research"])


def get_search() -> SearchProvider:
    """Fixture by default; live DuckDuckGo when RESEARCH_SEARCH=ddg. Tests override."""
    return get_search_provider()


Searcher = Annotated[SearchProvider, Depends(get_search)]


@router.post(
    "/campaigns/{campaign_id}/research", response_model=ResearchResult
)
async def research(
    campaign_id: UUID,
    user: CurrentUser,
    db: DbSession,
    fetch: Fetcher,
    search: Searcher,
) -> ResearchResult:
    campaign = await db.get(Campaign, campaign_id)
    if campaign is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Not found")
    result = await run_research(db, campaign, fetch=fetch, search=search)
    await db.commit()
    return result
