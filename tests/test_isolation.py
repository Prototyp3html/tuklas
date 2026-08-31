"""The Milestone 2 gate: user A cannot read user B's data, and it is Postgres RLS
— not an app-layer `WHERE user_id` — that stops it (see backend/api/leads.py)."""

import pytest

from tests.factories import (
    create_agent_run,
    create_business,
    create_campaign,
    create_outreach_message,
)

# (detail path, factory) — factory(user) -> object with `.id`
CASES = {
    "leads": ("/leads/{id}", create_business),
    "campaigns": ("/campaigns/{id}", create_campaign),
    "messages": ("/outreach/{id}", create_outreach_message),
    "agent_runs": ("/agent-runs/{id}", create_agent_run),
}


async def test_user_cannot_read_other_users_leads(client, auth, user_a, user_b) -> None:
    b = await create_business(user_a, name="ABC Salon")
    r = await client.get(f"/leads/{b.id}", headers=auth(user_b))
    assert r.status_code in (403, 404)


@pytest.mark.parametrize("case", list(CASES), ids=list(CASES))
async def test_user_cannot_read_other_users_detail(client, auth, user_a, user_b, case) -> None:
    path, factory = CASES[case]
    owned = await factory(user_a)
    r = await client.get(path.format(id=owned.id), headers=auth(user_b))
    assert r.status_code in (403, 404)
    # ...and the owner still can
    assert (await client.get(path.format(id=owned.id), headers=auth(user_a))).status_code == 200


@pytest.mark.parametrize(
    "list_path,factory",
    [
        ("/leads", create_business),
        ("/campaigns", create_campaign),
        ("/outreach", create_outreach_message),
        ("/agent-runs", create_agent_run),
    ],
)
async def test_list_endpoints_only_return_own_rows(
    client, auth, user_a, user_b, list_path, factory
) -> None:
    mine = await factory(user_a)
    theirs = await factory(user_b)

    rows = (await client.get(list_path, headers=auth(user_a))).json()
    ids = {row["id"] for row in rows}
    assert str(mine.id) in ids
    assert str(theirs.id) not in ids


@pytest.mark.parametrize(
    "path", ["/leads", "/campaigns", "/outreach", "/agent-runs", "/me", "/me/profile"]
)
async def test_unauthenticated_access_is_401(client, path) -> None:
    assert (await client.get(path)).status_code == 401
