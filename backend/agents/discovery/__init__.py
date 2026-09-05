"""Discovery task (Milestone 3): find businesses, normalize, dedupe, persist.

Deterministic — no LLM. `runner.run_discovery` is the entry point; `normalize`
and `dedupe` are pure functions with no I/O. `ensure_campaign_leads` links the
user's business pool to a campaign (Milestone 8).
"""

from backend.agents.discovery.runner import ensure_campaign_leads, run_discovery

__all__ = ["ensure_campaign_leads", "run_discovery"]
