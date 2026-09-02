# Decisions

Why things were chosen. Append-only; each entry dated.

---

## 2026-08-31 — Python stack

**Decision:** FastAPI + Celery/Redis + PostgreSQL/SQLAlchemy 2 async + httpx/BS4/Playwright,
packaged with uv, per `BUILD_GUIDE.md` Part 2.

**Why:** ML and evaluation code (Phase 12+) lives in the same language as the app — no
microservice boundary, no model-serving hop. Pydantic v2 gives structured-output validation
for free.

---

## 2026-08-31 — Next.js latest instead of 14

**Decision:** Frontend scaffolded with `create-next-app@latest`, which currently produces
**Next.js 16** (App Router, React 19, Tailwind v4) rather than the Next.js 14 the guide names.

**Why:** The guide's version numbers are dated (it also references "Sonnet 4.6"). Node 24 is
installed; latest tooling is the sensible greenfield choice. Part 4's design-token and layout
guidance is version-independent and applies unchanged.

**Cost:** shadcn/ui on Tailwind v4 uses `@theme`/CSS-variable theming rather than the v3
`tailwind.config.js` palette; tokens are wired in `app/globals.css`.

---

## 2026-08-31 — shadcn `toast` → `sonner`

**Decision:** Use the `sonner` primitive for toasts.

**Why:** Current shadcn/ui CLI removed the standalone `toast` component named in the guide and
points to `sonner` as the replacement.

---

## 2026-08-31 — Frontend visual direction supersedes BUILD_GUIDE Part 4

**Decision:** Part 4's *reasoning* is kept in full. Its **palette and typefaces are replaced**
with a direction called "Greenbar ledger". `app/globals.css` is now authoritative; Part 4's
token block is superseded and should not be pasted into future design prompts.

| | Part 4 | Now |
|---|---|---|
| Ground | `#FAFAF8` warm cream | `#ECEFE8` pale cool green (ledger stock) |
| Accent | `#1E3A5F` navy | `#7B2D5E` plum (`--mark`) |
| Gap | `#C2410C` terracotta | `--mark` — gaps share the brand ink |
| Strength | `#1D7A5F` | `#2F6146` forest (`--verify`) |
| Score tiers | three colours | one hue: plum / ink / muted ink |
| Display | Instrument Serif | Archivo Expanded (`wdth` 120), tracked caps |
| Body | Inter | Archivo, normal width |
| Mono | JetBrains Mono | DM Mono |

**Why:** Part 4's combination — warm cream ground, high-contrast serif display, terracotta
accent — is the single most common look that AI design work defaults into. It reads as a
default rather than a choice, and it was picked without much reference to what TUKLAS is.

The replacement is grounded in the subject: a freelancer walking Divisoria recording what each
business has and doesn't have, and tallying it into a judgment. That is a **tally sheet**, so
the palette is columnar accounting stock and the lead page is built as a ledger whose weights
sum, visibly, to the score.

Two deliberate consequences:

- **`--mark` does double duty** across gaps, high-tier scores and primary actions. Not an
  oversight — all three point at where the money is. A missing website is the most valuable
  signal the system produces, so it carries the brand ink, and it is never red.
- **Display and body are one superfamily at two widths.** Archivo is variable on `wdth`, so the
  type contrast comes from width rather than from mixing families. The "dossier, not a CRM row"
  feeling Part 4 wanted from a serif is carried by tracked-out expanded caps instead.

**Kept from Part 4, unchanged:** evidence is the hero and score is the summary; a gap is money
so it must never read as an error; measured values in mono; ✓/✗ as text marks rather than
icons; source URLs as visible links; no chart on the lead page; the 375px / focus-ring /
reduced-motion / skeleton / empty-state quality floor.

---

## 2026-08-31 — Frontend built against typed fixtures

**Decision:** All 10 routes are built against `frontend/lib/mock-data.ts`, shaped to
`frontend/lib/types.ts`. No screen calls the API yet.

**Why:** The backend is still stubs, so there is no OpenAPI schema to generate types from.
Writing the contract first means `lib/types.ts` is the target the FastAPI schemas must satisfy
rather than a guess about them, and the screens are already built against the real shape.

**Open contract questions the backend still has to settle:** auth token transport (header vs
cookie), whether routes carry an `/api/v1` prefix (currently none), and whether the ledger
sums client-side or the API returns a reconciled total.

**Follow-up:** replace fixture reads with `api()` calls and regenerate `lib/types.ts` with
`openapi-typescript` once routes exist.

---

