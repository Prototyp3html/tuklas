"""Schemas for the audit task.

`WebsiteReport` is the internal output of `check_website`. `WebsiteAuditResult`
is the API response for `POST /campaigns/{id}/audit-websites`; `AuditResult` for
`POST /campaigns/{id}/audit` (M6). `DigitalAuditRead` is the full verdict read
back via `GET /leads/{id}/audit` — it mirrors `frontend/lib/types.ts` `DigitalAudit`.
"""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel

from backend.models.enums import RunStatus, SocialPresence, WebsiteStatus
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


class AuditResult(CamelModel):
    """Response for `POST /campaigns/{id}/audit` — the M6 composition run."""

    run_id: UUID
    campaign_id: UUID
    status: RunStatus
    audited: int  # digital_audits rows finalized
    gaps_flagged: int  # of those, how many have >= 1 digital gap
    evidence_classified: int  # business_evidence rows given a kind
    duration_ms: int


class DigitalAuditRead(CamelModel):
    """The full per-business verdict. Mirrors `types.ts` `DigitalAudit`."""

    business_id: UUID
    has_website: bool
    website_status: WebsiteStatus
    has_booking: bool
    has_ordering: bool
    mobile_friendly: bool | None
    social_presence: SocialPresence
    digital_gaps: list[str]
    confidence: float
    audited_at: datetime
