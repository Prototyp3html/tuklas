"""Milestone 3 — Discovery task.

Unit coverage for the pure normalize/dedupe helpers, plus integration coverage
of `POST /campaigns` + `POST /campaigns/{id}/discover` against real Postgres with
RLS in force.
"""

from __future__ import annotations

import pytest
from sqlalchemy import text

from backend.agents.discovery.dedupe import dedupe_batch, is_duplicate
from backend.agents.discovery.normalize import extract_domain, normalize_name, to_e164
from backend.providers.business_data import get_business_source
from backend.schemas.business import NormalizedBusiness, RawBusiness

# --------------------------------------------------------------------------- #
# Unit — normalization                                                         #
# --------------------------------------------------------------------------- #


@pytest.mark.parametrize(
    ("raw", "expected"),
    [
        ("Bella Rosa Salon", "bella rosa"),
        ("Glow & Go Salon, Inc.", "glow go"),
        ("  Kléo   Hair  Salon ", "kleo hair"),
        ("Posh Parlor Salon", "posh"),
        ("ABC Trading Corporation", "abc"),
        ("Salon", "salon"),  # all-suffix: falls back to the bare casefolded text
    ],
)
def test_normalize_name(raw: str, expected: str) -> None:
    assert normalize_name(raw) == expected


@pytest.mark.parametrize(
    ("raw", "expected"),
    [
        ("09171234567", "+639171234567"),
        ("+63 917 123 4567", "+639171234567"),
        ("639171234567", "+639171234567"),
        ("(062) 991 1234", "+63629911234"),
        ("12345", None),
        ("", None),
        (None, None),
    ],
)
def test_to_e164(raw: str | None, expected: str | None) -> None:
    assert to_e164(raw) == expected


@pytest.mark.parametrize(
    ("raw", "expected"),
    [
        ("https://bellarosasalon.com", "bellarosasalon.com"),
        ("http://www.example.com/path?q=1", "example.com"),
        ("example.ph", "example.ph"),
        ("https://facebook.com/some.page", None),
        ("https://www.facebook.com/some.page", None),
        ("not a url", None),
        ("", None),
        (None, None),
    ],
)
def test_extract_domain(raw: str | None, expected: str | None) -> None:
    assert extract_domain(raw) == expected


# --------------------------------------------------------------------------- #
# Unit — dedupe                                                                #
# --------------------------------------------------------------------------- #


def _nb(
    name: str,
    *,
    normalized_name: str | None = None,
    domain: str | None = None,
    address: str | None = None,
    phone: str | None = None,
) -> NormalizedBusiness:
    return NormalizedBusiness(
        name=name,
        normalized_name=normalized_name if normalized_name is not None else name.lower(),
        domain=domain,
        address=address,
        phone=phone,
        source_name="test",
    )


def test_is_duplicate_on_shared_domain() -> None:
    a = _nb("Some Salon", normalized_name="some", domain="x.com", address="1 A St, Tetuan")
    b = _nb("Other Name", normalized_name="other", domain="x.com", address="9 B Rd, Guiwan")
    assert is_duplicate(a, b) is True


def test_is_duplicate_exact_name_with_address_overlap() -> None:
    addr = "Nunez Ext, Tetuan, Zamboanga City"
    a = _nb("Bella Rosa", normalized_name="bella rosa", address=addr)
    b = _nb("Bella Rosa", normalized_name="bella rosa", address=addr)
    assert is_duplicate(a, b) is True


def test_is_duplicate_fuzzy_name_with_corroboration() -> None:
    addr = "Camins Ave, Baliwasan, Zamboanga City"
    a = _nb("Acme Hair Studio", normalized_name="acme hair studio", address=addr)
    b = _nb("Acme Hair Studios", normalized_name="acme hair studios", address=addr)
    assert is_duplicate(a, b) is True


def test_same_name_different_barangay_is_not_a_duplicate() -> None:
    a = _nb(
        "Sunrise Spa",
        normalized_name="sunrise",
        address="Lustre St, Tetuan, Zamboanga City",
        phone="+63629911234",
    )
    b = _nb(
        "Sunrise Spa",
        normalized_name="sunrise",
        address="Nunturan Drive, Guiwan, Zamboanga City",
        phone=None,
    )
    assert is_duplicate(a, b) is False


def test_dedupe_batch_drops_in_batch_repeat() -> None:
    addr = "Nunez Ext, Tetuan, Zamboanga City"
    a = _nb("Bella Rosa", normalized_name="bella rosa", address=addr)
    a_again = _nb("Bella Rosa", normalized_name="bella rosa", address=addr)
    b = _nb("Nova Hair", normalized_name="nova hair", address="Canelar Loop, Canelar")
    assert len(dedupe_batch([a, a_again, b])) == 2


