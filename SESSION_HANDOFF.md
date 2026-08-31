# Session handoff — backend setup

> **Purpose:** this file carries context across a project-directory move + a fresh Claude Code
> session. After moving the repo and reopening Claude Code in the new location, tell it:
> *"Read SESSION_HANDOFF.md and pick up the backend work."*
> Delete this file once the backend Milestone 1+2 work is merged.

_Written 2026-08-31._

---

## Where things stand

- **Frontend** — done and committed. The marketing landing was fully rebuilt this session
  (cartography/exploration theme, topographic-line + compass-rose motif, serif headings, a
  pinned hero that recedes via a CSS `view-timeline` scroll-driven animation, an animated
  "scroll to discover" cue, and a redesigned scroll-driven "How TUKLAS works" surveyed-route
  section). `npm run lint` and `npm run build` are clean. Committed as `ee61583 hero and scroll
  animations`, pushed to `origin/main`. **Working tree is clean.**
- **Backend** — untouched scaffold. 249 lines of Python, almost all docstring-only stubs marked
  `TODO (Milestone N)`. Only `GET /health` runs. This is the next job.

## The next job: backend Milestones 1 + 2

**Full plan:** `C:\Users\Jones Ivan Sevilla\.claude\plans\now-that-we-have-misty-wand.md`
(that path is in the user profile, not the repo — it survives the move. If it's gone, the
condensed version below plus `docs/BUILD_GUIDE.md` Milestones 1–2 is enough to reconstruct it.)

**Scope, agreed with the user:**
1. Milestone 1 (skeleton + JWT auth) **and** Milestone 2 (full 16-table schema + Postgres
   row-level-security user isolation) together.
2. Target the guide's `docker compose up` path — the user is installing Docker Desktop.
3. **Backend only.** Do not touch the frontend. Verify via FastAPI `/docs`, curl, and pytest.

