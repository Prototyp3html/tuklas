"""Discovery task (Milestone 3): find businesses, normalize, dedupe, persist.

Deterministic — no LLM. `runner.run_discovery` is the entry point; `normalize`
and `dedupe` are pure functions with no I/O.
"""

from backend.agents.discovery.runner import run_discovery

__all__ = ["run_discovery"]
