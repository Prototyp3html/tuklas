"""Discovery entry point: source -> normalize -> dedupe -> persist -> run row.

Deterministic, no LLM. Writes on the caller's session; the caller (the request,
or the Celery task) owns the commit. Idempotent: a second call for the same
campaign inserts nothing because every candidate matches an existing `businesses`
row.
"""

from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.agents.base import agent_run
from backend.agents.discovery.dedupe import dedupe_batch, find_duplicate
from backend.agents.discovery.normalize import normalize
from backend.config import settings
from backend.models import Business, BusinessSource, Campaign, CampaignLead
from backend.models.enums import AgentName
from backend.providers.business_data import BusinessDataSource, get_business_source
from backend.schemas.business import NormalizedBusiness
from backend.schemas.campaign import DiscoveryResult


async def ensure_campaign_leads(session: AsyncSession, campaign: Campaign) -> None:
    """Link every business in the user's pool to this campaign as a `campaign_leads`
    row (`status='new'`). Existing rows — and any status a user has since set — are
    left alone. This is what gives `GET /leads` a status and a campaign to show."""
    business_ids = set(
        (await session.execute(select(Business.id))).scalars().all()
    )
    linked = set(
        (
            await session.execute(
                select(CampaignLead.business_id).where(
                    CampaignLead.campaign_id == campaign.id
                )
            )
        ).scalars().all()
    )
    for business_id in business_ids - linked:
        session.add(
            CampaignLead(
                user_id=campaign.user_id,
                campaign_id=campaign.id,
                business_id=business_id,
            )
        )
    await session.flush()


async def run_discovery(
    session: AsyncSession,
    campaign: Campaign,
    *,
    source: BusinessDataSource | None = None,
) -> DiscoveryResult:
    source = source or get_business_source()
    category = campaign.industries[0] if campaign.industries else campaign.service

    async with agent_run(session, campaign=campaign, agent=AgentName.DISCOVERY) as run:
        raw = await source.search(
            category=category,
            location=campaign.location,
            limit=settings.discovery_default_limit,
        )
        candidates = dedupe_batch(
            [normalize(r, source_name=source.source_name()) for r in raw]
        )

        # RLS already scopes this SELECT to campaign.user_id.
        existing = list((await session.execute(select(Business))).scalars().all())
        seen: list = list(existing)

        new_pairs: list[tuple[Business, NormalizedBusiness]] = []
        duplicates = 0
        for cand in candidates:
            if find_duplicate(cand, seen) is not None:
                duplicates += 1
                continue
            biz = Business(
                user_id=campaign.user_id,
                name=cand.name,
                normalized_name=cand.normalized_name,
                domain=cand.domain,
                address=cand.address,
                phone=cand.phone,
                category=cand.category,
                lat=cand.lat,
                lng=cand.lng,
            )
            session.add(biz)
            new_pairs.append((biz, cand))
            seen.append(cand)  # later candidates dedupe against this run's inserts too

        await session.flush()  # assign biz.id

        for biz, cand in new_pairs:
            session.add(
                BusinessSource(
                    user_id=campaign.user_id,
                    business_id=biz.id,
                    source_name=cand.source_name,
                    source_id=cand.source_id,
                )
            )

        run.business_count = len(new_pairs)
        discovered, inserted = len(raw), len(new_pairs)

    await ensure_campaign_leads(session, campaign)

    return DiscoveryResult(
        run_id=run.id,
        campaign_id=campaign.id,
        status=run.status,
        discovered=discovered,
        inserted=inserted,
        duplicates=duplicates,
        duration_ms=run.duration_ms or 0,
    )
