"""Row factories for the isolation tests.

Each writes through an app-role (`tuklas_app`) session scoped to `user` — so the
insert passes through the RLS `WITH CHECK` policy exactly as the app would, and a
broken policy fails the factory, not just an assertion.
"""

from __future__ import annotations

import os
from contextlib import asynccontextmanager
from types import SimpleNamespace

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool

from backend.models import (
    AgentRun,
    Business,
    Campaign,
    CampaignLead,
    OutreachMessage,
)

User = dict[str, str]

engine = create_async_engine(os.environ["DATABASE_URL"], poolclass=NullPool)
_Session = async_sessionmaker(engine, expire_on_commit=False)


@asynccontextmanager
async def _scoped(user: User):
    session: AsyncSession = _Session()
    session.info["rls_user_id"] = str(user["id"])
    await session.execute(text("SELECT 1"))  # begin -> after_begin listener scopes it
    try:
        yield session
    finally:
        await session.close()


def _norm(name: str) -> str:
    return " ".join(name.lower().split())


async def create_business(user: User, *, name: str = "ABC Salon", **extra) -> SimpleNamespace:
    async with _scoped(user) as s:
        row = Business(
            user_id=user["id"], name=name, normalized_name=_norm(name), **extra
        )
        s.add(row)
        await s.commit()
        return SimpleNamespace(id=row.id, user_id=row.user_id, name=row.name)


async def create_campaign(
    user: User, *, name: str = "Zamboanga salons", service: str = "Website"
) -> SimpleNamespace:
    async with _scoped(user) as s:
        row = Campaign(
            user_id=user["id"],
            name=name,
            service=service,
            location="Zamboanga City",
        )
        s.add(row)
        await s.commit()
        return SimpleNamespace(id=row.id, user_id=row.user_id, name=row.name)


async def create_campaign_lead(user: User, *, campaign=None, business=None) -> SimpleNamespace:
    campaign = campaign or await create_campaign(user)
    business = business or await create_business(user)
    async with _scoped(user) as s:
        row = CampaignLead(
            user_id=user["id"], campaign_id=campaign.id, business_id=business.id
        )
        s.add(row)
        await s.commit()
        return SimpleNamespace(campaign_id=campaign.id, business_id=business.id)


async def create_outreach_message(user: User, *, business=None) -> SimpleNamespace:
    business = business or await create_business(user)
    async with _scoped(user) as s:
        row = OutreachMessage(
            user_id=user["id"],
            business_id=business.id,
            channel="email",
            subject="Quick idea for your salon",
            draft="Hi — noticed you don't have online booking...",
        )
        s.add(row)
        await s.commit()
        return SimpleNamespace(id=row.id, business_id=business.id)


async def create_agent_run(user: User, *, campaign=None) -> SimpleNamespace:
    campaign = campaign or await create_campaign(user)
    async with _scoped(user) as s:
        row = AgentRun(
            user_id=user["id"], campaign_id=campaign.id, agent="discovery", status="queued"
        )
        s.add(row)
        await s.commit()
        return SimpleNamespace(id=row.id, campaign_id=campaign.id)
