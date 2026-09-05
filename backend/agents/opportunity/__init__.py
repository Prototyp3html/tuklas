"""Opportunity agent (Milestone 7): weighted score, then LLM reasoning above a
threshold. The first pipeline stage that calls an `LLMProvider`.
"""

from backend.agents.opportunity.runner import run_opportunity
from backend.agents.opportunity.score import score_lead, tier_for
from backend.agents.opportunity.weights import DEFAULT_WEIGHTS, LLM_THRESHOLD, MODEL_VERSION

__all__ = [
    "DEFAULT_WEIGHTS",
    "LLM_THRESHOLD",
    "MODEL_VERSION",
    "run_opportunity",
    "score_lead",
    "tier_for",
]
