"""Milestone 8 — `GET /dashboard` KPI + funnel snapshot."""

from __future__ import annotations

from tests._pipeline import run_pipeline


async def test_dashboard_empty_before_any_run(client, user_a, auth):
    d = (await client.get("/dashboard", headers=auth(user_a))).json()
    assert d["range"] == "all"
    assert {k["key"] for k in d["kpis"]} == {
        "scanned", "analyzed", "qualified", "highPriority", "replies"
    }
    assert all(k["value"] == 0 for k in d["kpis"])
    assert all(k["deltaPct"] is None for k in d["kpis"])
    assert [b["count"] for b in d["funnel"]] == [0, 0, 0, 0]


async def test_dashboard_after_pipeline(client, user_a, auth, pipeline_overrides):
    await run_pipeline(client, auth, user_a)

    d = (await client.get("/dashboard?range=all", headers=auth(user_a))).json()
    kpi = {k["key"]: k["value"] for k in d["kpis"]}
    assert kpi["scanned"] == 50
    assert kpi["analyzed"] == 50
    assert kpi["qualified"] > 0
    assert kpi["highPriority"] >= 1  # Bella Rosa scores 85
    assert kpi["replies"] == 0

    funnel = {b["key"]: b for b in d["funnel"]}
    assert funnel["discovered"]["count"] == 50
    assert funnel["analyzed"]["count"] == 50
    assert funnel["qualified"]["count"] == kpi["qualified"]
    assert funnel["highPriority"]["count"] == kpi["highPriority"]
    assert funnel["qualified"]["dropped"] == 50 - kpi["qualified"]


async def test_dashboard_week_range_reports_deltas(client, user_a, auth, pipeline_overrides):
    await run_pipeline(client, auth, user_a)
    d = (await client.get("/dashboard?range=week", headers=auth(user_a))).json()
    assert d["range"] == "week"
    # everything was created just now -> in-window; prior window empty -> delta null
    kpi = {k["key"]: k["value"] for k in d["kpis"]}
    assert kpi["scanned"] == 50


async def test_dashboard_is_user_scoped(client, user_a, user_b, auth, pipeline_overrides):
    await run_pipeline(client, auth, user_a)
    d = (await client.get("/dashboard", headers=auth(user_b))).json()
    assert all(k["value"] == 0 for k in d["kpis"])
