"""Milestone 6 — Audit task (compose website + evidence into one verdict).

Unit: the pure verdict functions in `backend/agents/audit/verdict.py`.
Integration: `POST /campaigns/{id}/audit` against real Postgres with RLS, run
after discover -> audit-websites -> research (HTTP fetcher + search overridden).
"""

from __future__ import annotations

import pytest
from sqlalchemy import text

from backend.agents.audit.verdict import (
    AuditInputs,
    classify_evidence_kind,
    classify_social_presence,
    derive_digital_gaps,
    score_confidence,
)
from backend.api.audit import get_fetcher
from backend.core.http import FetchResult
from backend.main import app
from backend.models import BusinessEvidence
from backend.models.enums import EvidenceKind, SocialPresence, WebsiteStatus

# --------------------------------------------------------------------------- #
# Unit — verdict functions                                                     #
# --------------------------------------------------------------------------- #


def _ev(claim: str, value: str = "x") -> BusinessEvidence:
    return BusinessEvidence(
        claim=claim, observed_value=value, source_url="http://s", confidence=0.5
    )


def _inputs(**over) -> AuditInputs:
    base = dict(
        has_website=True,
        website_status=WebsiteStatus.GOOD,
        has_booking=True,
        has_ordering=True,
        mobile_friendly=True,
        evidence=[],
    )
    base.update(over)
    return AuditInputs(**base)


def test_gaps_domainless_business() -> None:
    gaps = derive_digital_gaps(
        _inputs(
            has_website=False,
            website_status=WebsiteStatus.NONE,
            has_booking=False,
            has_ordering=False,
            mobile_friendly=None,
        )
    )
    assert gaps == ["no_website", "weak_social_presence", "no_public_contact"]


def test_gaps_broken_site_with_contact_and_social() -> None:
    gaps = derive_digital_gaps(
        _inputs(
            website_status=WebsiteStatus.BROKEN,
            has_booking=False,
            has_ordering=False,
            mobile_friendly=False,
            evidence=[
                _ev("phone", "0917 000 1111"),
                _ev("facebook_url", "https://facebook.com/x"),
                _ev("facebook_followers", "900"),
            ],
        )
    )
    assert "broken_website" in gaps
    assert "not_mobile_friendly" in gaps
    assert "no_booking" in gaps and "no_ordering" in gaps
    assert "weak_social_presence" not in gaps  # 900 >= active threshold
    assert "no_public_contact" not in gaps


def test_gaps_healthy_site_has_none() -> None:
    gaps = derive_digital_gaps(
        _inputs(
            evidence=[
                _ev("phone"),
                _ev("facebook_url", "https://facebook.com/x"),
                _ev("facebook_followers", "2000"),
            ],
        )
    )
    assert gaps == []


def test_social_presence_levels() -> None:
    assert classify_social_presence([]) is SocialPresence.NONE
    assert (
        classify_social_presence([_ev("facebook_url", "https://facebook.com/x")])
        is SocialPresence.INACTIVE
    )
    assert (
        classify_social_presence(
            [_ev("facebook_url", "https://facebook.com/x"), _ev("facebook_followers", "340")]
        )
        is SocialPresence.ACTIVE
    )
    assert (
        classify_social_presence(
            [_ev("instagram_url", "https://instagram.com/x"), _ev("facebook_likes", "5,000")]
        )
        is SocialPresence.VERY_ACTIVE
    )


def test_confidence_band_and_monotonicity() -> None:
    lo = score_confidence(
        _inputs(has_website=False, website_status=WebsiteStatus.NONE, evidence=[])
    )
    hi = score_confidence(
        _inputs(
            evidence=[_ev("phone"), _ev("email"), _ev("facebook_url"), _ev("website_reachable")]
        )
    )
    assert lo == 0.50
    assert hi >= 0.9
    assert score_confidence(_inputs(evidence=[_ev("phone")])) < score_confidence(
        _inputs(evidence=[_ev("phone"), _ev("email")])
    )


def test_classify_evidence_kind() -> None:
    assert classify_evidence_kind("phone", "0917") is EvidenceKind.STRENGTH
    assert classify_evidence_kind("facebook_followers", "340") is EvidenceKind.STRENGTH
    assert classify_evidence_kind("website_reachable", "true") is EvidenceKind.STRENGTH
    assert classify_evidence_kind("website_reachable", "false") is EvidenceKind.GAP
    assert classify_evidence_kind("website_last_seen", "2018") is EvidenceKind.GAP


# --------------------------------------------------------------------------- #
# Integration — POST /campaigns/{id}/audit                                     #
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


