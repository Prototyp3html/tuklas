"""DuckDuckGoSearch: the real, opt-in search provider (RESEARCH_SEARCH=ddg).

Scrapes DuckDuckGo's HTML endpoint — no API key, more scrape-tolerant than
Google/Bing. Never used by tests or CI. Google/Bing SERP scraping is deliberately
not built (same call as the Maps scraper).
"""

from __future__ import annotations

import asyncio
from urllib.parse import parse_qs, urlsplit

import httpx
from bs4 import BeautifulSoup

from backend.config import settings
from backend.providers.search.base import SearchProvider, SearchResult

_USER_AGENT = "tuklas-research/0.1 (+https://github.com/Prototyp3html/tuklas)"
_MAX_ATTEMPTS = 2


def _clean_url(href: str) -> str:
    # DDG wraps results as /l/?uddg=<encoded target>
    parts = urlsplit(href)
    if parts.path.startswith("/l/"):
        target = parse_qs(parts.query).get("uddg", [])
        if target:
            return target[0]
    return href


class DuckDuckGoSearch(SearchProvider):
    def __init__(self, *, client: httpx.AsyncClient | None = None) -> None:
        self._client = client

    async def search(self, query: str, limit: int = 5) -> list[SearchResult]:
        client = self._client
        owned = client is None
        if client is None:
            client = httpx.AsyncClient(
                timeout=15.0,
                headers={"User-Agent": _USER_AGENT},
                follow_redirects=True,
            )
        try:
            html = await self._fetch(client, query)
        except httpx.HTTPError:
            return []
        finally:
            if owned:
                await client.aclose()

        soup = BeautifulSoup(html, "html.parser")
        out: list[SearchResult] = []
        for a in soup.select("a.result__a"):
            href = _clean_url(a.get("href", ""))
            if not href.startswith("http"):
                continue
            out.append(SearchResult(title=a.get_text(" ", strip=True), url=href))
            if len(out) >= limit:
                break
        return out

    async def _fetch(self, client: httpx.AsyncClient, query: str) -> str:
        for attempt in range(_MAX_ATTEMPTS):
            resp = await client.post(
                settings.research_ddg_url, data={"q": query, "kl": "ph-en"}
            )
            if resp.status_code == 429 and attempt < _MAX_ATTEMPTS - 1:
                await asyncio.sleep(2)
                continue
            resp.raise_for_status()
            return resp.text
        return ""  # pragma: no cover
