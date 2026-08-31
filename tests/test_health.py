from httpx import AsyncClient


async def test_health_is_db_free(client: AsyncClient) -> None:
    r = await client.get("/health")
    assert r.status_code == 200
    assert r.json() == {"status": "ok"}


async def test_health_db(client: AsyncClient) -> None:
    r = await client.get("/health/db")
    assert r.status_code == 200
    assert r.json() == {"status": "ok"}


async def test_openapi_lists_the_core_paths(client: AsyncClient) -> None:
    paths = (await client.get("/openapi.json")).json()["paths"]
    for expected in ("/auth/register", "/auth/login", "/me", "/me/profile", "/leads/{business_id}"):
        assert expected in paths, expected