## 2026-08-31 — Marketing landing page + warm retheme (supersedes "Greenbar")

**Decision:** A dedicated marketing landing was built at `/` (route `app/page.tsx`,
components under `frontend/components/marketing/`), and the **whole product was rethemed** to
share its surface. The cool pale-green paper and the plum `--mark` from the "Greenbar ledger"
revision above are retired.

| | "Greenbar" (previous) | Now |
|---|---|---|
| Ground | `#ECEFE8` cool pale green | `#FAF8F5` warm off-white |
| Card | `#FBFCF9` | `#FFFFFF` |
| Band (ledger stripe) | `#E1E7DC` | `#F4EFE4` |
| Rule | `#CBD3C4` | `#E7E3DB` |
| Ink / muted | `#15191B` / `#5B6360` | `#1A1D1A` / `#6B6F69` |
| `--verify` (forest) | `#2F6146`, strengths only | `#1F4A38`, **primary action + strengths** |
| `--mark` | `#7B2D5E` plum — gaps + high tier + actions | `#9C5D1F` amber — gaps + opportunity + high tier |

**Why:** The plum did triple duty because one ink was carrying "where the money is" *and*
"do this". Splitting it is clearer: **forest = do this / this is solid** (buttons, the funnel,
a ✓, the active nav marker); **amber = here is the money** (a missing website, an opportunity
score, a high-tier lead). Amber is still never red — a gap is the reason to call, not a fault.
Warm off-white over cool green because the landing needed a warmer, more editorial surface and
the product should read as the same publication, not a different app.

**Typography:** unchanged in the product — Archivo (`wdth` 120 tracked caps for record
headings) + DM Mono. The landing runs its own editorial pair (Bricolage Grotesque + Newsreader
serif + DM Mono) scoped under `.tuklas-lp`; it is a deliberately distinct marketing voice.

**Mechanics:** all product colour still flows through the `:root` tokens in
`app/globals.css`, so the retheme was a token edit plus three component tweaks (funnel bars,
sidebar active state, mobile tab active — moved from `--mark` to `--verify`). The landing is
fully scoped under `.tuklas-lp` and shares no selectors with the app.

**Kept from every prior entry:** evidence is the hero; a gap must never read as an error;
measured values in mono; ✓/✗ as text marks; source URLs as visible links; no chart on the
lead page; the 375px / focus-ring / reduced-motion / skeleton / empty-state quality floor.

**Animation:** the landing's scroll effects (parallax, horizontal "how it works" track,
count-ups, connector draw-ins) are hand-rolled in `components/marketing/hooks.ts` — no
`framer-motion` / `motion` dependency was added.

---

## 2026-08-31 — Workspace direction: labelled sidebar, soft radius, opportunity-first dashboard

**Decision:** The app moves from "printed ledger" chrome to an intelligence-workspace
feel (Attio / Linear / Notion reference).

- **Sidebar** — the 64px icon rail is replaced app-wide by a 224px labelled sidebar
  (wordmark, six icon+label destinations, account row). `AppShell` content is capped at
  1440px with more padding. Reverses the Part-5 icon-rail spec; mobile keeps the bottom
  tab bar.
- **Radius** — `--radius` 4px → 14px; the `@theme` scale is retuned so `rounded-sm`
  (cards) = 12px and `rounded-lg` (buttons, panels) = 16px. No component edits needed;
  `rounded-xs` stays 2px for inline focus-ring corners.
- **Headings** — page titles drop the tracked all-caps `.record-heading` for a new
  sentence-case `.page-title`. `.record-heading` is now reserved for a business's own
  name on its dossier (`/leads/[id]`) and the ledger's column labels, where the
  official-record voice still earns its place.
- **Dashboard** — rebuilt around opportunities, not metrics. Order: greeting + one-line
  stat + range toggle → **featured opportunities** (three act-on cards, the hero) →
  recent discoveries feed + campaign progress → opportunity funnel + evidence-backed
  insights + **potential revenue** (Σ qualified × each campaign's price floor, labelled
  as a floor estimate). No 4-up KPI stat row. Components under
  `components/dashboard/`; motion is a one-time load settle (`.dash-enter` /
  `.funnel-band`, `data-in` flip), reduced-motion collapses it.

**Why:** "The current UI looks like a generic admin dashboard." TUKLAS sells discovery,
so the dashboard should open on the opportunities themselves. The ledger aesthetic still
governs the one place it belongs — the evidence dossier — and nowhere else.