async def _run_stages(client, auth, user):
    """discover -> audit-websites -> research; return (campaign_id)."""
    cid = await _discover(client, auth, user)
    aw = await client.post(f"/campaigns/{cid}/audit-websites", headers=auth(user))
    assert aw.status_code == 200, aw.text
    rr = await client.post(f"/campaigns/{cid}/research", headers=auth(user))
    assert rr.status_code == 200, rr.text
    return cid


async def _bella_id(client, auth, user):
    leads = (await client.get("/leads", headers=auth(user))).json()
    return next(b["id"] for b in leads if b["name"] == "Bella Rosa Salon")


async def test_audit_composes_full_verdict(
    client, user_a, auth, db_owner, _override_fetcher
) -> None:
    cid = await _run_stages(client, auth, user_a)

    r = await client.post(f"/campaigns/{cid}/audit", headers=auth(user_a))
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["status"] == "succeeded"
    assert body["audited"] == 50
    assert body["gapsFlagged"] > 0
    assert body["evidenceClassified"] > 0

    # every digital_audits row is finalized, not left at defaults
    audits = (
        await db_owner.execute(
            text(
                "SELECT social_presence, confidence, digital_gaps FROM digital_audits"
            )
        )
    ).all()
    assert len(audits) == 50
    assert all(row.confidence > 0 for row in audits)
    assert all(row.digital_gaps is not None for row in audits)
    presences = {row.social_presence for row in audits}
    assert {"none", "active"} <= presences  # Bella is active, domainless are none

    # every evidence row now carries a kind
    unclassified = await db_owner.execute(
        text("SELECT count(*) FROM business_evidence WHERE kind IS NULL")
    )
    assert unclassified.scalar() == 0

    # one succeeded audit run from this call (M4's audit-websites also logs 'audit')
    runs = (
        await db_owner.execute(
            text(
                "SELECT status FROM agent_runs WHERE agent = 'audit' "
                "ORDER BY started_at"
            )
        )
    ).scalars().all()
    assert list(runs) == ["succeeded", "succeeded"]  # audit-websites, then audit

    bella_id = await _bella_id(client, auth, user_a)
    a = (await client.get(f"/leads/{bella_id}/audit", headers=auth(user_a))).json()
    assert a["socialPresence"] == "active"
    assert a["hasWebsite"] is True
    assert "no_website" not in a["digitalGaps"]
    assert "weak_social_presence" not in a["digitalGaps"]  # 340 followers
    # the fixture page is a thin stub with no viewport -> broken + not mobile
    assert {"broken_website", "not_mobile_friendly", "no_booking", "no_ordering"} <= set(
        a["digitalGaps"]
    )
    assert a["confidence"] > 0

    ev = (await client.get(f"/leads/{bella_id}/evidence", headers=auth(user_a))).json()
    assert ev and all(row["kind"] in ("gap", "strength") for row in ev)


async def test_audit_is_idempotent(
    client, user_a, auth, db_owner, _override_fetcher
) -> None:
    cid = await _run_stages(client, auth, user_a)
    bella_id = await _bella_id(client, auth, user_a)

    await client.post(f"/campaigns/{cid}/audit", headers=auth(user_a))
    first = (await client.get(f"/leads/{bella_id}/audit", headers=auth(user_a))).json()
    await client.post(f"/campaigns/{cid}/audit", headers=auth(user_a))
    second = (await client.get(f"/leads/{bella_id}/audit", headers=auth(user_a))).json()

    assert first["digitalGaps"] == second["digitalGaps"]
    assert first["socialPresence"] == second["socialPresence"]

    total = await db_owner.execute(text("SELECT count(*) FROM digital_audits"))
    assert total.scalar() == 50
    audit_runs = await db_owner.execute(
        text("SELECT count(*) FROM agent_runs WHERE agent = 'audit'")
    )
    assert audit_runs.scalar() == 3  # 1 audit-websites + 2 audit


async def test_audit_other_users_campaign_is_404(
    client, user_a, user_b, auth, _override_fetcher
) -> None:
    cid = await _run_stages(client, auth, user_a)
    r = await client.post(f"/campaigns/{cid}/audit", headers=auth(user_b))
    assert r.status_code == 404


async def test_audit_read_is_user_scoped(
    client, user_a, user_b, auth, _override_fetcher
) -> None:
    cid = await _run_stages(client, auth, user_a)
    await client.post(f"/campaigns/{cid}/audit", headers=auth(user_a))
    bella_id = await _bella_id(client, auth, user_a)

    mine = await client.get(f"/leads/{bella_id}/audit", headers=auth(user_a))
    assert mine.status_code == 200

    theirs = await client.get(f"/leads/{bella_id}/audit", headers=auth(user_b))
    assert theirs.status_code == 404  # RLS hides the business entirely
