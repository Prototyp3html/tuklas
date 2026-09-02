"""Milestone 4 — Website analyzer.

Unit: the `fetch_page` safety primitive (via httpx MockTransport, no real net)
and the `check_website` heuristic (via an injected fake fetch). Integration:
`POST /campaigns/{id}/audit-websites` against real Postgres with RLS, the HTTP
fetcher overridden.
"""

from __future__ import annotations

import httpx
import pytest
from sqlalchemy import text

from backend.agents.audit.website import check_website
from backend.api.audit import get_fetcher
from backend.core.http import FetchResult, fetch_page
from backend.main import app
from backend.models.enums import WebsiteStatus

# --------------------------------------------------------------------------- #
# Unit — fetch_page                                                            #
# --------------------------------------------------------------------------- #


async def test_fetch_page_blocks_ssrf_without_a_request() -> None:
    hit = False

    def handler(_req: httpx.Request) -> httpx.Response:
        nonlocal hit
        hit = True
        return httpx.Response(200)

    async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as c:
        r = await fetch_page("http://127.0.0.1/", c)

    assert r.ok is False
    assert "unsafe" in (r.error or "")
    assert hit is False


async def test_fetch_page_truncates_oversized_body() -> None:
    big = b"x" * (3 * 1024 * 1024)

    async with httpx.AsyncClient(
        transport=httpx.MockTransport(lambda _r: httpx.Response(200, content=big))
    ) as c:
        r = await fetch_page("https://example.com/", c)

    assert r.ok is True
    assert r.truncated is True
    assert r.body is not None and len(r.body) <= 2_000_000


async def test_fetch_page_records_redirect_chain() -> None:
    def handler(req: httpx.Request) -> httpx.Response:
        if req.url.path == "/":
            return httpx.Response(301, headers={"location": "https://example.com/final"})
        return httpx.Response(200, content=b"<html>ok</html>")

    async with httpx.AsyncClient(
        transport=httpx.MockTransport(handler), follow_redirects=True
    ) as c:
        r = await fetch_page("https://example.com/", c)

    assert r.status_code == 200
    assert r.final_url == "https://example.com/final"
    assert r.redirects == ["https://example.com/"]


async def test_fetch_page_captures_network_error() -> None:
    def handler(_req: httpx.Request) -> httpx.Response:
        raise httpx.ConnectError("boom")

    async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as c:
        r = await fetch_page("https://example.com/", c)

    assert r.ok is False
    assert r.error == "ConnectError"


# --------------------------------------------------------------------------- #
# Unit — check_website                                                         #
# --------------------------------------------------------------------------- #

_VIEWPORT = '<meta name="viewport" content="width=device-width, initial-scale=1">'
_FILLER = "<p>" + ("lorem ipsum dolor sit amet " * 60) + "</p>"

_GOOD = (
    f"<html><head><title>Bella Rosa</title>{_VIEWPORT}</head><body>"
    f'<a href="https://calendly.com/bella">Book an appointment</a>{_FILLER}'
    "</body></html>"
)
_BASIC = (
    f"<html><head><title>Plain</title>{_VIEWPORT}</head><body>"
    f'{_FILLER}<a href="/about">About</a><a href="/contact">Contact</a>'
    "</body></html>"
)
_OUTDATED = f"<html><head><title>Old</title></head><body>{_FILLER}</body></html>"
_JS_SHELL = "<html><head><title>App</title></head><body><div id='root'></div></body></html>"


def _fetch_map(mapping: dict[str, FetchResult]):
    async def _fetch(url: str) -> FetchResult:
        return mapping.get(
            url, FetchResult(requested_url=url, error="ConnectError")
        )

    return _fetch


def _ok(url: str, body: str, *, https: bool = True, status: int = 200) -> FetchResult:
    return FetchResult(
        requested_url=url,
        final_url=url,
        status_code=status,
        ok=200 <= status < 400,
        is_https=https,
        body=body,
    )


async def test_check_website_good() -> None:
    r = await check_website(
        "bella.com", fetch=_fetch_map({"https://bella.com/": _ok("https://bella.com/", _GOOD)})
    )
    assert r.reachable is True
    assert r.website_status is WebsiteStatus.GOOD
    assert r.has_booking is True
    assert r.has_viewport is True


async def test_check_website_basic() -> None:
    r = await check_website(
        "plain.com", fetch=_fetch_map({"https://plain.com/": _ok("https://plain.com/", _BASIC)})
    )
    assert r.website_status is WebsiteStatus.BASIC
    assert r.has_booking is False


async def test_check_website_outdated_falls_back_to_http() -> None:
    r = await check_website(
        "old.com",
        fetch=_fetch_map(
            {
                "https://old.com/": FetchResult(
                    requested_url="https://old.com/", error="ConnectError"
                ),
                "http://old.com/": _ok("http://old.com/", _OUTDATED, https=False),
            }
        ),
    )
    assert r.is_https is False
    assert r.website_status is WebsiteStatus.OUTDATED


async def test_check_website_broken_on_4xx() -> None:
    r = await check_website(
        "gone.com",
        fetch=_fetch_map(
            {"https://gone.com/": _ok("https://gone.com/", "<html>nope</html>", status=404)}
        ),
    )
    assert r.reachable is True
    assert r.website_status is WebsiteStatus.BROKEN


