"""Research task (Milestone 5): gather cited evidence into `business_evidence`.

Deterministic — no LLM. `run_research` is the entry point; `RESEARCH_CLAIMS` is
the claim namespace it owns (so re-runs replace cleanly).
"""

from backend.agents.research.runner import RESEARCH_CLAIMS, run_research

__all__ = ["RESEARCH_CLAIMS", "run_research"]
