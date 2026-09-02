"""Research runner: gather citable facts per business into `business_evidence`.

Deterministic, no LLM. For each business it fetches the homepage, any social
pages linked from it, and a few web-search results, extracts contacts / Facebook
signals, and writes evidence rows — **every row carries a `source_url`**.

Idempotent: a re-run deletes this business's rows whose `claim` is in
`RESEARCH_CLAIMS` and rewrites them, so it never piles up and never touches rows
a later milestone (M6/M7) will add via the `kind`/`weight`/`factor` columns.
"""

from __future__ import annotations

from datetime import UTC, datetime
from urllib.parse import urlsplit

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.agents.audit.website import Fetch
from backend.agents.base import agent_run
from backend.agents.research.extract import ContactFindings, extract_contacts, parse_facebook
from backend.config import settings
from backend.core.webparse import SOCIAL_HOSTS
from backend.models import Business, BusinessEvidence, Campaign
from backend.models.enums import AgentName
from backend.providers.search.base import SearchProvider
from backend.schemas.evidence import ResearchResult

RESEARCH_CLAIMS: frozenset[str] = frozenset(
    {
        "phone",
        "email",
        "facebook_url",
        "facebook_followers",
        "facebook_likes",
        "instagram_url",
        "social_url",
        "website_reachable",
        "website_last_seen",
        "address_confirmed",
    }
)

_FB_HOSTS = ("facebook.com", "fb.com")
_Finding = tuple[str, str, str, float]  # claim, observed_value, source_url, confidence


def _host(url: str) -> str:
    return urlsplit(url).netloc.lower()


def _is_social(url: str) -> bool:
    return any(h in _host(url) for h in SOCIAL_HOSTS)


def _is_facebook(url: str) -> bool:
    return any(h in _host(url) for h in _FB_HOSTS)


def _dedupe(urls: list[str]) -> list[str]:
    seen: list[str] = []
    for u in urls:
        if u and u.startswith("http") and u not in seen:
            seen.append(u)
    return seen


def _contact_findings(c: ContactFindings, src: str) -> list[_Finding]:
    out: list[_Finding] = []
    out += [("phone", p, src, 0.7) for p in c.phones]
    out += [("email", e, src, 0.85) for e in c.emails]
    for s in c.social_links:
        claim = (
            "facebook_url"
            if _is_facebook(s)
            else "instagram_url"
            if "instagram" in _host(s)
            else "social_url"
        )
        out.append((claim, s, src, 0.7))
    if c.address:
        out.append(("address_confirmed", c.address, src, 0.5))
    if c.last_seen_year:
        out.append(("website_last_seen", c.last_seen_year, src, 0.4))
    return out


async def _research_one(
    biz: Business, campaign: Campaign, *, fetch: Fetch, search: SearchProvider
) -> tuple[list[_Finding], int]:
    budget = settings.research_max_pages_per_business
    primary: list[str] = []
    home = f"https://{biz.domain}/" if biz.domain else None
    if home:
        primary.append(home)
    query = f'"{biz.name}" {campaign.location} contact'
    for r in await search.search(query, limit=budget):
        primary.append(r.url)
    primary = _dedupe(primary)[: budget + 1]

    findings: list[_Finding] = []
    social_urls: list[str] = []
    pages = 0
    homepage_reachable: bool | None = None
    home_keys = (
        {f"https://{biz.domain}", f"http://{biz.domain}"} if biz.domain else set()
    )

    for url in primary:
        res = await fetch(url)
        pages += 1
        is_home = url.rstrip("/") in home_keys
        if res.body is None or res.status_code is None:
            if is_home:
                homepage_reachable = False
            continue
        if is_home:
            homepage_reachable = res.ok
        src = res.final_url or url
        found = extract_contacts(res.body, source_url=src)
        findings += _contact_findings(found, src)
        social_urls += found.social_links

    for url in _dedupe(social_urls)[:4]:
        res = await fetch(url)
        pages += 1
        if res.body is None or res.status_code is None:
            continue
        src = res.final_url or url
        findings += _contact_findings(extract_contacts(res.body, source_url=src), src)
        if _is_facebook(src):
            fb = parse_facebook(res.body)
            if fb.followers is not None:
                findings.append(("facebook_followers", str(fb.followers), src, 0.6))
            if fb.likes is not None:
                findings.append(("facebook_likes", str(fb.likes), src, 0.55))

    if homepage_reachable is not None:
        findings.append(
            ("website_reachable", str(homepage_reachable).lower(), home or "", 0.9)
        )
    return findings, pages


async def run_research(
    session: AsyncSession,
    campaign: Campaign,
    *,
    fetch: Fetch,
    search: SearchProvider,
) -> ResearchResult:
    evidence_written = pages_fetched = 0

    async with agent_run(session, campaign=campaign, agent=AgentName.RESEARCH) as run:
        businesses = list((await session.execute(select(Business))).scalars().all())
        for biz in businesses:
            findings, pages = await _research_one(
                biz, campaign, fetch=fetch, search=search
            )
            pages_fetched += pages

            # keep the highest-confidence row per (claim, value)
            best: dict[tuple[str, str], _Finding] = {}
            for claim, value, src, conf in findings:
                if not src:
                    continue
                key = (claim, value)
                if key not in best or conf > best[key][3]:
                    best[key] = (claim, value, src, conf)

            await session.execute(
                delete(BusinessEvidence).where(
                    BusinessEvidence.business_id == biz.id,
                    BusinessEvidence.claim.in_(RESEARCH_CLAIMS),
                )
            )
            now = datetime.now(UTC)
            for claim, value, src, conf in best.values():
                session.add(
                    BusinessEvidence(
                        user_id=campaign.user_id,
                        business_id=biz.id,
                        claim=claim,
                        observed_value=value[:2000],
                        source_url=src[:2000],
                        confidence=conf,
                        collected_at=now,
                    )
                )
            evidence_written += len(best)

        await session.flush()
        run.business_count = len(businesses)
        researched = len(businesses)

    return ResearchResult(
        run_id=run.id,
        campaign_id=campaign.id,
        status=run.status,
        businesses_researched=researched,
        evidence_written=evidence_written,
        pages_fetched=pages_fetched,
        duration_ms=run.duration_ms or 0,
    )
