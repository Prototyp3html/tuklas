"""FixtureLLM — a deterministic, offline `LLMProvider` for tests and CI.

It reads the prompt the way `FixtureSearch` reads a query: it pulls every
evidence id out of the prompt and returns an `OpportunityAnalysis` that cites
exactly those ids, so the runner's grounding check exercises a real path.
"""

from __future__ import annotations

import re
from uuid import UUID

from pydantic import BaseModel

from backend.providers.llm.base import LLMProvider
from backend.schemas.opportunity import OpportunityAnalysis

_UUID_RE = re.compile(
    r"[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}", re.IGNORECASE
)


class FixtureLLM(LLMProvider):
    async def complete_structured(
        self, prompt: str, schema: type[BaseModel], tier: str = "cheap"
    ) -> BaseModel:
        if schema is not OpportunityAnalysis:
            raise NotImplementedError(
                f"FixtureLLM only knows OpportunityAnalysis, not {schema.__name__}"
            )
        ids = [UUID(m) for m in dict.fromkeys(_UUID_RE.findall(prompt))]
        return OpportunityAnalysis(
            score=70,
            recommended_service="Website revamp",
            sales_angle="Your customers can't find or book you online yet.",
            reasoning=(
                f"Grounded in {len(ids)} collected evidence rows: gaps in the "
                "business's web presence plus reachable contacts make this a workable lead."
            ),
            confidence=0.6,
            evidence_ids=ids,
        )
