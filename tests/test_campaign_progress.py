"""Milestone 8 — `POST /campaigns/{id}/run` orchestrator and
`GET /campaigns/{id}/progress` funnel (derived from `agent_runs`), plus the
`leadCount` / `qualifiedCount` rollups on the campaign read.
"""

from __future__ import annotations

from tests._pipeline import make_campaign


async def test_progress_before_run_is_all_queued(client, user_a, auth, pipeline_overrides):
    cid = await make_campaign(client, auth, user_a)
    p = (await client.get(f"/campaigns/{cid}/progress", headers=auth(user_a))).json()
    assert p["status"] == "draft"
    assert [s["agent"] for s in p["stages"]] == [
        "discovery", "research", "audit", "opportunity"
    ]
    assert all(s["status"] == "queued" and s["kept"] is None for s in p["stages"])


async def test_run_executes_full_pipeline(client, user_a, auth, pipeline_overrides):
    cid = await make_campaign(client, auth, user_a)

    run = (await client.post(f"/campaigns/{cid}/run", headers=auth(user_a))).json()
    assert run["status"] == "complete"
    assert run["endedAt"] is not None

    stages = {s["agent"]: s for s in run["stages"]}
    assert all(s["status"] == "succeeded" for s in stages.values())
    assert stages["discovery"]["kept"] == 50
    assert stages["research"]["kept"] == 50
    # `kept` at scoring tracks the qualified count, not the raw business count —
    # that's where the funnel narrows once weights are tuned (flat here: every
    # offline-fixture salon clears the threshold at 60).
    assert stages["opportunity"]["kept"] == stages["discovery"]["kept"]
    assert "≥" in stages["opportunity"]["dropReason"]

    # progress endpoint agrees
    p = (await client.get(f"/campaigns/{cid}/progress", headers=auth(user_a))).json()
    assert p["status"] == "complete"

    # campaign rollups
    c = (await client.get(f"/campaigns/{cid}", headers=auth(user_a))).json()
    assert c["leadCount"] == 50
    assert c["qualifiedCount"] == stages["opportunity"]["kept"]
    assert c["industries"] == ["salon"]


async def test_run_and_progress_are_user_scoped(
    client, user_a, user_b, auth, pipeline_overrides
):
    cid = await make_campaign(client, auth, user_a)
    assert (
        await client.post(f"/campaigns/{cid}/run", headers=auth(user_b))
    ).status_code == 404
    assert (
        await client.get(f"/campaigns/{cid}/progress", headers=auth(user_b))
    ).status_code == 404