**Scope fence** (`BUILD_GUIDE.md:463` — "Do not implement campaigns, agents, or any later
phase"): create all 16 tables, but no campaign logic, no discovery/scraping, no LLM calls, no
Celery tasks. Routes are limited to auth, profile CRUD, and read-only `GET` list/detail for
leads/campaigns/outreach/agent-runs that exist *only* so the four required isolation tests are
real.

### Decisions locked in (do not re-litigate)

| Area | Decision | Why |
|---|---|---|
| uv project root | **Repo root**, not `backend/` | `pyproject.toml` + `tests/` are at root; `backend/` is a plain package |
| Python | `uv python pin 3.12` before first `uv sync` | machine has 3.14.3; asyncpg/playwright/sklearn cp314 wheels lag |
| Imports | Convert 3 bare imports to `backend.`-prefixed | `backend/queue/` **shadows the stdlib `queue` module** — confirmed, breaks Celery |
| Password hashing | **`bcrypt` directly**, drop `passlib` | passlib 1.7.4 raises `AttributeError: ... '__about__'` vs bcrypt 4.x/5.x |
| JWT | **`PyJWT`**, drop `python-jose` | jose barely maintained (CVE-2024-33663/4); only need HS256 |
| Missing dep | add **`email-validator`** | `EmailStr` ImportErrors without it |
| SQLAlchemy | `sqlalchemy[asyncio]` extra | pulls `greenlet`, required by the async ORM |
| DB roles | **Two roles.** `tuklas` (superuser, table owner) = Alembic only. `tuklas_app` (`NOSUPERUSER NOBYPASSRLS`, not owner) = app + tests | **superusers bypass RLS unconditionally** — `FORCE ROW LEVEL SECURITY` does not stop them; the compose `tuklas` user is a superuser |
| `users` table | **Excluded from RLS** | register inserts + login looks-up-by-email before any identity exists; no policy can express that. `users` holds only id/email/hash/timestamps and no route ever looks a user up by anything but the token `sub` |
| RLS context | `SELECT set_config('app.user_id', :uid, true)` (function form — `SET LOCAL` can't take a bind param) + an `@event.listens_for(Session, "after_begin")` listener to re-apply it after every `COMMIT` | `SET LOCAL` is lost at commit — a certainty to bite in M3+ |
| RLS helper | `app_current_user_id()` returns `NULL` when the GUC is unset → `user_id = NULL` is not TRUE → **fail-closed** | a forgotten scope call yields empty result sets, never a leak |
| Denormalized `user_id` | Put a flat `user_id` on transitively-owned tables (`business_evidence`, `digital_audits`, …); make it undriftable with parent `UNIQUE (id, user_id)` + child composite FK `(parent_id, user_id)` | every RLS policy becomes the identical one-liner; DB rejects a child stamped with the wrong user |
| Enums | `sa.Enum(PyEnum, native_enum=False)` → `VARCHAR + CHECK` | autogenerate can't see native-enum value changes; these lists churn M3–M9 |
| PKs | UUID (`gen_random_uuid()`, core in PG16 — no `pgcrypto`) | M7 needs `list[UUID]`; slugs would collide across users |
| Token transport | **`Authorization: Bearer` header** (not cookie) | guide's test uses `headers=auth(...)`; `frontend/lib/api.ts` is a plain fetch; `/docs` Authorize works |
| Route prefix | **No `/api/v1`** — but mount routers as `prefix=settings.api_prefix` so it's a 1-env-var change later | guide's test hits `/leads/{id}` literally; no external consumer |
| Casing | `CamelModel` base; responses serialize camelCase to match `frontend/lib/types.ts` | eventual `openapi-typescript` regen is then a no-op diff |
| Tests | Real Postgres `tuklas_test` DB; **TRUNCATE per test, not rollback** | rollback-per-test reverts `set_config` and turns the app's `commit()` into a savepoint release — makes the SET-LOCAL-after-commit bug undetectable |
| httpx | `AsyncClient(transport=ASGITransport(app=app))` | `AsyncClient(app=app)` was removed in httpx 0.28 |

### Implementation order (each step ends runnable)

1. Bootstrap: `uv python pin 3.12`; edit `pyproject.toml` (dep swaps, `[tool.uv] package = false`,
   pytest/ruff config); `uv lock` (commit `uv.lock`); `uv sync --all-groups`.
2. Import migration: 3 bare imports → `backend.*`; comment in `backend/queue/__init__.py`.
3. `backend/config.py`: add `migration_database_url`, `cors_origins` (+ comma-split property),
   `api_prefix`, `bcrypt_rounds`, `environment`, a JWT-secret boot guard; make `env_file` an
   absolute path off `__file__`. Update `.env.example`; `cp .env.example .env`.
4. `backend/models/`: split into `enums.py`, `base.py` (`Base`, `TimestampMixin`,
   `UserOwnedMixin`), `tables.py` (16 tables), `__init__.py` (re-export). Mirror the enums in
   `frontend/lib/types.ts`. Four required indexes: `ix_businesses_user_id`,
   `(campaign_id, score DESC)` on `lead_scores`, `(campaign_id, started_at)` on `agent_runs`,
   `campaign_leads(campaign_id)` (satisfied by the composite PK — note in a migration comment).
5. Alembic: `alembic init -t async backend/db/migrations`; `alembic.ini` at repo root; async
   `env.py` reading `settings.migration_database_url` + `backend.models.Base`. Three revisions:
   `0001_bootstrap` (create `tuklas_app` role, grants, `ALTER DEFAULT PRIVILEGES`,
   `app_current_user_id()`), `0002_initial_schema` (autogenerate + review), `0003_row_level_security`
   (hand-written `op.execute` loop: `ENABLE` + `FORCE` RLS + `CREATE POLICY ... FOR ALL TO
   tuklas_app USING (user_id = app_current_user_id()) WITH CHECK (...)` on all 14 data tables;
   `users` intentionally absent — justify in the docstring).
6. `backend/core/security.py` (bcrypt + PyJWT; `DUMMY_PASSWORD_HASH` to kill the login timing
   oracle; `str(subject)` for `sub`). `backend/db/session.py` (async engine, `get_db`,
   `set_rls_user`, the `after_begin` listener).
7. `backend/schemas/base.py` (`CamelModel`), `schemas/user.py`, `api/auth.py`
   (`/auth/register` 201/409, `/auth/login` JSON 200/401 with identical body+timing for
   unknown-email vs wrong-password, `/auth/token` for `/docs`, `/me`), `api/deps.py`
   (`get_current_user` → decode JWT → load user → `set_rls_user`). Mount routers + CORS +
   lifespan in `main.py`. **→ Milestone 1 done; verify at `/docs`.**
8. `Dockerfile` (repo-root context, `python:3.12-slim-bookworm`, uv, targets `dev`/`runtime`,
   no `playwright install`). Rewrite `docker-compose.yml`: postgres+redis healthchecks with
   `depends_on: condition: service_healthy`; a one-shot `migrate` service
   (`alembic upgrade head`); `api` `depends_on` migrate `service_completed_successfully`;
   **start `worker`** (task-less, proves broker); volume mounts `./backend`, `./tests`,
   `./alembic.ini` **only — never `- .:/app`**; `WATCHFILES_FORCE_POLLING: "true"`;
   `environment:` block overriding hosts to `@postgres:5432` and the two roles.
9. Tests pass 1: `tests/conftest.py` (set `DATABASE_URL`→test DB + `BCRYPT_ROUNDS=4` *before*
   importing `backend`; sync session-scoped DB-create + `alembic upgrade`; function-scoped
   NullPool engine + TRUNCATE teardown), `tests/factories.py`, `test_health.py`, `test_auth.py`,
   `test_ssrf.py`.
10. M2 routes: `api/profile.py` (`GET`/`PUT /me/profile`, upsert — registration must NOT create
    the profile row, RLS would reject it), minimal read routers.
11. `test_profile.py`, `test_isolation.py` (the 4 the guide demands: leads/campaigns/messages/
    agent-runs, `assert status in (403, 404)`), `test_rls.py` (**DB-level** — `tuklas_app`
    `rolsuper=false, rolbypassrls=false` is the assertion that stops all of M2 becoming a
    no-op; every user-owned table has `relrowsecurity AND relforcerowsecurity` + a policy;
    unset GUC → 0 rows; `WITH CHECK` rejects cross-user insert; composite FK rejects cross-user
    child). **→ Milestone 2 gate.**
12. `.github/workflows/ci.yml`: `postgres:16` service (superuser `tuklas`), `uv sync --frozen`,
    `ruff check`, `alembic upgrade head && alembic downgrade base`, `pytest`.
13. Append `docs/DECISIONS.md` (all the decisions in the table above), update
    `docs/ARCHITECTURE.md` drift section + README status line.

### M1 / M2 done-when

- **M1:** `docker compose up` → `curl -X POST /auth/register` (201), again (409), `/auth/login`
  → token, `curl /me -H "Authorization: Bearer $TOKEN"` returns your email; `/me` without token
  → 401; `docker compose logs worker | grep ready`.
- **M2:** 16 tables in `\dt`; `pg_class` shows 14 tables `relrowsecurity/relforcerowsecurity =
  t/t` and `users = f/f`; `tuklas_app` `rolsuper/rolbypassrls = f/f`;
  `test_user_cannot_read_other_users_{leads,campaigns,messages,agent_runs}` and all of
  `test_rls.py` pass; CI green on a pushed branch.

### Top risks

1. App connecting as superuser → RLS silently inert. `test_rls.py` role assertion guards it.
2. `SET LOCAL` lost after `COMMIT` (M3+). `after_begin` listener + TRUNCATE-per-test.
3. Volume `- .:/app` shadows the container `.venv` → `uvicorn: not found`. Mount narrowly.
4. `AsyncClient(app=app)` removed in httpx 0.28 → `ASGITransport`.
5. Autogenerate is blind to RLS/policies/roles/enum-values → future tables ship without RLS;
   `test_rls.py` catches it.
6. Python 3.14 vs asyncpg — pin 3.12 *before* first `uv sync`.
7. Windows path / MAX_PATH after `.venv\Lib\site-packages\...` — the repo move to `C:\dev\tuklas`
   is partly for this.

---

## Why the repo is being moved

From `C:\Users\Jones Ivan Sevilla\OneDrive\Desktop\Projects 2\BusinessStartup`
to **`C:\dev\tuklas`**.

- `Desktop` is inside **OneDrive** (Known Folder Move) — so `node_modules` (619 MB), `.next`
  (205 MB), and a future `.venv` all get sync-churned. Files-On-Demand can dehydrate a `.pyd`
  or `.venv` file mid-import → errors that look impossible. Docker bind mounts over OneDrive
  reparse points fail oddly. This session already hit `EPERM` from OneDrive locking `.next`.
- Space in `Projects 2` complicates Docker / shell tooling.
- Short path leaves MAX_PATH headroom.

`C:\Users\Jones Ivan Sevilla\` still has a space (uv's cache, managed Python) — that's fine,
the toolchain handles it.

## Move procedure

The tree is clean and pushed, so the cleanest move is a **fresh clone** (no 824 MB copy, no
OneDrive placeholder cruft):

```powershell
# 1. commit + push this handoff file first (from the OLD location)
cd "C:\Users\Jones Ivan Sevilla\OneDrive\Desktop\Projects 2\BusinessStartup"
git add SESSION_HANDOFF.md
git commit -m "Add session handoff notes for backend setup"
git push

# 2. close Claude Code and any editors/terminals on the old path

# 3. clone into the new home
New-Item -ItemType Directory C:\dev -Force
git clone https://github.com/Prototyp3html/tuklas.git C:\dev\tuklas

# 4. reinstall frontend deps in the new location
cd C:\dev\tuklas\frontend
npm install

# 5. (after verifying C:\dev\tuklas is good) delete the old OneDrive copy
Remove-Item -Recurse -Force "C:\Users\Jones Ivan Sevilla\OneDrive\Desktop\Projects 2\BusinessStartup"

# 6. reopen Claude Code in C:\dev\tuklas and say:
#    "Read SESSION_HANDOFF.md and pick up the backend work."
```

If you'd rather **move** the folder than re-clone (keeps `node_modules`, any local `.env`):

```powershell
# close Claude Code + editors first
# in File Explorer: right-click BusinessStartup -> "Always keep on this device", wait for the green check

# optional: drop the regenerable heavy dirs so the move is fast
Remove-Item -Recurse -Force "C:\Users\Jones Ivan Sevilla\OneDrive\Desktop\Projects 2\BusinessStartup\frontend\node_modules"
Remove-Item -Recurse -Force "C:\Users\Jones Ivan Sevilla\OneDrive\Desktop\Projects 2\BusinessStartup\frontend\.next"

New-Item -ItemType Directory C:\dev -Force
Move-Item "C:\Users\Jones Ivan Sevilla\OneDrive\Desktop\Projects 2\BusinessStartup" C:\dev\tuklas

cd C:\dev\tuklas\frontend
npm install    # only if you deleted node_modules
```

---

## Environment facts (verified this session)

- OS: Windows 11. Shell: PowerShell 5.1 + Git Bash.
- Python **3.14.3** on PATH (`C:\Python314`), plus the `py` launcher. **uv 0.12.5** installed.
- **Docker: not installed** — user is installing Docker Desktop (needs WSL2).
- Node 24.13.1, npm present.
- No `.env` exists yet (only `.env.example` + `frontend/.env.local.example`, both committed
  templates, no secrets).
- No `.venv`, no `uv.lock`, no `__pycache__` — backend has never been run.
- `pyproject.toml` at repo root: deps declared but **unpinned**, no `[build-system]`, PEP 735
  `[dependency-groups]` for dev, `[tool.pytest.ini_options] asyncio_mode = "auto"`,
  ruff line-length 100 / target py312.
- Git: branch `main`, clean, in sync with `origin/main`
  (`https://github.com/Prototyp3html/tuklas.git`). Commits: `ee61583` (landing animations),
  `bb7127b` (landing structure), `0cc38c6` (initial).

## Cross-cutting project rules (from earlier in the build)

- Marketing landing lives entirely under a `.tuklas-lp` CSS scope so the product app design
  system is untouched. Landing numbers stay illustrative and labelled as such.
- Pilot cities are **Zamboanga City & Pagadian** (not the reference mockup's "CDO & Iligan").
  Fixtures use Zamboanga City; landline area code `+63 62`.
- `BUILD_GUIDE.md` Milestone 10: never expose model chain-of-thought in the UI — tool calls and
  decisions only.
- Commit/push only when the user asks.
- `.gitignore` covers `.env*`, `node_modules/`, `.next/`, `__pycache__/`, `.venv/`,
  `.pytest_cache/`, `.ruff_cache/`, `data/labeled/*` (except `.gitkeep`).
- App design tokens (post-retheme): warm paper `#faf8f5`, forest `#1f4a38` = action/verified,
  amber `#9c5d1f` = opportunity, `#b68235` = the logo compass needle only. Typography: Archivo +
  DM Mono (app), Cormorant Garamond (wordmark), Newsreader + Cormorant (landing).
