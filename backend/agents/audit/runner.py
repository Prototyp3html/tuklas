"""Website-audit runner: check every business's site, upsert `digital_audits`.

M4 writes only the website-derived fields (`has_website`, `website_status`,
`has_booking`, `has_ordering`, `mobile_friendly`). `social_presence`,
`digital_gaps`, and `confidence` stay at their defaults — M5 research and M6
audit own those. Idempotent: re-running refreshes each row in place.
"""

from __future__ import annotations

from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.agents.audit.website import Fetch, check_website
from backend.agents.base import agent_run
from backend.models import Business, Campaign, DigitalAudit
from backend.models.enums import AgentName, WebsiteStatus
from backend.schemas.audit import WebsiteAuditResult


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
