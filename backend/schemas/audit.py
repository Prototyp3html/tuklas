"""Schemas for the audit task.

`WebsiteReport` is the internal output of `check_website`. `WebsiteAuditResult`
is the API response for `POST /campaigns/{id}/audit-websites`.
"""

from __future__ import annotations

from uuid import UUID

from pydantic import BaseModel

from backend.models.enums import RunStatus, WebsiteStatus
from backend.schemas.base import CamelModel


class WebsiteReport(BaseModel):
    """What a single homepage check found. Feeds the website-derived fields of
    `digital_audits`; M6 composes it with research into the full verdict."""

    reachable: bool = False
    final_url: str | None = None
    status_code: int | None = None
    is_https: bool = False
    website_status: WebsiteStatus = WebsiteStatus.NONE
    title: str | None = None
    has_viewport: bool = False
    has_booking: bool = False
    has_ordering: bool = False
    social_links: list[str] = []
    has_contact: bool = False
    js_rendered_suspected: bool = False
    error: str | None = None


class WebsiteAuditResult(CamelModel):
    run_id: UUID
    campaign_id: UUID
    status: RunStatus
    audited: int  # digital_audits rows written this run
    with_domain: int  # businesses that had a domain to check
    reachable: int  # of those, how many responded
    no_website: int  # businesses with no domain / unreachable
    duration_ms: int