**Kept:** warm paper + forest (action/verified) + amber (opportunity) palette; Archivo +
DM Mono; evidence-is-the-hero on the lead page; no `framer-motion`; the 375px /
focus-ring / reduced-motion quality floor.

---

## 2026-08-31 — Full-app pass to the workspace standard

**Decision:** Carried the workspace direction (soft radius, sentence-case titles, labelled
sidebar) into every remaining screen, and built out the two placeholder pages.

- **Sidebar** — now collapsible (224px ↔ 64px icon rail), choice persisted in
  `localStorage` and shared with `AppShell` via `useSyncExternalStore`. Grouped into
  "Main" and "Pages"; **Favorites and Lists are real routes** with empty states.
- **Top bar** — a wired search field: Enter → `/leads?q=<term>`, `leads-table.tsx` reads it
  via `useSearchParams` (page wraps the table in `Suspense`) and filters by name with a
  clearable chip.
- **Dashboard** — back to the reference mockup's shape: greeting → four KPI cards
  (Businesses scanned · Opportunities found · High potential · Replies) → funnel · top
  opportunities · activity feed. The opportunity-first featured-cards / revenue / insights
  layout is retired.
- **Campaigns** — card list → table (Campaign · Audience · Leads · Qualified · Reply rate ·
  Status · Started) with All/Active/Complete/Failed filter tabs. `Campaign` gains
  `replies` / `replyRate`.
- **Analytics** — real charts on **Recharts** (was an unused dependency) against a new
  `ANALYTICS` fixture: an area chart (found vs qualified, forest + amber — the pair clears
  the dataviz CVD/normal-vision gates), a single-hue horizontal bar chart for top services
  (bars not a donut — magnitude reads straight, and the app palette can't pass a 4-way
  categorical validation), a reply-rate area chart, and six stat tiles. Labelled
  illustrative.
- **Outreach** — two-pane inbox against a new `OutreachThread` fixture (six threads across
  draft/sent/replied/bounced). Draft threads show an editable body with Copy / Mark sent;
  nothing sends.
- **Settings** — five tabs (Profile · Account · Targeting · Notifications · Billing).
  Targeting is the detailed one: chip inputs for locations/categories/exclusions, a styled
  range slider for the minimum score, and a live summary card. All non-persisting.

**Why:** "The current UI looks like a generic admin dashboard… you didn't make all the
pages similar to that image." The mockup is the shared reference now; this brings the whole
app to it and gives Outreach and Analytics a real shape to react to.

**Kept:** warm paper + forest/amber palette, Archivo + DM Mono, the evidence dossier's
distinct ledger voice, no `framer-motion`, the 375px / focus-ring / reduced-motion floor.

---

## 2026-08-31 — Landing rebuilt to the full reference (cartography theme)

**Decision:** The marketing landing (`components/marketing/`) was rebuilt to match a
full-page reference mockup.

- **Section set:** Hero → *How TUKLAS Works* → *Every opportunity comes with proof* →
  4-stat band → Final CTA → Footer. The old Problem / Dossier / Trust / Results sections
  were dropped or merged.
- **`.lp-display` and `.lp-figure` switched from Bricolage Grotesque to Cormorant
  Garamond** — the reference uses the serif (same face as the logo) for every heading and
  the big stat numbers. Bricolage is no longer loaded. Landing buttons use a plain system
  sans.
- **How TUKLAS Works** — the tall sticky horizontal-scroll track is replaced by a compact
  5-node timeline (Discovery → Research → Audit → Score → Outreach) driven by
  `useScrollProgress`: the rail draws left→right and nodes light in sequence as a ~175vh
  sticky section passes through. Mobile / reduced-motion falls back to a plain vertical
  timeline with everything lit.
- **Proof section** — a checklist with checks that pop in, plus `SampleDossier`, an
  HTML/CSS fake app-frame (mini sidebar, tabs, evidence timeline, key insight, recommended
  service, score gauge) — self-reveals via its own `useReveal`.
- **Cartography motif** — new `components/marketing/decor.tsx`: `TopoLines` (procedural
  contour paths, coords rounded to `.toFixed(1/2)` to keep SSR/CSR identical),
  `CompassRose` (ornate 8-point rose, optional `lp-spin-slow` ~90s), `DottedPath` (dashed
  travel path + pin, clip-path draw-in on reveal). Behind the hero and proof; large in the
  final CTA.
- **`Gauge`** extracted from `hero-dossier.tsx` to `components/marketing/gauge.tsx`;
  reused by the sample dossier.
