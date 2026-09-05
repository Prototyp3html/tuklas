"""Milestone 7 — Opportunity scoring (Layer 1 weighted score + gated LLM layer).

Unit: `score_lead` (pure), `FixtureLLM`, `get_llm_provider`. Integration: the full
discover -> audit-websites -> research -> audit -> `POST /campaigns/{id}/score`
chain against real Postgres with RLS, HTTP fetcher + search + LLM all overridden.
"""

from __future__ import annotations

import uuid

import pytest
from sqlalchemy import text

from backend.agents.opportunity.score import ScoreInputs, score_lead, tier_for
from backend.api.audit import get_fetcher
from backend.api.opportunity import get_llm
from backend.core.http import FetchResult
from backend.main import app
from backend.models.enums import ScoreTier, SocialPresence, WebsiteStatus
from backend.providers.llm import FixtureLLM, get_llm_provider
from backend.providers.llm.base import LLMProvider
from backend.schemas.opportunity import OpportunityAnalysis

# --------------------------------------------------------------------------- #
# Unit — score_lead                                                            #
# --------------------------------------------------------------------------- #


def _inp(**over) -> ScoreInputs:
    base = dict(
        has_website=True,
        website_status=WebsiteStatus.GOOD,
        has_booking=True,
        has_ordering=True,
        social_presence=SocialPresence.NONE,
        campaign_service="Website",
        campaign_industries=["salon"],
        campaign_location="Zamboanga City",
        business_category="Hair Salon",
        business_address="Nunez Ext, Tetuan, Zamboanga City",
        evidence_claims=set(),
    )
    base.update(over)
    return ScoreInputs(**base)


def test_score_no_website_salon_in_area_with_contact() -> None:
    score, breakdown = score_lead(
        _inp(has_website=False, website_status=WebsiteStatus.NONE, evidence_claims={"phone"})
    )
    assert set(breakdown) == {"no_website", "contactable", "industry_match", "location_match"}
    assert score == sum(breakdown.values()) == 30 + 10 + 20 + 10


def test_score_healthy_site_scores_low() -> None:
    score, breakdown = score_lead(
        _inp(website_status=WebsiteStatus.GOOD, social_presence=SocialPresence.INACTIVE)
    )
    # only fit factors fire
    assert set(breakdown) == {"industry_match", "location_match"}
    assert score == 30


def test_score_active_social_fires() -> None:
    _, breakdown = score_lead(_inp(social_presence=SocialPresence.VERY_ACTIVE))
    assert "active_social" in breakdown


def test_score_booking_only_when_service_wants_it() -> None:
    generic = score_lead(_inp(has_booking=False, campaign_service="Website"))[1]
    assert "no_booking" not in generic
    booking = score_lead(
        _inp(has_booking=False, campaign_service="Salon booking website")
    )[1]
    assert booking["no_booking"] == 20


def test_score_caps_at_100() -> None:
    score, breakdown = score_lead(
        _inp(
            has_website=False,
            website_status=WebsiteStatus.NONE,
            social_presence=SocialPresence.ACTIVE,
            evidence_claims={"email"},
        )
    )
    assert sum(breakdown.values()) == 90  # 30 + 20 + 10 + 20 + 10
    assert score == 90


def test_tier_for() -> None:
    assert tier_for(85) is ScoreTier.HIGH
    assert tier_for(50) is ScoreTier.MID
    assert tier_for(49) is ScoreTier.LOW


# --------------------------------------------------------------------------- #
# Unit — providers                                                             #
# --------------------------------------------------------------------------- #


async def test_fixture_llm_cites_prompt_uuids() -> None:
    ids = [uuid.uuid4() for _ in range(3)]
    prompt = "Evidence:\n" + "\n".join(f"- {i} | phone = x" for i in ids)
    out = await FixtureLLM().complete_structured(prompt, OpportunityAnalysis)
    assert isinstance(out, OpportunityAnalysis)
    assert set(out.evidence_ids) == set(ids)
    assert 0 <= out.confidence <= 1 and 0 <= out.score <= 100


def test_get_llm_provider_default_is_fixture() -> None:
    assert isinstance(get_llm_provider(), FixtureLLM)


def test_get_llm_provider_honours_ollama_setting(monkeypatch: pytest.MonkeyPatch) -> None:
    from backend.config import settings
    from backend.providers.llm.ollama import OllamaProvider

    monkeypatch.setattr(settings, "llm_provider", "ollama")
    assert isinstance(get_llm_provider(), OllamaProvider)


