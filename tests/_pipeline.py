"""Plain helpers for the Milestone 8 API tests (not a test module).

The `pipeline_overrides` fixture and `fake_fetch` live in `conftest.py`; these are
just HTTP-driving helpers the test modules import directly.
"""

from __future__ import annotations


async def make_campaign(client, auth, user) -> str:
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
    return r.json()["id"]


async def run_pipeline(client, auth, user) -> str:
    cid = await make_campaign(client, auth, user)
    r = await client.post(f"/campaigns/{cid}/run", headers=auth(user))
    assert r.status_code == 200, r.text
    return cid


async def bella_id(client, auth, user) -> str:
    leads = (await client.get("/leads", headers=auth(user))).json()
    return next(lead["id"] for lead in leads if lead["businessName"] == "Bella Rosa Salon")
