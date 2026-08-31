"""DB-level proof that Postgres RLS — not Python — enforces tenant isolation.

If `tuklas_app` were a superuser (or `BYPASSRLS`), every policy would be inert
and all of Milestone 2 would pass for the wrong reason. The first test here is
the guard against that.
"""

import os

import pytest
from sqlalchemy import text
from sqlalchemy.exc import DBAPIError, IntegrityError, ProgrammingError
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.pool import NullPool

from backend.models import USER_OWNED_TABLES
from tests.factories import create_business, create_campaign

_RLS_ERRORS = (ProgrammingError, IntegrityError, DBAPIError)


async def test_app_role_is_not_superuser_and_not_bypassrls(db_owner) -> None:
    row = (
        await db_owner.execute(
            text("SELECT rolsuper, rolbypassrls FROM pg_roles WHERE rolname = 'tuklas_app'")
        )
    ).one()
    assert row.rolsuper is False
    assert row.rolbypassrls is False


async def test_app_role_owns_no_tables(db_owner) -> None:
    n = (
        await db_owner.execute(
            text(
                "SELECT count(*) FROM pg_tables "
                "WHERE schemaname = 'public' AND tableowner = 'tuklas_app'"
            )
        )
    ).scalar_one()
    assert n == 0


@pytest.mark.parametrize("table", USER_OWNED_TABLES)
async def test_table_has_forced_rls_and_a_complete_policy(db_owner, table: str) -> None:
    rel = (
        await db_owner.execute(
            text(
                "SELECT relrowsecurity, relforcerowsecurity FROM pg_class "
                "WHERE oid = ('public.' || :t)::regclass"
            ),
            {"t": table},
        )
    ).one()
    assert rel.relrowsecurity, f"{table}: RLS not enabled"
    assert rel.relforcerowsecurity, f"{table}: RLS not forced"

    policies = (
        await db_owner.execute(
            text(
                "SELECT qual, with_check FROM pg_policies "
                "WHERE schemaname = 'public' AND tablename = :t"
            ),
            {"t": table},
        )
    ).all()
    assert policies, f"{table}: no policy"
    assert all(p.qual and p.with_check for p in policies), f"{table}: policy missing USING/CHECK"


async def test_users_table_is_outside_rls(db_owner) -> None:
    enabled = (
        await db_owner.execute(
            text("SELECT relrowsecurity FROM pg_class WHERE oid = 'public.users'::regclass")
        )
    ).scalar_one()
    assert enabled is False
    n = (
        await db_owner.execute(
            text("SELECT count(*) FROM pg_policies WHERE tablename = 'users'")
        )
    ).scalar_one()
    assert n == 0


async def test_unscoped_session_is_fail_closed(user_a) -> None:
    await create_business(user_a, name="Fail-Closed Salon")
    engine = create_async_engine(os.environ["DATABASE_URL"], poolclass=NullPool)
    try:
        async with engine.connect() as conn:  # app role, no app.user_id GUC
            n = (await conn.execute(text("SELECT count(*) FROM businesses"))).scalar_one()
        assert n == 0
    finally:
        await engine.dispose()


async def test_scoped_session_sees_only_its_own_rows(db_as, user_a, user_b) -> None:
    await create_business(user_a, name="A Salon")
    await create_business(user_b, name="B Salon")
    session_b = await db_as(user_b)
    names = (await session_b.execute(text("SELECT name FROM businesses"))).scalars().all()
    assert names == ["B Salon"]


async def test_with_check_rejects_a_row_stamped_with_another_user(db_as, user_a, user_b) -> None:
    session_b = await db_as(user_b)
    with pytest.raises(_RLS_ERRORS):
        await session_b.execute(
            text(
                "INSERT INTO businesses (id, user_id, name, normalized_name) "
                "VALUES (gen_random_uuid(), :uid, 'x', 'x')"
            ),
            {"uid": str(user_a["id"])},
        )
        await session_b.commit()


async def test_composite_fk_rejects_a_cross_user_child(db_as, user_a, user_b) -> None:
    business_a = await create_business(user_a, name="A Biz")
    campaign_b = await create_campaign(user_b, name="B Camp")
    session_b = await db_as(user_b)
    with pytest.raises(_RLS_ERRORS):
        await session_b.execute(
            text(
                "INSERT INTO campaign_leads (campaign_id, business_id, user_id) "
                "VALUES (:c, :b, :u)"
            ),
            {"c": str(campaign_b.id), "b": str(business_a.id), "u": str(user_b["id"])},
        )
        await session_b.commit()