# --------------------------------------------------------------------------- #
# Unit — fixture source                                                        #
# --------------------------------------------------------------------------- #


async def test_fixture_source_caps_and_filters() -> None:
    src = get_business_source()
    res = await src.search("salon", "Zamboanga City", 50)
    assert len(res) == 50
    assert all(isinstance(r, RawBusiness) for r in res)
    assert all("salon" in (r.category or "").lower() for r in res)


async def test_fixture_source_category_filter_excludes_non_matches() -> None:
    src = get_business_source()
    res = await src.search("dental clinic", "Zamboanga City", 50)
    assert 1 <= len(res) < 50
    assert all("dental" in (r.category or "").lower() for r in res)


# --------------------------------------------------------------------------- #
# Integration — the endpoint                                                   #
# --------------------------------------------------------------------------- #


async def _create_campaign(client, auth, user, **override):
    body = {
        "name": "Zamboanga salons",
        "service": "Website",
        "industries": ["salon"],
        "location": "Zamboanga City",
        "budgetMin": 30000,
    }
    body.update(override)
    r = await client.post("/campaigns", json=body, headers=auth(user))
    assert r.status_code == 201, r.text
    return r.json()


async def _discover(client, auth, user, campaign_id):
    return await client.post(
        f"/campaigns/{campaign_id}/discover", headers=auth(user)
    )


async def test_create_campaign_returns_201(client, user_a, auth) -> None:
    body = await _create_campaign(client, auth, user_a)
    assert body["status"] == "draft"
    assert body["budgetMin"] == 30000


async def test_discover_populates_businesses(client, user_a, auth, db_owner) -> None:
    camp = await _create_campaign(client, auth, user_a)
    r = await _discover(client, auth, user_a, camp["id"])
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["discovered"] == 50
    assert body["inserted"] == 50
    assert body["duplicates"] == 0
    assert body["status"] == "succeeded"
    assert body["durationMs"] >= 0

    leads = await client.get("/leads", headers=auth(user_a))
    assert leads.status_code == 200
    assert len(leads.json()) == 50

    sources = await db_owner.execute(text("SELECT count(*) FROM business_sources"))
    assert sources.scalar() == 50
    runs = await db_owner.execute(
        text("SELECT agent, status, business_count FROM agent_runs")
    )
    assert runs.all() == [("discovery", "succeeded", 50)]


async def test_rerun_discovery_is_idempotent(client, user_a, auth, db_owner) -> None:
    camp = await _create_campaign(client, auth, user_a)
    await _discover(client, auth, user_a, camp["id"])
    r2 = await _discover(client, auth, user_a, camp["id"])
    assert r2.status_code == 200
    body = r2.json()
    assert body["inserted"] == 0
    assert body["duplicates"] == 50

    businesses = await db_owner.execute(text("SELECT count(*) FROM businesses"))
    assert businesses.scalar() == 50
    runs = await db_owner.execute(text("SELECT count(*) FROM agent_runs"))
    assert runs.scalar() == 2


async def test_discover_other_users_campaign_is_404(
    client, user_a, user_b, auth
) -> None:
    camp = await _create_campaign(client, auth, user_a)
    r = await _discover(client, auth, user_b, camp["id"])
    assert r.status_code == 404


async def test_discovered_businesses_are_user_scoped(
    client, user_a, user_b, auth
) -> None:
    camp = await _create_campaign(client, auth, user_a)
    await _discover(client, auth, user_a, camp["id"])
    mine = await client.get("/leads", headers=auth(user_a))
    theirs = await client.get("/leads", headers=auth(user_b))
    assert len(mine.json()) == 50
    assert theirs.json() == []


async def test_discovery_task_inner_runs(client, user_a, auth, db_owner) -> None:
    """The Celery task's async core, exercised directly (calling the sync
    `discovery_task` from this running loop would hit `asyncio.run`)."""
    camp = await _create_campaign(client, auth, user_a)
    from backend.queue.tasks import _run_discovery

    out = await _run_discovery(user_a["id"], camp["id"])
    assert out["inserted"] == 50
    assert out["status"] == "succeeded"
    businesses = await db_owner.execute(text("SELECT count(*) FROM businesses"))
    assert businesses.scalar() == 50


def test_discovery_task_registered_and_eager() -> None:
    from backend.queue.celery_app import celery_app

    assert celery_app.conf.task_always_eager is True
    assert "discovery.run" in celery_app.tasks
