"""Opportunity-scoring endpoint (Milestone 7).

`POST /campaigns/{id}/score` runs Layer 1 (weighted score) for every business and
Layer 2 (LLM reasoning) for those above the threshold. Isolation is Postgres RLS —
a missing/foreign campaign reads back as `None` -> 404.
"""

from __future__ import annotations

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status

from backend.agents.opportunity import run_opportunity
from backend.api.deps import CurrentUser, DbSession
from backend.models import Campaign
from backend.providers.llm import LLMProvider, get_llm_provider
from backend.schemas.opportunity import OpportunityResult

router = APIRouter(tags=["opportunity"])


def get_llm() -> LLMProvider:
    """Fixture by default; real local model when LLM_PROVIDER=ollama. Tests override."""
    return get_llm_provider()


Llm = Annotated[LLMProvider, Depends(get_llm)]


@router.post("/campaigns/{campaign_id}/score", response_model=OpportunityResult)
async def score(
    campaign_id: UUID, user: CurrentUser, db: DbSession, llm: Llm
) -> OpportunityResult:
    campaign = await db.get(Campaign, campaign_id)
    if campaign is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Not found")
    result = await run_opportunity(db, campaign, llm=llm)
    await db.commit()
    return result
