"""row-level security: ENABLE + FORCE RLS and a user-isolation policy per table

Revision ID: 0003
Revises: 0002
Create Date: 2026-08-31 17:14:26.000000

Every data table carries the *same* policy, made possible by the flat `user_id`
column on every one of them (denormalized onto transitively-owned tables, kept
honest by composite FKs — see backend/models/tables.py):

    USING      (user_id = app_current_user_id())
    WITH CHECK (user_id = app_current_user_id())

`users` is intentionally absent: registration inserts a `users` row and login
looks one up by email, both *before* any `app.user_id` identity exists — no
USING/WITH CHECK predicate can express that — and no route ever looks a user up
by anything except the token subject. `users` holds only id / email / hash /
is_admin / timestamps.

FORCE ROW LEVEL SECURITY closes the table-owner exemption too (defense in depth;
`tuklas_app` does not own the tables, but a future migration might reassign
ownership). Autogenerate is blind to policies/roles/grants, so
`tests/test_rls.py` is what keeps a future table from shipping without RLS.
"""

from collections.abc import Sequence

from alembic import op

from backend.models import USER_OWNED_TABLES

revision: str = "0003"
down_revision: str | Sequence[str] | None = "0002"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

APP_ROLE = "tuklas_app"


def upgrade() -> None:
    for table in USER_OWNED_TABLES:
        op.execute(f"ALTER TABLE {table} ENABLE ROW LEVEL SECURITY")
        op.execute(f"ALTER TABLE {table} FORCE ROW LEVEL SECURITY")
        op.execute(
            f"""
            CREATE POLICY {table}_user_isolation ON {table}
                FOR ALL TO {APP_ROLE}
                USING (user_id = app_current_user_id())
                WITH CHECK (user_id = app_current_user_id())
            """
        )

    # Explicit grant covering every table regardless of who owns it (0001's
    # ALTER DEFAULT PRIVILEGES only covers tables created by role `tuklas`).
    op.execute(
        f"GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public "
        f"TO {APP_ROLE}"
    )
    op.execute(
        f"GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO {APP_ROLE}"
    )


def downgrade() -> None:
    for table in USER_OWNED_TABLES:
        op.execute(f"DROP POLICY IF EXISTS {table}_user_isolation ON {table}")
        op.execute(f"ALTER TABLE {table} NO FORCE ROW LEVEL SECURITY")
        op.execute(f"ALTER TABLE {table} DISABLE ROW LEVEL SECURITY")