# --------------------------------------------------------------------------- #
# Integration — POST /campaigns/{id}/score                                     #
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
<body><div>340 followers</div><div>318 people like this</div></body></html>
"""


def _res(url: str, body: str) -> FetchResult:
    return FetchResult(
        requested_url=url, final_url=url, status_code=200, ok=True,
        is_https=url.startswith("https"), body=body,
    )


async def _fake_fetch(url: str) -> FetchResult:
    if "bellarosasalon.com" in url:
        return _res(url, _BELLA_HTML)
    if "facebook.com" in url:
        return _res(url, _FB_HTML)
    return FetchResult(requested_url=url, error="ConnectError")


class _BadLLM(LLMProvider):
    """Always cites an evidence id that does not exist."""

    async def complete_structured(self, prompt, schema, tier="cheap"):
        return OpportunityAnalysis(
            score=90, recommended_service="x", sales_angle="x",
            reasoning="x", confidence=0.9, evidence_ids=[uuid.uuid4()],
        )


@pytest.fixture
def _overrides():
    app.dependency_overrides[get_fetcher] = lambda: _fake_fetch
    app.dependency_overrides[get_llm] = lambda: FixtureLLM()
    yield
    app.dependency_overrides.pop(get_fetcher, None)
    app.dependency_overrides.pop(get_llm, None)


async def _chain(client, auth, user):
    r = await client.post(
        "/campaigns",
        json={
            "name": "Salons", "service": "Website",
            "industries": ["salon"], "location": "Zamboanga City",
        },
        headers=auth(user),
    )
    assert r.status_code == 201, r.text
    cid = r.json()["id"]
    for path in ("discover", "audit-websites", "research", "audit"):
        resp = await client.post(f"/campaigns/{cid}/{path}", headers=auth(user))
        assert resp.status_code == 200, (path, resp.text)
    return cid


async def _bella_id(client, auth, user):
    leads = (await client.get("/leads", headers=auth(user))).json()
    return next(b["id"] for b in leads if b["businessName"] == "Bella Rosa Salon")


async def test_score_writes_lead_scores_and_grounded_opportunities(
    client, user_a, auth, db_owner, _overrides
) -> None:
    cid = await _chain(client, auth, user_a)

    r = await client.post(f"/campaigns/{cid}/score", headers=auth(user_a))
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["status"] == "succeeded"
    assert body["scored"] == 50
    assert body["qualified"] >= 45
    assert body["llmFailures"] == 0
    assert body["llmCalls"] >= 1

    scores = (
        await db_owner.execute(text("SELECT score, breakdown FROM lead_scores"))
    ).all()
    assert len(scores) == 50
    for score, breakdown in scores:
        fired = sum(breakdown.values())
        assert score == min(100, fired)
        assert score >= 0

    opp_count = (
        await db_owner.execute(text("SELECT count(*) FROM lead_opportunities"))
    ).scalar()
    assert opp_count == body["llmCalls"]

    runs = (
        await db_owner.execute(
            text("SELECT status FROM agent_runs WHERE agent = 'opportunity'")
        )
    ).scalars().all()
    assert list(runs) == ["succeeded"]

    bella_id = await _bella_id(client, auth, user_a)
    s = (await client.get(f"/leads/{bella_id}/score", headers=auth(user_a))).json()
    assert s["score"] == 85
    assert s["tier"] == "high"
    assert s["qualified"] is True
    assert sum(s["breakdown"].values()) == 85
    assert s["opportunity"] is not None
    assert s["opportunity"]["recommendedService"]


async def test_score_is_idempotent(client, user_a, auth, db_owner, _overrides) -> None:
    cid = await _chain(client, auth, user_a)
    bella_id = await _bella_id(client, auth, user_a)

    await client.post(f"/campaigns/{cid}/score", headers=auth(user_a))
    first = (await client.get(f"/leads/{bella_id}/score", headers=auth(user_a))).json()
    n1 = (await db_owner.execute(text("SELECT count(*) FROM lead_opportunities"))).scalar()

    await client.post(f"/campaigns/{cid}/score", headers=auth(user_a))
    second = (await client.get(f"/leads/{bella_id}/score", headers=auth(user_a))).json()
    n2 = (await db_owner.execute(text("SELECT count(*) FROM lead_opportunities"))).scalar()

    assert first["breakdown"] == second["breakdown"] and first["score"] == second["score"]
    assert n1 == n2
    scores = (await db_owner.execute(text("SELECT count(*) FROM lead_scores"))).scalar()
    assert scores == 50
    runs = (
        await db_owner.execute(
            text("SELECT count(*) FROM agent_runs WHERE agent = 'opportunity'")
        )
    ).scalar()
    assert runs == 2


async def test_score_rejects_ungrounded_llm_output(
    client, user_a, auth, db_owner, _overrides
) -> None:
    app.dependency_overrides[get_llm] = lambda: _BadLLM()
    cid = await _chain(client, auth, user_a)

    r = await client.post(f"/campaigns/{cid}/score", headers=auth(user_a))
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["status"] == "failed"
    assert body["llmCalls"] == 0
    assert body["llmFailures"] >= 1

    opp = (await db_owner.execute(text("SELECT count(*) FROM lead_opportunities"))).scalar()
    assert opp == 0  # never persist an ungrounded conclusion

    scored = (await db_owner.execute(text("SELECT count(*) FROM lead_scores"))).scalar()
    assert scored == 50  # deterministic layer still committed

    errs = (
        await db_owner.execute(
            text("SELECT count(*) FROM agent_errors WHERE error_type = 'ungrounded'")
        )
    ).scalar()
    assert errs >= 1


async def test_score_other_users_campaign_is_404(
    client, user_a, user_b, auth, _overrides
) -> None:
    cid = await _chain(client, auth, user_a)
    r = await client.post(f"/campaigns/{cid}/score", headers=auth(user_b))
    assert r.status_code == 404


async def test_score_read_is_user_scoped(
    client, user_a, user_b, auth, _overrides
) -> None:
    cid = await _chain(client, auth, user_a)
    await client.post(f"/campaigns/{cid}/score", headers=auth(user_a))
    bella_id = await _bella_id(client, auth, user_a)

    mine = await client.get(f"/leads/{bella_id}/score", headers=auth(user_a))
    assert mine.status_code == 200

    theirs = await client.get(f"/leads/{bella_id}/score", headers=auth(user_b))
    assert theirs.status_code == 404
