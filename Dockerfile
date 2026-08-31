# syntax=docker/dockerfile:1
# Repo root is the build context. backend/ is imported as `backend.*` (never with
# backend/ on sys.path — that shadows the stdlib `queue` module). No
# `playwright install` — browsers + libs are ~700 MB; added in Milestone 3.

FROM python:3.12-slim-bookworm AS base
COPY --from=ghcr.io/astral-sh/uv:0.12 /uv /uvx /bin/
ENV UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    UV_PROJECT_ENVIRONMENT=/app/.venv \
    PATH="/app/.venv/bin:$PATH"
WORKDIR /app
COPY pyproject.toml uv.lock .python-version ./
RUN useradd --create-home app

# ---- dev: full deps + tests, for the api / worker / migrate services ----
FROM base AS dev
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --all-groups --no-install-project
COPY backend ./backend
COPY tests ./tests
COPY alembic.ini ./
RUN chown -R app /app
USER app

# ---- runtime: no dev deps, no tests ----
FROM base AS runtime
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --no-dev --no-install-project
COPY backend ./backend
COPY alembic.ini ./
RUN chown -R app /app
USER app
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
