"""Milestone 5 — Research task + evidence store.

Unit: the pure extractors and the fixture search provider. Integration:
`POST /campaigns/{id}/research` against real Postgres with RLS, the HTTP fetcher
overridden and search on the fixture provider.
"""

from __future__ import annotations

import pytest
from sqlalchemy import text

from backend.agents.research.extract import extract_contacts, parse_facebook
from backend.api.audit import get_fetcher
from backend.core.http import FetchResult
from backend.main import app
from backend.providers.search import FixtureSearch, get_search_provider

# --------------------------------------------------------------------------- #
# Unit — extractors                                                            #
# --------------------------------------------------------------------------- #

_PAGE = """
<html><head><title>Bella Rosa Salon</title></head><body>
  <p>Ring us on 0917 214 5566 or +63 62 991 1234.</p>
  <p>Email: <a href="mailto:hello@bellarosa.example">hello@bellarosa.example</a></p>
  <a href="tel:+639990001111">Call</a>
  <a href="https://www.facebook.com/bellarosasalon">Facebook</a>
  <a href="https://instagram.com/bellarosa">Instagram</a>
  <address>12 Nunez Ext, Tetuan, Zamboanga City</address>
  <footer>&copy; 2018 Bella Rosa Salon</footer>
</body></html>
"""


def test_extract_contacts_pulls_cited_facts() -> None:
    c = extract_contacts(_PAGE, source_url="https://bellarosa.example/")
    assert "0917 214 5566" in " ".join(c.phones)
    assert "+639990001111" in c.phones  # from the tel: href
    assert "hello@bellarosa.example" in c.emails
    assert any("facebook.com" in s for s in c.social_links)
    assert any("instagram.com" in s for s in c.social_links)
    assert c.address is not None and "Tetuan" in c.address
    assert c.last_seen_year == "2018"


def test_extract_contacts_ignores_junk() -> None:
    c = extract_contacts("<html><body><p>no contact info here</p></body></html>", source_url="x")
    assert c.phones == [] and c.emails == [] and c.social_links == []


def test_parse_facebook_reads_counts() -> None:
    html = (
        '<html><head><meta property="og:title" content="Prime Cuts Salon"></head>'
        "<body><div>412 followers</div><div>1,205 people like this</div></body></html>"
    )
    fb = parse_facebook(html)
    assert fb.title == "Prime Cuts Salon"
    assert fb.followers == 412
    assert fb.likes == 1205
    assert fb.login_walled is False


def test_parse_facebook_detects_login_wall() -> None:
    fb = parse_facebook(
        "<html><body>You must log in to continue.</body></html>"
    )
    assert fb.login_walled is True
    assert fb.followers is None and fb.likes is None


# --------------------------------------------------------------------------- #
# Unit — search provider selection                                             #
# --------------------------------------------------------------------------- #


async def test_fixture_search_matches_by_name() -> None:
    provider = FixtureSearch()
    hits = await provider.search('"Bella Rosa Salon" Zamboanga City contact', limit=5)
    assert len(hits) == 1
    assert hits[0].url.startswith("https://")


async def test_fixture_search_empty_on_miss() -> None:
    assert await FixtureSearch().search("nothing matches this", 5) == []


def test_get_search_provider_default_is_fixture() -> None:
    assert isinstance(get_search_provider(), FixtureSearch)


def test_get_search_provider_honours_ddg_setting(monkeypatch: pytest.MonkeyPatch) -> None:
    from backend.config import settings
    from backend.providers.search.duckduckgo import DuckDuckGoSearch

    monkeypatch.setattr(settings, "research_search", "ddg")
    assert isinstance(get_search_provider(), DuckDuckGoSearch)


# --------------------------------------------------------------------------- #
# Integration — POST /campaigns/{id}/research                                  #
# --------------------------------------------------------------------------- #

