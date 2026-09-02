"""The deterministic pipeline stages ("tasks") and the two LLM stages ("agents").

Milestone 3 adds `discovery/` (a task: no LLM). `agents/base.py` holds the shared
run-logging wrapper every stage opens an `agent_runs` row through.
"""
