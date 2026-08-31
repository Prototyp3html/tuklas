"""Async engine + session factory, and the Postgres RLS session-scoping helper.

The app connects as the non-superuser `tuklas_app` role (see config), so every
`SELECT`/`INSERT`/... is filtered by the RLS policies from migration 0003. A
session with no `app.user_id` GUC set sees zero rows on every data table
(fail-closed). `get_current_user` calls `set_rls_user` on the request-scoped
session before any route handler runs.
"""

from __future__ import annotations

from collections.abc import AsyncIterator
from uuid import UUID

from sqlalchemy import event, text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import Session

from backend.config import settings

engine = create_async_engine(settings.database_url, pool_pre_ping=True)
SessionLocal = async_sessionmaker(engine, expire_on_commit=False, autoflush=False)

_RLS_KEY = "rls_user_id"


async def get_db() -> AsyncIterator[AsyncSession]:
    """FastAPI dependency. Routes commit explicitly; this rolls back on an
    unhandled exception and always closes. FastAPI caches it per request, so the
    session `get_current_user` scopes is the same one the route receives."""
    session = SessionLocal()
    try:
        yield session
    except Exception:
        await session.rollback()
        raise
    finally:
        await session.close()


async def set_rls_user(session: AsyncSession, user_id: UUID) -> None:
    """Scope `session` to `user_id` for the rest of its life.

    `set_config(..., is_local => true)` is transaction-local, so a bind param is
    both safe (never f-string a token-derived value into SQL) and correct. The id
    is stashed in `session.info` so `_reapply_rls` can restore it after a COMMIT
    clears it — irrelevant for M1/M2's single-transaction routes, certain to bite
    from M3 on.
    """
    session.info[_RLS_KEY] = str(user_id)
    await session.execute(
        text("SELECT set_config('app.user_id', :uid, true)"), {"uid": str(user_id)}
    )


@event.listens_for(Session, "after_begin")
def _reapply_rls(session: Session, transaction: object, connection: object) -> None:
    uid = session.info.get(_RLS_KEY)
    if uid is not None:
        connection.execute(
            text("SELECT set_config('app.user_id', :uid, true)"), {"uid": uid}
        )
