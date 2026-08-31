from datetime import timedelta

import jwt
import pytest
from httpx import AsyncClient

from backend.config import settings
from backend.core.security import create_access_token

GOOD = {"email": "person@example.com", "password": "correct-horse-battery"}


async def test_register_returns_user_without_hash(client: AsyncClient) -> None:
    r = await client.post("/auth/register", json=GOOD)
    assert r.status_code == 201
    body = r.json()
    assert body["email"] == GOOD["email"]
    assert body["isAdmin"] is False
    assert "createdAt" in body
    assert "password" not in body and "passwordHash" not in body and "password_hash" not in body


async def test_register_duplicate_is_409(client: AsyncClient) -> None:
    await client.post("/auth/register", json=GOOD)
    r = await client.post("/auth/register", json=GOOD)
    assert r.status_code == 409


async def test_register_email_is_case_normalized(client: AsyncClient) -> None:
    await client.post("/auth/register", json={**GOOD, "email": "Person@Example.com"})
    r = await client.post("/auth/register", json={**GOOD, "email": "person@example.com"})
    assert r.status_code == 409


async def test_password_too_short_is_422(client: AsyncClient) -> None:
    r = await client.post("/auth/register", json={"email": "x@example.com", "password": "short"})
    assert r.status_code == 422


async def test_password_over_72_bytes_is_422_not_500(client: AsyncClient) -> None:
    r = await client.post(
        "/auth/register", json={"email": "x@example.com", "password": "a" * 73}
    )
    assert r.status_code == 422


async def test_login_token_subject_is_user_id(client: AsyncClient) -> None:
    reg = await client.post("/auth/register", json=GOOD)
    login = await client.post("/auth/login", json=GOOD)
    assert login.status_code == 200
    payload = jwt.decode(
        login.json()["accessToken"], settings.jwt_secret, algorithms=[settings.jwt_algorithm]
    )
    assert payload["sub"] == reg.json()["id"]


async def test_wrong_password_and_unknown_email_are_indistinguishable(client: AsyncClient) -> None:
    await client.post("/auth/register", json=GOOD)
    wrong_pw = await client.post("/auth/login", json={**GOOD, "password": "nope-nope-nope"})
    unknown = await client.post(
        "/auth/login", json={"email": "nobody@example.com", "password": "nope-nope-nope"}
    )
    assert wrong_pw.status_code == unknown.status_code == 401
    assert wrong_pw.json() == unknown.json()


@pytest.mark.parametrize(
    "header",
    [
        None,
        "Bearer garbage.token.value",
        "Bearer " + jwt.encode({"sub": "x"}, "the-wrong-secret", algorithm="HS256"),
    ],
)
async def test_me_rejects_bad_or_missing_token(client: AsyncClient, header: str | None) -> None:
    headers = {"Authorization": header} if header else {}
    r = await client.get("/me", headers=headers)
    assert r.status_code == 401


async def test_me_rejects_expired_token(client: AsyncClient) -> None:
    reg = await client.post("/auth/register", json=GOOD)
    stale = create_access_token(reg.json()["id"], expires_delta=timedelta(seconds=-5))
    r = await client.get("/me", headers={"Authorization": f"Bearer {stale}"})
    assert r.status_code == 401


async def test_me_returns_own_email(client: AsyncClient) -> None:
    await client.post("/auth/register", json=GOOD)
    token = (await client.post("/auth/login", json=GOOD)).json()["accessToken"]
    r = await client.get("/me", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    assert r.json()["email"] == GOOD["email"]
