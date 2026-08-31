"""Read-only outreach-message endpoints (Milestone 2 isolation surface only).
Nothing sends. Isolation is enforced by RLS, not Python."""

from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from backend.api.deps import CurrentUser, DbSession
from backend.models import OutreachMessage
from backend.schemas.read import OutreachRead

router = APIRouter(tags=["outreach"])


@router.get("/outreach", response_model=list[OutreachRead])
async def list_outreach(user: CurrentUser, db: DbSession) -> list[OutreachMessage]:
    rows = await db.execute(
        select(OutreachMessage).order_by(OutreachMessage.created_at.desc())
    )
    return list(rows.scalars().all())


@router.get("/outreach/{message_id}", response_model=OutreachRead)
async def get_outreach(
    message_id: UUID, user: CurrentUser, db: DbSession
) -> OutreachMessage:
    message = await db.get(OutreachMessage, message_id)
    if message is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Not found")
    return message
