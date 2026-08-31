# Architecture

Authoritative source is [`BUILD_GUIDE.md`](BUILD_GUIDE.md) Part 2 ("Complete architecture") —
system diagram, cost funnel, repository structure, the two pluggable interfaces
(`BusinessDataSource`, `LLMProvider`), the database schema, and the SSRF guard.

This file holds anything that drifts from the guide as the build progresses.

## Drift log

### Backend Milestones 1 + 2 (2026-08-31)

Full rationale in [`DECISIONS.md`](DECISIONS.md) — "Backend Milestones 1 + 2". Summary of
deviations from the guide's Part 2 / Part 3:

- **Auth libraries:** `bcrypt` + `pyjwt` directly, not `passlib` / `python-jose` (both broken
  or unmaintained against current versions).
- **Two DB roles:** `tuklas` (superuser, Alembic/DDL only) and `tuklas_app`
  (`NOSUPERUSER NOBYPASSRLS`, app + tests). The guide's compose used one superuser role, which
  would make RLS inert. `tuklas_app` is created in migration `0001`.
- **`users` table is excluded from RLS** (register/login predate any identity). The other 15
  tables get `ENABLE` + `FORCE` RLS with an identical `user_id = app_current_user_id()`
  policy.
- **Denormalized `user_id`** on transitively-owned tables + composite FKs to the parent's
  `(id, user_id)`, so every policy is one line and cross-user children are rejected by the DB.
- **Enums are `VARCHAR + CHECK`**, not native PG `ENUM`; values mirror `frontend/lib/types.ts`.
  Added a `ContactType` enum not yet in `types.ts`.
- **Schema columns** follow `frontend/lib/types.ts` where the guide's illustrative column list
  and the Milestone 6/7 Pydantic sketches disagree (e.g. `digital_audits.social_presence` /
  `mobile_friendly`, split `price_range_min` / `price_range_max`, `agent_runs.business_count`).
- **API:** Bearer-header tokens, no `/api/v1` prefix (mounted at `settings.api_prefix`),
  camelCase response bodies.
- **Local dev/verify runs against a native PostgreSQL 18** (Docker Desktop + WSL2 not
  available on the dev machine). `Dockerfile` / `docker-compose.yml` exist for CI parity and a
  later Docker session; CI uses a `postgres:18` service.