- New ambient keyframes `lp-float` / `lp-spin-slow` in globals — both auto-stilled by the
  existing `.tuklas-lp` reduced-motion block.

**Deleted:** `sections/{problem,dossier-section,trust,results,section-header}.tsx`,
`dossier.tsx`. `landing-data.ts` pruned to `HERO_PROFILE`, `STAGES` (now with `blurb` +
`icon`), `PROOF_POINTS`, `SAMPLE_DOSSIER`, `STATS`.

**Why:** "make it as close as that reference image as possible … keep the scroll animation
in the discovery→…→outreach part … add background effects so it's not plain." Confirmed
with the user: reference timeline animated by scroll, product mockup in HTML/CSS, full
inline-SVG motif.

---

## Landing — pinned hero, animated scroll cue, "How TUKLAS works" redesign

- **Hero pins on scroll.** Desktop `motion` path only: the `#top` section is `175vh` and
  its content wrapper is `position: sticky; top: 0; h: 100dvh`, so the hero holds in place
  while `HowItWorksSection` (`z-10`, opaque `--lp-raise`) rises up and covers it. Mobile /
  reduced-motion: no extra height, no sticky — a normal section.
- **Recede + scroll-cue fade are CSS scroll-driven, not JS.** `useScrollProgress` was
  removed from `hero.tsx`. `#top` carries `view-timeline-name: --lp-hero`; `.lp-hero-recede`
  (the content) fades `1 → 0.6` over `animation-range: contain 12%–96%` and `.lp-hero-cue`
  fades `1 → 0` over `contain 0%–12%`. `contain` spans exactly the stretch where the 175vh
  section fully covers the viewport — i.e. the pinned hold — regardless of nav height or
  viewport size. Wrapped in `@supports (animation-timeline: view())` +
  `@media (prefers-reduced-motion: no-preference)`, so unsupported browsers still get the
  pin (just no dim) and reduced-motion gets a static full-opacity hero. Off the main
  thread, no scroll listener.
- **Scroll cue** is now an `<a href="#how-it-works">` (the affordance is the action) with a
  two-chevron `.lp-float` bob (second chevron `animation-delay: 0.4s`), fading out via the
  timeline above as soon as the scroll starts.
- **"How TUKLAS works" reframed as a surveyed route.** `ScrollRoute` (desktop + motion):
  a ~165vh sticky region; scrolling drives a gold diamond marker along a dashed amber rail
  with a forest progress fill (`scaleX(progress)`), and the five stage cards activate in
  order — *passed* (forest badge + check, card recedes to transparent), *active* (forest
  badge, card lifts `-translate-y-1` + shadow + white surface, blurb and one-line `detail`
  shown), *upcoming* (dashed badge + card, blurb hidden). A "Step N / 5 · {name}" readout
  under the header tracks the marker. `StaticRoute` (mobile / reduced-motion): the same
  cards in a vertical route, every card in the resolved state, no marker.
- `STAGES` in `landing-data.ts` gained a `detail` string per stage
  ("public directories · maps", …).

**Why:** "the hero section should be like a sticky section until you've scrolled to [how it
works]"; "that scroll to discover part should have an animation"; "I am lacking design in
the How TUKLAS works section — improve it." Skills consulted: `animate`,
`emil-design-eng`, `web-design-engineer`, `frontend-design`. Their constraints drove the
move to CSS scroll-timelines (predetermined motion → off main thread), `transform`/
`opacity` only, custom `--lp-ease`, 360–440ms card transitions, and reduced-motion +
support gating shipped with the motion.

---

## 2026-08-31 — Backend Milestones 1 + 2 (skeleton + auth + schema + RLS)

**Decision:** Implemented BUILD_GUIDE Milestones 1 and 2 together — FastAPI skeleton, JWT
auth, the full 16-table schema, Alembic migrations, and Postgres row-level-security user
isolation. Backend only; the frontend stays on fixtures (`lib/types.ts` regenerates from
OpenAPI in Milestone 8). Scope-fenced per `BUILD_GUIDE.md:464`: no campaign/discovery/
scraping/LLM/Celery logic; the leads/campaigns/outreach/agent-runs routes are read-only
`GET` and exist only so the four isolation tests are real.

**Verification path:** a natively-installed **PostgreSQL 18** (Docker Desktop + WSL2 are
not on the dev machine). The `Dockerfile` / `docker-compose.yml` are written and parse but
are not run this session; CI (`postgres:18` service) is the other real-Postgres gate.

### Dependency swaps (each forced by a real breakage)

