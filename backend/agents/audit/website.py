"""Deterministic website analyzer — the M4 component of the audit task.

`check_website(domain, fetch=...)` fetches the homepage (HTTPS, then HTTP) and
derives a `WebsiteReport`. No LLM. `fetch` is a required injected callable so a
test can never accidentally hit the network; `http_fetcher()` yields the real
one bound to a shared `httpx` client.
"""

from __future__ import annotations

import re
from collections.abc import AsyncIterator, Awaitable, Callable
from contextlib import asynccontextmanager

import httpx
from bs4 import BeautifulSoup

from backend.config import settings
from backend.core.http import FetchResult, RobotsGate, fetch_page
from backend.core.webparse import (
    PHONE_RE,
    find_social_links,
    has_viewport,
    hrefs_of,
    visible_text,
)
from backend.models.enums import WebsiteStatus
from backend.schemas.audit import WebsiteReport

Fetch = Callable[[str], Awaitable[FetchResult]]

_BOOKING_RE = re.compile(
    r"book|appointment|reserve|schedul|calendly|setmore|booksy", re.I
)
_ORDERING_RE = re.compile(
    r"order|delivery|menu|foodpanda|grabfood|ubereats", re.I
)
_JS_TEXT_FLOOR = 500  # guide's Playwright-escalation trigger (flagged, not performed)
_EMPTY_TEXT_FLOOR = 200


def _needs_http_fallback(r: FetchResult) -> bool:
    return bool(r.error) or (r.status_code is not None and r.status_code >= 500)


async def check_website(domain: str, *, fetch: Fetch) -> WebsiteReport:
    result = await fetch(f"https://{domain}/")
    if _needs_http_fallback(result):
        http_result = await fetch(f"http://{domain}/")
        # keep the http attempt if it did better, or if https only errored
        if http_result.status_code is not None or result.status_code is None:
            result = http_result

    # No HTTP response at all (DNS/connection failure on both schemes) => no site.
    if result.status_code is None:
        return WebsiteReport(
            reachable=False,
            final_url=result.final_url,
            website_status=WebsiteStatus.NONE,
            error=result.error,
        )

    soup = BeautifulSoup(result.body or "", "html.parser")
    text = visible_text(soup)
    text_len = len(text)

    hrefs = hrefs_of(soup)
    anchor_text = " ".join(a.get_text(" ", strip=True) for a in soup.find_all("a"))
    haystack = f"{' '.join(hrefs)} {anchor_text}"

    title_tag = soup.title
    has_contact = any(
        h.lower().startswith(("tel:", "mailto:")) for h in hrefs
    ) or bool(PHONE_RE.search(text))

    report = WebsiteReport(
        reachable=True,
        final_url=result.final_url,
        status_code=result.status_code,
        is_https=result.is_https,
        title=title_tag.get_text(strip=True) if title_tag else None,
        has_viewport=has_viewport(soup),
        has_booking=bool(_BOOKING_RE.search(haystack)),
        has_ordering=bool(_ORDERING_RE.search(haystack)),
        social_links=find_social_links(hrefs),
        has_contact=has_contact,
        js_rendered_suspected=text_len < _JS_TEXT_FLOOR,
    )
    report.website_status = _classify(report, text_len=text_len, link_count=len(hrefs))
    return report


def _classify(r: WebsiteReport, *, text_len: int, link_count: int) -> WebsiteStatus:
    if r.status_code is not None and r.status_code >= 400:
        return WebsiteStatus.BROKEN
    if r.js_rendered_suspected and text_len < _EMPTY_TEXT_FLOOR:
        return WebsiteStatus.BROKEN
    if not r.has_viewport and not r.is_https:
        return WebsiteStatus.OUTDATED
    if r.is_https and r.has_viewport and (
        r.has_booking or r.has_ordering or link_count >= 15
    ):
        return WebsiteStatus.GOOD
    return WebsiteStatus.BASIC


@asynccontextmanager
async def http_fetcher() -> AsyncIterator[Fetch]:
    """The real fetcher: one shared httpx client + robots cache for a run."""
    async with httpx.AsyncClient(
        timeout=settings.crawler_timeout_seconds,
        headers={"User-Agent": settings.crawler_user_agent},
        follow_redirects=True,
    ) as client:
        gate = RobotsGate(client)

        async def _fetch(url: str) -> FetchResult:
            return await fetch_page(url, client, robots=gate)

        yield _fetch
