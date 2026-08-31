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

Milestone 1 — skeleton. Frontend design system + route scaffold in place; screens not built yet.
