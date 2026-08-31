# TUKLAS

AI lead intelligence for freelancers selling web services to local Philippine businesses.
Give it a service, an industry, and a location; get back qualified leads with cited evidence,
a recommended pitch, and a draft outreach message.

The full plan — architecture, milestones, cost model, UI/UX — is in
[`docs/BUILD_GUIDE.md`](docs/BUILD_GUIDE.md). Read Part 1 and Part 2 before touching code.

## Layout

| Path | What |
|---|---|
| `frontend/` | Next.js 15 + TypeScript + Tailwind + shadcn/ui |
| `backend/`  | FastAPI + Celery + SQLAlchemy (scaffolded; implemented milestone by milestone) |
| `docs/`     | Build guide, architecture notes, decisions, evaluation results |
| `scripts/`  | Evaluation and training scripts (Phase 12+) |
| `data/labeled/` | Hand-labeled evaluation dataset (git-ignored) |

## Status

Milestones 1–2 (backend) in progress on `backend-m1-m2`: FastAPI skeleton, JWT auth, the full
16-table schema, Alembic migrations, and Postgres row-level-security user isolation. Frontend
design system + route scaffold in place, built against fixtures; screens not wired to the API
yet.

### Backend dev setup

Needs a local PostgreSQL and `uv`. One-time:

```
uv sync --all-groups
cp .env.example .env
# create the roles/DBs (as your postgres superuser):
#   CREATE ROLE tuklas LOGIN SUPERUSER PASSWORD 'tuklas';
#   CREATE DATABASE tuklas OWNER tuklas;  CREATE DATABASE tuklas_test OWNER tuklas;
uv run alembic upgrade head        # also creates the tuklas_app role
uv run uvicorn backend.main:app --reload
uv run pytest -q
```
