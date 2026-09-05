"""Audit-task runners.

`run_website_audit` (M4) checks every business's site and upserts the
website-derived fields of `digital_audits` (`has_website`, `website_status`,
`has_booking`, `has_ordering`, `mobile_friendly`), leaving `social_presence`,
`digital_gaps`, `confidence` at their defaults.

`run_audit` (M6) is the finalizer: it reads those fields plus the business's
`business_evidence` rows (M5) and composes the rest of the verdict —
`social_presence`, `digital_gaps`, `confidence` — and stamps a `kind` on every
evidence row. Both stages log an `agent_runs` row with `agent='audit'` (two
phases of one task). Both are idempotent: they overwrite in place.
"""

from __future__ import annotations

from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.agents.audit.verdict import (
    AuditInputs,
    classify_evidence_kind,
    classify_social_presence,
    derive_digital_gaps,
    score_confidence,
)
from backend.agents.audit.website import Fetch, check_website
from backend.agents.base import agent_run
from backend.models import Business, BusinessEvidence, Campaign, DigitalAudit
from backend.models.enums import AgentName, WebsiteStatus
from backend.schemas.audit import AuditResult, WebsiteAuditResult


async def _upsert_audit(
    session: AsyncSession,
    *,
    user_id,
    business_id,
    has_website: bool,
    website_status: WebsiteStatus,
    has_booking: bool = False,
    has_ordering: bool = False,
    mobile_friendly: bool | None = None,
) -> None:
    row = await session.get(DigitalAudit, business_id)
    if row is None:
        row = DigitalAudit(business_id=business_id, user_id=user_id)
        session.add(row)
    row.has_website = has_website
    row.website_status = website_status
    row.has_booking = has_booking
    row.has_ordering = has_ordering
    row.mobile_friendly = mobile_friendly
    row.audited_at = datetime.now(UTC)


async def run_website_audit(
    session: AsyncSession, campaign: Campaign, *, fetch: Fetch
) -> WebsiteAuditResult:
    with_domain = reachable = no_website = 0

    async with agent_run(session, campaign=campaign, agent=AgentName.AUDIT) as run:
        businesses = list((await session.execute(select(Business))).scalars().all())
        for biz in businesses:
            if not biz.domain:
                no_website += 1
                await _upsert_audit(
                    session,
                    user_id=campaign.user_id,
                    business_id=biz.id,
                    has_website=False,
                    website_status=WebsiteStatus.NONE,
                )
                continue

            with_domain += 1
            report = await check_website(biz.domain, fetch=fetch)
            if report.reachable:
                reachable += 1
            else:
                no_website += 1
            await _upsert_audit(
                session,
                user_id=campaign.user_id,
                business_id=biz.id,
                has_website=report.reachable,
                website_status=report.website_status,
                has_booking=report.has_booking,
                has_ordering=report.has_ordering,
                mobile_friendly=report.has_viewport if report.reachable else None,
            )

        await session.flush()
        run.business_count = len(businesses)
        audited = len(businesses)

    return WebsiteAuditResult(
        run_id=run.id,
        campaign_id=campaign.id,
        status=run.status,
        audited=audited,
        with_domain=with_domain,
        reachable=reachable,
        no_website=no_website,
        duration_ms=run.duration_ms or 0,
    )


async def run_audit(session: AsyncSession, campaign: Campaign) -> AuditResult:
    """M6: compose the M4 website fields + M5 evidence into the full verdict.

    Pure DB composition — no fetch, no search. For each business: derive
    `social_presence` / `digital_gaps` / `confidence` onto its `digital_audits`
    row and set `kind` on each of its `business_evidence` rows. Every value is a
    function of current DB state, so a re-run is a no-op.
    """
    gaps_flagged = evidence_classified = 0

    async with agent_run(session, campaign=campaign, agent=AgentName.AUDIT) as run:
        businesses = list((await session.execute(select(Business))).scalars().all())

        ev_by_biz: dict = {}
        for row in (await session.execute(select(BusinessEvidence))).scalars().all():
            ev_by_biz.setdefault(row.business_id, []).append(row)

        for biz in businesses:
            audit_row = await session.get(DigitalAudit, biz.id)
            if audit_row is None:  # M4 hasn't run for this business — thin fallback
                audit_row = DigitalAudit(
                    business_id=biz.id,
                    user_id=campaign.user_id,
                    has_website=bool(biz.domain),
                    website_status=WebsiteStatus.NONE,
                )
                session.add(audit_row)

            rows = ev_by_biz.get(biz.id, [])
            inputs = AuditInputs(
                has_website=audit_row.has_website,
                website_status=audit_row.website_status,
                has_booking=audit_row.has_booking,
                has_ordering=audit_row.has_ordering,
                mobile_friendly=audit_row.mobile_friendly,
                evidence=rows,
            )
            audit_row.social_presence = classify_social_presence(rows)
            audit_row.digital_gaps = derive_digital_gaps(inputs)
            audit_row.confidence = score_confidence(inputs)
            audit_row.audited_at = datetime.now(UTC)

            for row in rows:
                row.kind = classify_evidence_kind(row.claim, row.observed_value)
            evidence_classified += len(rows)
            if audit_row.digital_gaps:
                gaps_flagged += 1

        await session.flush()
        run.business_count = len(businesses)

    return AuditResult(
        run_id=run.id,
        campaign_id=campaign.id,
        status=run.status,
        audited=len(businesses),
        gaps_flagged=gaps_flagged,
        evidence_classified=evidence_classified,
        duration_ms=run.duration_ms or 0,
    )
