"""Audit task: turn website + research signals into a structured verdict.

`check_website` / `run_website_audit` (M4) do the deterministic website analysis
and write the site-derived fields of `digital_audits`. `run_audit` (M6) composes
those with M5's `business_evidence` into the full verdict (`social_presence`,
`digital_gaps`, `confidence`) and classifies each evidence row's `kind`.
"""

from backend.agents.audit.runner import run_audit, run_website_audit
from backend.agents.audit.website import check_website, http_fetcher

__all__ = ["check_website", "http_fetcher", "run_audit", "run_website_audit"]
