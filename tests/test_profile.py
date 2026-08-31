from httpx import AsyncClient

FULL = {
    "services": ["Website", "SEO"],
    "targetIndustries": ["salon", "resto"],
    "targetLocations": ["Zamboanga City", "Pagadian"],
    "priceRangeMin": 15000,
    "priceRangeMax": 60000,
    "icpNotes": "Owner-operated, 1-3 branches.",
}


async def test_get_profile_before_write_returns_defaults(client, auth, user_a) -> None:
    r = await client.get("/me/profile", headers=auth(user_a))
    assert r.status_code == 200
    body = r.json()
    assert body["email"] == user_a["email"]
    assert body["services"] == []
    assert body["priceRangeMin"] == 0
    assert body["icpNotes"] == ""


async def test_put_creates_then_get_returns_it(client, auth, user_a) -> None:
    put = await client.put("/me/profile", json=FULL, headers=auth(user_a))
    assert put.status_code == 200
    assert put.json()["services"] == ["Website", "SEO"]

    got = await client.get("/me/profile", headers=auth(user_a))
    assert got.json()["targetLocations"] == ["Zamboanga City", "Pagadian"]
    assert got.json()["priceRangeMax"] == 60000


async def test_second_put_replaces_and_arrays_can_shrink(client, auth, user_a) -> None:
    await client.put("/me/profile", json=FULL, headers=auth(user_a))
    smaller = {**FULL, "services": ["Website"], "targetIndustries": []}
    await client.put("/me/profile", json=smaller, headers=auth(user_a))
    got = (await client.get("/me/profile", headers=auth(user_a))).json()
    assert got["services"] == ["Website"]
    assert got["targetIndustries"] == []


async def test_unauthenticated_put_is_401(client: AsyncClient) -> None:
    r = await client.put("/me/profile", json=FULL)
    assert r.status_code == 401


async def test_one_users_write_does_not_touch_another(client, auth, user_a, user_b) -> None:
    await client.put("/me/profile", json=FULL, headers=auth(user_a))
    await client.put(
        "/me/profile",
        json={**FULL, "icpNotes": "user B's notes"},
        headers=auth(user_b),
    )
    a = (await client.get("/me/profile", headers=auth(user_a))).json()
    assert a["icpNotes"] == "Owner-operated, 1-3 branches."
