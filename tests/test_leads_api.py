"""Milestone 8 — `GET /leads` (LeadSummary + filters), `GET /leads/{id}`
(LeadDetail), `PATCH /leads/{id}/status`. Real Postgres + RLS; the pipeline runs
once via `POST /campaigns/{id}/run` (`pipeline_overrides` stubs fetch + LLM).
"""

from __future__ import annotations

from tests._pipeline import bella_id, run_pipeline


async def test_lead_list_is_scored_and_sorted(client, user_a, auth, pipeline_overrides):
    await run_pipeline(client, auth, user_a)

    leads = (await client.get("/leads", headers=auth(user_a))).json()
    assert len(leads) == 50
    scores = [lead["score"] for lead in leads]
    assert scores == sorted(scores, reverse=True)
    top = leads[0]
    assert set(top) >= {
        "id", "businessName", "location", "category", "score", "tier",
        "status", "evidenceCount", "hasWebsite",
    }
    assert top["businessName"] == "Bella Rosa Salon"
    assert top["tier"] == "high"
    assert top["status"] == "new"


async def test_lead_list_filters(client, user_a, auth, pipeline_overrides):
    await run_pipeline(client, auth, user_a)

    # with this offline fixture only Bella Rosa has a reachable site -> score 85;
    # every other salon is no_website + industry + location = 60.
    high = (await client.get("/leads?scoreMin=85", headers=auth(user_a))).json()
    assert [lead["businessName"] for lead in high] == ["Bella Rosa Salon"]

    mid = (await client.get("/leads?scoreMin=60&scoreMax=60", headers=auth(user_a))).json()
    assert len(mid) == 49 and all(lead["score"] == 60 for lead in mid)

    withsite = (await client.get("/leads?hasWebsite=true", headers=auth(user_a))).json()
    assert [lead["businessName"] for lead in withsite] == ["Bella Rosa Salon"]

    nosite = (await client.get("/leads?hasWebsite=false", headers=auth(user_a))).json()
    assert len(nosite) == 49

    salon = (await client.get("/leads?industry=salon", headers=auth(user_a))).json()
    assert len(salon) == 50  # every fixture business is a salon

    contacted = (await client.get("/leads?status=contacted", headers=auth(user_a))).json()
    assert contacted == []


async def test_lead_detail_composes_everything(client, user_a, auth, pipeline_overrides):
    await run_pipeline(client, auth, user_a)
    bid = await bella_id(client, auth, user_a)

    d = (await client.get(f"/leads/{bid}", headers=auth(user_a))).json()
    assert d["businessName"] == "Bella Rosa Salon"
    assert d["score"] == 85
    assert sum(d["breakdown"].values()) == d["score"]
    assert d["campaignId"]
    assert d["audit"] is not None and d["audit"]["socialPresence"] == "active"
    assert d["evidence"] and all(e["sourceUrl"].startswith("http") for e in d["evidence"])
    assert all(e["kind"] in ("gap", "strength") for e in d["evidence"])
    assert d["recommendedService"]  # FixtureLLM ran (qualified + has evidence)
    assert 0 <= d["confidence"] <= 1


async def test_patch_lead_status(client, user_a, auth, pipeline_overrides):
    await run_pipeline(client, auth, user_a)
    bid = await bella_id(client, auth, user_a)

    r = await client.patch(
        f"/leads/{bid}/status", json={"status": "contacted"}, headers=auth(user_a)
    )
    assert r.status_code == 200, r.text
    assert r.json()["status"] == "contacted"

    again = (await client.get(f"/leads/{bid}", headers=auth(user_a))).json()
    assert again["status"] == "contacted"


async def test_leads_are_user_scoped(client, user_a, user_b, auth, pipeline_overrides):
    await run_pipeline(client, auth, user_a)
    bid = await bella_id(client, auth, user_a)

    assert (await client.get("/leads", headers=auth(user_b))).json() == []
    assert (await client.get(f"/leads/{bid}", headers=auth(user_b))).status_code == 404
    r = await client.patch(
        f"/leads/{bid}/status", json={"status": "won"}, headers=auth(user_b)
    )
    assert r.status_code == 404