_BELLA_HTML = """
<html><head><title>Bella Rosa Salon</title></head><body>
  <p>Call 0917 214 5566</p>
  <p><a href="mailto:hello@bellarosa.example">hello@bellarosa.example</a></p>
  <a href="https://www.facebook.com/bellarosasalon">Our Facebook</a>
  <footer>&copy; 2019 Bella Rosa Salon</footer>
</body></html>
"""
_FB_HTML = """
<html><head><meta property="og:title" content="Bella Rosa Salon"></head>
<body>
  <div>Bella Rosa Salon</div>
  <div>340 followers</div>
  <div>318 people like this</div>
</body></html>
"""


def _res(url: str, body: str, status: int = 200) -> FetchResult:
    return FetchResult(
        requested_url=url,
        final_url=url,
        status_code=status,
        ok=200 <= status < 400,
        is_https=url.startswith("https"),
        body=body,
    )


async def _fake_fetch(url: str) -> FetchResult:
    if "bellarosasalon.com" in url:
        return _res(url, _BELLA_HTML)
    if "facebook.com" in url:
        return _res(url, _FB_HTML)
    return FetchResult(requested_url=url, error="ConnectError")  # unreachable


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


async def _bella_id(client, auth, user):
    leads = (await client.get("/leads", headers=auth(user))).json()
    return next(b["id"] for b in leads if b["name"] == "Bella Rosa Salon")


async def test_research_writes_cited_evidence(
    client, user_a, auth, db_owner, _override_fetcher
) -> None:
    cid = await _discover(client, auth, user_a)
    r = await client.post(f"/campaigns/{cid}/research", headers=auth(user_a))
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["status"] == "succeeded"
    assert body["businessesResearched"] == 50
    assert body["evidenceWritten"] > 0
    assert body["pagesFetched"] > 0

    # every evidence row is cited
    uncited = await db_owner.execute(
        text("SELECT count(*) FROM business_evidence WHERE source_url IS NULL OR source_url = ''")
    )
    assert uncited.scalar() == 0

    runs = await db_owner.execute(
        text("SELECT agent, status FROM agent_runs WHERE agent = 'research'")
    )
    assert runs.all() == [("research", "succeeded")]

    bella_id = await _bella_id(client, auth, user_a)
    ev = (await client.get(f"/leads/{bella_id}/evidence", headers=auth(user_a))).json()
    claims = {row["claim"] for row in ev}
    assert {"phone", "email", "facebook_url", "facebook_followers"} <= claims
    assert all(row["sourceUrl"].startswith("http") for row in ev)


async def test_research_is_idempotent(
    client, user_a, auth, db_owner, _override_fetcher
) -> None:
    cid = await _discover(client, auth, user_a)
    await client.post(f"/campaigns/{cid}/research", headers=auth(user_a))
    first = (
        await db_owner.execute(text("SELECT count(*) FROM business_evidence"))
    ).scalar()
    await client.post(f"/campaigns/{cid}/research", headers=auth(user_a))
    second = (
        await db_owner.execute(text("SELECT count(*) FROM business_evidence"))
    ).scalar()
    assert first == second and first > 0

    runs = await db_owner.execute(
        text("SELECT count(*) FROM agent_runs WHERE agent = 'research'")
    )
    assert runs.scalar() == 2


async def test_research_other_users_campaign_is_404(
    client, user_a, user_b, auth, _override_fetcher
) -> None:
    cid = await _discover(client, auth, user_a)
    r = await client.post(f"/campaigns/{cid}/research", headers=auth(user_b))
    assert r.status_code == 404


async def test_evidence_endpoint_is_user_scoped(
    client, user_a, user_b, auth, _override_fetcher
) -> None:
    cid = await _discover(client, auth, user_a)
    await client.post(f"/campaigns/{cid}/research", headers=auth(user_a))
    bella_id = await _bella_id(client, auth, user_a)

    mine = await client.get(f"/leads/{bella_id}/evidence", headers=auth(user_a))
    assert mine.status_code == 200 and len(mine.json()) > 0

    theirs = await client.get(f"/leads/{bella_id}/evidence", headers=auth(user_b))
    assert theirs.status_code == 404  # RLS hides the business entirely