| Guide | Used | Why |
|---|---|---|
| `passlib[bcrypt]` | **`bcrypt>=4.2`** direct | passlib 1.7.4 raises `AttributeError: module 'bcrypt' has no attribute '__about__'` on bcrypt 4.x/5.x |
| `python-jose[cryptography]` | **`pyjwt>=2.10`** | jose barely maintained (CVE-2024-33663/4); only HS256 needed |
| `sqlalchemy` | **`sqlalchemy[asyncio]`** | the extra pulls `greenlet`, required by the async ORM |
| — | **add `email-validator`**, **`python-multipart`** | `EmailStr` / `OAuth2PasswordRequestForm` ImportError without them |

`uv python pin 3.12` (machine has 3.14; asyncpg cp314 wheels lag). `[tool.uv] package = false`
— `backend/` is a plain package, not an installable dist; `uv.lock` committed.

### Import convention

Repo root is the only `sys.path` entry; every first-party import is `backend.*`.
`backend/queue/` shadows the stdlib `queue` module (imported by Celery's `billiard`/`kombu`,
`concurrent.futures`, pandas), so `pythonpath=["backend"]` would break the worker. Three bare
imports (`from config import`, `from schemas.business import`) were converted.

### Schema / RLS

- **UUID PKs** (`gen_random_uuid()`, core in PG13+). **Enums as `VARCHAR + CHECK`**
  (`sa.Enum(..., native_enum=False)`) with values mirrored verbatim from `lib/types.ts` —
  autogenerate is blind to native-enum value changes and those lists churn M3–M9. New
  `ContactType` enum for `business_contacts.type` (not in `types.ts` yet).
- **Two DB roles.** `tuklas` (superuser, table owner) runs Alembic only
  (`MIGRATION_DATABASE_URL`). `tuklas_app` (`NOSUPERUSER NOBYPASSRLS`, not owner) is the app
  + test-suite role (`DATABASE_URL`). **Superusers bypass RLS unconditionally** — if the app
  connected as `tuklas` every policy would be inert and M2 would pass for the wrong reason.
  `tuklas_app` is created in migration `0001` (not an initdb script — those only run on a
  fresh volume, so CI / host / existing volumes would diverge).
- **`users` is outside RLS** — register inserts and login-by-email both happen before any
  identity exists; no USING/WITH CHECK can express that, and no route looks a user up by
  anything but the token `sub`. The other 15 tables carry `ENABLE` + `FORCE` RLS + an
  identical policy `user_id = app_current_user_id()` (migration `0003`).
- **Denormalized flat `user_id`** on transitively-owned tables (`business_evidence`,
  `lead_scores`, `agent_tool_calls`, …), kept undriftable by parent `UNIQUE (id, user_id)` +
  child composite FK `(parent_id, user_id)` — so every policy is the same one-liner and the
  DB rejects a child stamped with the wrong user.
