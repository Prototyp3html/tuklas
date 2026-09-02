"""TUKLAS API application."""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from backend.api import agent_runs, audit, auth, campaigns, leads, outreach, profile
from backend.config import settings
from backend.db.session import SessionLocal, engine


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    await engine.dispose()


app = FastAPI(title="TUKLAS API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=False,  # Bearer header auth, not cookies
    allow_methods=["*"],
    allow_headers=["*"],
)

for _module in (auth, profile, leads, campaigns, outreach, agent_runs, audit):
    app.include_router(_module.router, prefix=settings.api_prefix)


@app.get("/health", tags=["health"])
async def health() -> dict[str, str]:
    """Liveness — no DB. Mounted off the api_prefix on purpose."""
    return {"status": "ok"}


@app.get("/health/db", tags=["health"])
async def health_db() -> dict[str, str]:
    async with SessionLocal() as session:
        await session.execute(text("SELECT 1"))
    return {"status": "ok"}
