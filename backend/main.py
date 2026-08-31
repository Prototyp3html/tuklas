"""FastAPI application entrypoint.

TODO (Milestone 1): mount routers from backend.api, add JWT auth, CORS for the frontend.
"""

from fastapi import FastAPI

app = FastAPI(title="TUKLAS API", version="0.1.0")


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}