- **RLS context:** `SELECT set_config('app.user_id', :uid, true)` (bind param — never
  f-string a token-derived value; `SET LOCAL` can't take a bind param anyway) + an
  `@event.listens_for(Session, "after_begin")` listener that re-applies it after every
  `COMMIT` clears it. `app_current_user_id()` returns `NULL` when the GUC is unset →
  fail-closed (empty result sets, never a leak).
- Required indexes present: `ix_businesses_user_id`, `(campaign_id, score DESC)` on
  `lead_scores`, `(campaign_id, started_at)` on `agent_runs`; `campaign_leads(campaign_id)`
  discharged by the composite PK's leading column.

### API contract (settles the open questions from the 2026-08-31 "typed fixtures" entry)

- **Token transport: `Authorization: Bearer` header** (not a cookie). The guide's test uses
  `headers=auth(...)`; `lib/api.ts` is a plain `fetch` with no credentials; header auth is
  CSRF-immune; `/docs` Authorize works via `/auth/token`. httpOnly-refresh is a Milestone 13
  hardening item.
- **No `/api/v1` prefix** — routers mount at `prefix=settings.api_prefix` (empty now) so
  it's a one-env-var change later.
- **camelCase on the wire** — `CamelModel` base (`alias_generator=to_camel`,
  `populate_by_name=True`); enum *values* stay snake_case verbatim.
- **Login is a timing-flat 401** — unknown email still spends one bcrypt verify against
  `DUMMY_PASSWORD_HASH`; identical body for unknown-email vs wrong-password.
- **Profile is lazily created on first `PUT /me/profile`** — registration must NOT create
  the row (RLS `WITH CHECK` would reject it with no GUC set), which is itself a live proof
  the policies are on.

### Tests

Real Postgres `tuklas_test`, **TRUNCATE per test** (not rollback — rollback reverts
`set_config` and turns the app's `commit()` into a savepoint release, hiding the
SET-LOCAL-after-COMMIT bug). `httpx.AsyncClient(transport=ASGITransport(app=app))`
(`AsyncClient(app=app)` removed in httpx 0.28). `test_rls.py` asserts at the DB level that
`tuklas_app` is `rolsuper=f, rolbypassrls=f` and owns no tables — the assertion that stops
all of M2 becoming a no-op.

### Deferred (known gaps)

Email verification, password reset, onboarding flow (in the route map, not M1's build list);
Docker runtime verification + the Redis/Celery-worker "ready" check (until Docker is
installed); frontend API wiring + `openapi-typescript` regen (Milestone 8).

## 2026-09-02 — Backend Milestone 3 (Discovery task)

First pipeline stage: `POST /campaigns/{id}/discover` populates `businesses` for a
campaign's industry, deduplicated so a re-run inserts nothing, each with a
`business_sources` provenance row, and logs the run to `agent_runs`. Deterministic,
no LLM, no schema change (M2 already shipped the columns + the `uq_businesses_user_domain`
partial-unique and `ix_businesses_user_normalized_name` indexes).

### Fixture source first, real scraper later

`BusinessDataSource` gets one implementation this milestone — `FixtureSource`, reading
`backend/providers/business_data/data/zamboanga_city.json` (~80 hand-built real
Zamboanga City businesses, ≥ 50 in the beauty vertical). The whole deterministic
pipeline (normalize → dedupe → persist → run-logging → endpoint → tests) is built and
tested against it with zero network. `get_business_source()` in
`backend/providers/business_data/__init__.py` is the seam: swapping in
`MapsScraperSource` (Playwright) / `PlacesApiSource` is a one-line change there.
Scraping — browser install, per-URL HTML cache, robots.txt, 2–4 s rate limiting — is a
follow-up once the pipeline is proven.

### Celery: eager in dev/CI, and the request path skips the broker

`celery_app.conf.task_always_eager = settings.celery_task_always_eager` (default `True`).
A real worker + Redis arrives with Docker. The `POST .../discover` route does **not**
enqueue — it `await`s `run_discovery(db, campaign)` directly and returns the finished
`DiscoveryResult`. Reason: `discovery_task` wraps the async core in `asyncio.run()`, which
raises inside a running event loop; the request already has one. `discovery_task` exists
for the future worker and is exercised in eager mode from sync test code (its async core,
`_run_discovery`, is tested directly).

### `backend/agents/` package + the shared run-logging wrapper

New `backend/agents/` holds pipeline stages. `agents/base.py::agent_run(session, campaign,
agent)` is an async context manager that opens an `agent_runs` row, times it, and flips
`status` to `succeeded`/`failed` — every future stage (research, audit, …) reuses it.
`agents/discovery/` is a package: `normalize.py` + `dedupe.py` are pure (no I/O),
`runner.py` is the entry point.

### Normalization + dedupe rules

- `normalize_name` — casefold, strip accents (NFKD), collapse punctuation, drop trailing
  generic/legal suffix words (`inc corp salon spa clinic …`) so "Glow & Go Salon" and
  "Glow and Go Salon, Inc." both key to "glow go".
- `to_e164` — PH numbers → `+63…`; `09xx`, `+639xx`, `639xx`, `(062) …` landlines; `None`
  if the digit count is implausible.
- `extract_domain` — registrable host, `www.` stripped; **social hosts
  (facebook/instagram/…) return `None`** — those are contacts, never a business's site.
- A candidate is a duplicate when: same non-null `domain`; **or** `normalized_name` exact /
  `rapidfuzz.token_sort_ratio ≥ DISCOVERY_FUZZY_THRESHOLD` (88) **and** corroborated by a
  shared address token (a small locality stoplist — "zamboanga", "city", "street", … —
  removed first so a common suffix can't corroborate), an equal E.164 phone, or neither
  side having any address/phone. The corroboration guard is what keeps two "Sunrise Spa"
  in different barangays from merging.

### Deferred

Failed `agent_runs` rows currently roll back with the request transaction (single commit at
the end of the route). Durable failure logging on its own transaction comes with the real
Celery worker. Also deferred: `campaign_leads` linking, research/audit/scoring/outreach
(M4+), rich `LeadSummary`/`LeadDetail` shapes (M8).
