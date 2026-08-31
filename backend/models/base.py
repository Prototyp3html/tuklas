"""Declarative base, naming convention, and the ownership mixins.

`UserOwnedMixin` — directly owned rows: `user_id` FK -> `users.id` ON DELETE
CASCADE, indexed. `DenormUserMixin` — transitively owned rows: a flat `user_id`
column (no direct FK) kept undriftable by a composite FK to the parent's
`(id, user_id)`. Either way every RLS policy is the same one-liner
`user_id = app_current_user_id()`.
"""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, MetaData, Uuid, func, text
from sqlalchemy.orm import DeclarativeBase, Mapped, declared_attr, mapped_column

NAMING_CONVENTION = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_N_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
}


class Base(DeclarativeBase):
    metadata = MetaData(naming_convention=NAMING_CONVENTION)


def pk_uuid(**kw) -> Mapped[uuid.UUID]:
    """A UUID primary key defaulted by Postgres `gen_random_uuid()` (core in
    PG13+, no `pgcrypto` needed)."""
    return mapped_column(
        Uuid, primary_key=True, server_default=text("gen_random_uuid()"), **kw
    )


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class UserOwnedMixin(TimestampMixin):
    """Directly owned: real FK to `users`, indexed (`ix_<table>_user_id`)."""

    @declared_attr
    def user_id(cls) -> Mapped[uuid.UUID]:  # noqa: N805
        return mapped_column(
            Uuid,
            ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        )


class DenormUserMixin(TimestampMixin):
    """Transitively owned: denormalized `user_id`, indexed, no direct FK — a
    composite FK to the parent's `(id, user_id)` (declared on the table) keeps it
    honest, and the DB rejects a child stamped with the wrong user."""

    @declared_attr
    def user_id(cls) -> Mapped[uuid.UUID]:  # noqa: N805
        return mapped_column(Uuid, nullable=False, index=True)
