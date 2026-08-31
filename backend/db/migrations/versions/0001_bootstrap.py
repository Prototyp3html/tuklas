"""bootstrap: tuklas_app role, default grants, app_current_user_id()

Revision ID: 0001
Revises:
Create Date: 2026-08-31 17:14:19.020624

The app and the test suite connect as ``tuklas_app`` (NOSUPERUSER NOBYPASSRLS) so
the RLS policies from migration 0003 actually constrain them — a superuser
bypasses RLS unconditionally and ``FORCE ROW LEVEL SECURITY`` does not stop that.
The role is created here rather than in a ``docker-entrypoint-initdb.d`` script
(those run only on a fresh volume, so CI / host test DB / existing pgdata would
diverge).

``ALTER DEFAULT PRIVILEGES`` only affects objects created *after* it runs, so it
must precede 0002. An explicit ``GRANT ... ON ALL TABLES`` also runs at the end
of 0003 to cover the case where a different superuser owns the tables.

TODO (Milestone 13): source the tuklas_app password from a secret and rotate it
before any non-local deploy.
"""

from collections.abc import Sequence

from alembic import op

revision: str = "0001"
down_revision: str | Sequence[str] | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

APP_ROLE = "tuklas_app"
OWNER_ROLE = "tuklas"  # the superuser Alembic connects as (migration_database_url)


def upgrade() -> None:
    op.execute(
        f"""
        DO $$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = '{APP_ROLE}') THEN
                CREATE ROLE {APP_ROLE} LOGIN PASSWORD '{APP_ROLE}'
                    NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS;
            END IF;
        END
        $$;
        """
    )
    op.execute(f"GRANT USAGE ON SCHEMA public TO {APP_ROLE}")
    op.execute(
        f"ALTER DEFAULT PRIVILEGES FOR ROLE {OWNER_ROLE} IN SCHEMA public "
        f"GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO {APP_ROLE}"
    )
    op.execute(
        f"ALTER DEFAULT PRIVILEGES FOR ROLE {OWNER_ROLE} IN SCHEMA public "
        f"GRANT USAGE, SELECT ON SEQUENCES TO {APP_ROLE}"
    )

    # Fail-closed: an unset GUC -> NULL, and `user_id = NULL` is not TRUE, so a
    # forgotten scope call yields empty result sets, never a cross-tenant leak.
    op.execute(
        """
        CREATE OR REPLACE FUNCTION app_current_user_id() RETURNS uuid
        LANGUAGE sql STABLE AS $$
            SELECT NULLIF(current_setting('app.user_id', true), '')::uuid
        $$;
        """
    )


def downgrade() -> None:
    op.execute("DROP FUNCTION IF EXISTS app_current_user_id()")
    op.execute(
        f"ALTER DEFAULT PRIVILEGES FOR ROLE {OWNER_ROLE} IN SCHEMA public "
        f"REVOKE SELECT, INSERT, UPDATE, DELETE ON TABLES FROM {APP_ROLE}"
    )
    op.execute(
        f"ALTER DEFAULT PRIVILEGES FOR ROLE {OWNER_ROLE} IN SCHEMA public "
        f"REVOKE USAGE, SELECT ON SEQUENCES FROM {APP_ROLE}"
    )
    op.execute(f"REVOKE USAGE ON SCHEMA public FROM {APP_ROLE}")
    op.execute(
        f"REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM {APP_ROLE}"
    )
    op.execute(
        f"REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public FROM {APP_ROLE}"
    )
    op.execute(f"DROP ROLE IF EXISTS {APP_ROLE}")
