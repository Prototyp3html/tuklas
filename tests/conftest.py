"""Test harness.

DB isolation is **TRUNCATE per test**, not rollback-per-test: the nested-savepoint
pattern reverts `set_config(...)` and turns the app's real `commit()` into a
savepoint release, which would make the "SET LOCAL dies at COMMIT" bug in
backend/db/session.py structurally undetectable — and catching that is half of
why the RLS tests exist. Every test therefore runs the byte-for-byte production
code path.
"""

from __future__ import annotations

import asyncio
import os
import sys
from collections.abc import AsyncIterator, Awaitable, Callable
from pathlib import Path

# asyncpg + the Windows ProactorEventLoop crash at connection teardown under
# pytest-asyncio. The selector loop is fine. Set it for the sync `asyncio.run`
# below; the `event_loop_policy` fixture covers pytest-asyncio's own loop.
if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

# --- MUST run before `backend` is imported: backend.config builds `settings` at
#     module scope, and env vars outrank the .env file. Order-sensitive. ---------
_REPO_ROOT = Path(__file__).resolve().parent.parent

_TEST_DB_URL = os.environ.get(
    "TEST_DATABASE_URL",
    "postgresql+asyncpg://tuklas_app:tuklas_app@localhost:5432/tuklas_test",
)
_ADMIN_BASE = os.environ.get(
    "MIGRATION_DATABASE_URL",
    "postgresql+asyncpg://tuklas:tuklas@localhost:5432/tuklas",
)

os.environ["DATABASE_URL"] = _TEST_DB_URL
os.environ.setdefault("BCRYPT_ROUNDS", "4")  # rounds=12 is ~15s across the suite
os.environ.setdefault("JWT_SECRET", "pytest-secret-at-least-32-bytes-long!!")
os.environ.setdefault("ENVIRONMENT", "development")

import pytest  # noqa: E402
import pytest_asyncio  # noqa: E402
from httpx import ASGITransport, AsyncClient  # noqa: E402
from sqlalchemy import text  # noqa: E402
from sqlalchemy.engine import make_url  # noqa: E402
from sqlalchemy.ext.asyncio import (  # noqa: E402
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.pool import NullPool  # noqa: E402

_TEST_DB_NAME = make_url(_TEST_DB_URL).database


def _url(database: str) -> str:
    # render_as_string(hide_password=False) — plain str(URL) masks the password.
    return make_url(_ADMIN_BASE).set(database=database).render_as_string(hide_password=False)


# superuser creds, pointed at the test database / the maintenance database
_ADMIN_TEST_URL = _url(_TEST_DB_NAME)
_ADMIN_MAINT_URL = _url("postgres")
os.environ["MIGRATION_DATABASE_URL"] = _ADMIN_TEST_URL

import backend.db.session  # noqa: E402,F401  (registers the after_begin RLS listener)
from backend.models import Base  # noqa: E402,F401  (registers metadata)

_ALL_TABLES = ", ".join(sorted(Base.metadata.tables))


async def _recreate_test_db() -> None:
    engine = create_async_engine(_ADMIN_MAINT_URL, isolation_level="AUTOCOMMIT")
    try:
        async with engine.connect() as conn:
            await conn.execute(
                text(f'DROP DATABASE IF EXISTS "{_TEST_DB_NAME}" WITH (FORCE)')
            )
            await conn.execute(
                text(f'CREATE DATABASE "{_TEST_DB_NAME}" OWNER {make_url(_ADMIN_BASE).username}')
            )
    finally:
        await engine.dispose()


@pytest_asyncio.fixture(scope="session", autouse=True)
async def _dispose_app_engine() -> AsyncIterator[None]:
    """The app's module-level engine is used through the ASGI app in tests; close
    it on the session loop so teardown doesn't run against a closed loop."""
    yield
    await backend.db.session.engine.dispose()
    from tests import factories

    await factories.engine.dispose()


@pytest.fixture(scope="session", autouse=True)
def _database() -> None:
    """Drop + recreate `tuklas_test`, then `alembic upgrade head`. Synchronous on
    purpose — Alembic's async env.py calls `asyncio.run()` itself; driving it from
    a sync fixture sidesteps every pytest-asyncio loop-scope headache."""
    from alembic import command
    from alembic.config import Config

    asyncio.run(_recreate_test_db())
    cfg = Config(str(_REPO_ROOT / "alembic.ini"))
    command.upgrade(cfg, "head")


@pytest_asyncio.fixture(autouse=True)
async def _truncate() -> AsyncIterator[None]:
    """Clean slate after every test, as the table owner."""
    yield
    engine = create_async_engine(_ADMIN_TEST_URL, poolclass=NullPool)
    try:
        async with engine.begin() as conn:
            await conn.execute(
                text(f"TRUNCATE {_ALL_TABLES} RESTART IDENTITY CASCADE")
            )
    finally:
        await engine.dispose()


@pytest_asyncio.fixture
async def client() -> AsyncIterator[AsyncClient]:
    from backend.main import app

    transport = ASGITransport(app=app)  # AsyncClient(app=app) was removed in httpx 0.28
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c


User = dict[str, str]


async def _register(client: AsyncClient, email: str, password: str) -> User:
    r = await client.post("/auth/register", json={"email": email, "password": password})
    assert r.status_code == 201, r.text
    login = await client.post(
        "/auth/login", json={"email": email, "password": password}
    )
    assert login.status_code == 200, login.text
    return {
        "id": r.json()["id"],
        "email": email,
        "password": password,
        "token": login.json()["accessToken"],
    }


@pytest_asyncio.fixture
async def user_a(client: AsyncClient) -> User:
    return await _register(client, "user-a@example.com", "correct-horse-battery")


@pytest_asyncio.fixture
async def user_b(client: AsyncClient) -> User:
    return await _register(client, "user-b@example.com", "hunter2-hunter2-xyz")


@pytest.fixture
def auth() -> Callable[[User], dict[str, str]]:
    def _headers(user: User) -> dict[str, str]:
        return {"Authorization": f"Bearer {user['token']}"}

    return _headers


@pytest_asyncio.fixture
async def db_owner() -> AsyncIterator[AsyncSession]:
    """Superuser session — for pg_catalog introspection in test_rls.py."""
    engine = create_async_engine(_ADMIN_TEST_URL, poolclass=NullPool)
    maker = async_sessionmaker(engine, expire_on_commit=False)
    async with maker() as session:
        yield session
    await engine.dispose()


@pytest_asyncio.fixture
async def db_as() -> AsyncIterator[Callable[[User], Awaitable[AsyncSession]]]:
    """Factory: an app-role (`tuklas_app`) session scoped to `user` via the GUC —
    so writes through it hit the same RLS `WITH CHECK` the app does."""
    engine = create_async_engine(os.environ["DATABASE_URL"], poolclass=NullPool)
    maker = async_sessionmaker(engine, expire_on_commit=False)
    opened: list[AsyncSession] = []

    async def _open(user: User) -> AsyncSession:
        session = maker()
        session.info["rls_user_id"] = str(user["id"])
        await session.execute(text("SELECT 1"))  # force begin -> listener scopes it
        opened.append(session)
        return session

    yield _open

    for session in opened:
        await session.close()
    await engine.dispose()