async def test_check_website_unreachable() -> None:
    r = await check_website("void.com", fetch=_fetch_map({}))
    assert r.reachable is False
    assert r.website_status is WebsiteStatus.NONE


async def test_check_website_flags_js_shell() -> None:
    r = await check_website(
        "spa.com", fetch=_fetch_map({"https://spa.com/": _ok("https://spa.com/", _JS_SHELL)})
    )
    assert r.js_rendered_suspected is True
    assert r.website_status is WebsiteStatus.BROKEN


async def test_check_website_extracts_social_and_contact() -> None:
    html = (
        f"<html><head><title>S</title>{_VIEWPORT}</head><body>{_FILLER}"
        '<a href="https://facebook.com/shop">FB</a>'
        '<a href="https://www.instagram.com/shop">IG</a>'
        '<a href="tel:+639171234567">Call</a>'
        "</body></html>"
    )
    r = await check_website(
        "s.com", fetch=_fetch_map({"https://s.com/": _ok("https://s.com/", html)})
    )
    assert any("facebook.com" in s for s in r.social_links)
    assert any("instagram.com" in s for s in r.social_links)
    assert r.has_contact is True


async def test_check_website_detects_ordering() -> None:
    html = (
        f"<html><head><title>Food</title>{_VIEWPORT}</head><body>{_FILLER}"
        '<a href="https://www.foodpanda.ph/restaurant/abc">Order delivery</a>'
        "</body></html>"
    )
    r = await check_website(
        "food.com", fetch=_fetch_map({"https://food.com/": _ok("https://food.com/", html)})
    )
    assert r.has_ordering is True


# --------------------------------------------------------------------------- #
# Integration — POST /campaigns/{id}/audit-websites                            #
# --------------------------------------------------------------------------- #


async def _fake_fetch(url: str) -> FetchResult:
    """`.com` domains serve a GOOD page, `.ph` serve a BASIC page."""
    host = url.split("//", 1)[-1].strip("/")
    body = _GOOD if host.endswith(".com") else _BASIC
    return _ok(url, body)


@pytest.fixture
def _override_fetcher():
    app.dependency_overrides[get_fetcher] = lambda: _fake_fetch
    yield
    app.dependency_overrides.pop(get_fetcher, None)


async def _discover(client, auth, user):
    r = await client.post(
        "/campaigns",
        json={
            "name": "Salons",
            "service": "Website",
            "industries": ["salon"],
            "location": "Zamboanga City",
        },
        headers=auth(user),
    )
    assert r.status_code == 201, r.text
    cid = r.json()["id"]
    d = await client.post(f"/campaigns/{cid}/discover", headers=auth(user))
    assert d.status_code == 200, d.text
    return cid


async def test_audit_websites_populates_digital_audits(
    client, user_a, auth, db_owner, _override_fetcher
) -> None:
    cid = await _discover(client, auth, user_a)
    r = await client.post(f"/campaigns/{cid}/audit-websites", headers=auth(user_a))
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["audited"] == 50
    assert body["withDomain"] == 16
    assert body["reachable"] == 16
    assert body["noWebsite"] == 34
    assert body["status"] == "succeeded"

    rows = (
        await db_owner.execute(
            text(
                "SELECT website_status, count(*) FROM digital_audits GROUP BY website_status"
            )
        )
    ).all()
    counts = dict(rows)
    assert sum(counts.values()) == 50
    assert counts.get("good") == 9  # the 9 .com fixture domains
    assert counts.get("basic") == 7  # the 7 .ph fixture domains
    assert counts.get("none") == 34  # domainless businesses

    nulls = await db_owner.execute(
        text("SELECT count(*) FROM digital_audits WHERE mobile_friendly IS NULL")
    )
    assert nulls.scalar() == 34

    runs = await db_owner.execute(
        text("SELECT agent, status, business_count FROM agent_runs WHERE agent = 'audit'")
    )
    assert runs.all() == [("audit", "succeeded", 50)]


async def test_audit_websites_is_idempotent(
    client, user_a, auth, db_owner, _override_fetcher
) -> None:
    cid = await _discover(client, auth, user_a)
    await client.post(f"/campaigns/{cid}/audit-websites", headers=auth(user_a))
    r2 = await client.post(f"/campaigns/{cid}/audit-websites", headers=auth(user_a))
    assert r2.status_code == 200

    total = await db_owner.execute(text("SELECT count(*) FROM digital_audits"))
    assert total.scalar() == 50
    runs = await db_owner.execute(
        text("SELECT count(*) FROM agent_runs WHERE agent = 'audit'")
    )
    assert runs.scalar() == 2


async def test_audit_other_users_campaign_is_404(
    client, user_a, user_b, auth, _override_fetcher
) -> None:
    cid = await _discover(client, auth, user_a)
    r = await client.post(f"/campaigns/{cid}/audit-websites", headers=auth(user_b))
    assert r.status_code == 404


async def test_audits_are_user_scoped(
    client, user_a, user_b, auth, db_owner, _override_fetcher
) -> None:
    cid = await _discover(client, auth, user_a)
    await client.post(f"/campaigns/{cid}/audit-websites", headers=auth(user_a))
    # user_b has no businesses and no audits
    b_audits = await db_owner.execute(
        text(
            "SELECT count(*) FROM digital_audits d JOIN users u ON d.user_id = u.id "
            "WHERE u.email = :e"
        ),
        {"e": user_b["email"]},
    )
    assert b_audits.scalar() == 0
