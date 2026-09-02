"""The one safe way to fetch a remote page.

Every outbound GET goes through `fetch_page`: `is_safe_url` first (SSRF guard),
then optional robots.txt, then a capped streaming read (5 s timeout, 2 MB body,
identified User-Agent). It never raises — failures come back as
`FetchResult(ok=False, error=...)`.
"""

from __future__ import annotations

import time
import urllib.robotparser
from urllib.parse import urlsplit

import httpx
from pydantic import BaseModel

from backend.config import settings
from backend.core.ssrf import is_safe_url


class FetchResult(BaseModel):
    requested_url: str
    final_url: str | None = None
    status_code: int | None = None
    ok: bool = False
    redirects: list[str] = []
    is_https: bool = False
    body: str | None = None
    elapsed_ms: int = 0
    truncated: bool = False
    error: str | None = None


class RobotsGate:
    """Per-host robots.txt cache. Fail-open: a site that won't serve robots, or
    `CRAWLER_RESPECT_ROBOTS=false`, is treated as allowed (we only ever fetch a
    business's own public homepage)."""

    def __init__(self, client: httpx.AsyncClient) -> None:
        self._client = client
        self._cache: dict[str, urllib.robotparser.RobotFileParser | None] = {}

    async def allowed(self, url: str) -> bool:
        if not settings.crawler_respect_robots:
            return True
        parts = urlsplit(url)
        host = parts.netloc
        if host not in self._cache:
            self._cache[host] = await self._load(f"{parts.scheme}://{host}/robots.txt")
        parser = self._cache[host]
        if parser is None:
            return True
        return parser.can_fetch(settings.crawler_user_agent, url)

    async def _load(self, robots_url: str) -> urllib.robotparser.RobotFileParser | None:
        try:
            resp = await self._client.get(robots_url, timeout=2.0)
        except httpx.HTTPError:
            return None
        if resp.status_code >= 400:
            return None
        parser = urllib.robotparser.RobotFileParser()
        parser.parse(resp.text.splitlines())
        return parser


async def fetch_page(
    url: str,
    client: httpx.AsyncClient,
    *,
    robots: RobotsGate | None = None,
) -> FetchResult:
    result = FetchResult(requested_url=url)

    if not is_safe_url(url):
        result.error = "unsafe or unresolvable url"
        return result
    if robots is not None and not await robots.allowed(url):
        result.error = "blocked by robots.txt"
        return result

    started = time.perf_counter()
    try:
        async with client.stream("GET", url, follow_redirects=True) as resp:
            chunks: list[bytes] = []
            size = 0
            async for chunk in resp.aiter_bytes():
                chunks.append(chunk)
                size += len(chunk)
                if size >= settings.crawler_max_bytes:
                    result.truncated = True
                    break
            raw = b"".join(chunks)[: settings.crawler_max_bytes]
            result.status_code = resp.status_code
            result.final_url = str(resp.url)
            result.is_https = str(resp.url).lower().startswith("https://")
            result.redirects = [str(r.url) for r in resp.history]
            result.body = raw.decode(resp.encoding or "utf-8", errors="replace")
            result.ok = 200 <= resp.status_code < 400
    except httpx.HTTPError as exc:
        result.error = type(exc).__name__
    finally:
        result.elapsed_ms = int((time.perf_counter() - started) * 1000)

    return result
