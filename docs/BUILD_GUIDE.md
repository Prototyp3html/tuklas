# TUKLAS — Complete Build Guide

**From zero to a working startup, built solo, on a ₱1,200/month budget.**

*Companion to the TUKLAS Master Product Architecture spec. Where the spec says WHAT to build, this says HOW, IN WHAT ORDER, and WITH WHAT.*

---

## How to use this document

Read Part 1 and Part 2 fully before writing any code. Then work through Part 3 one milestone at a time. Do not read ahead and start building Phase 7 because it sounds interesting — the ordering is the whole point. Part 4 covers the visual design system and Part 5 is the complete page-and-component map — use both as reference when you reach the frontend milestones (mainly Milestone 8), not before.

Each milestone has:
- **Goal** — the one thing that must be true when you're done
- **Build** — what to actually make
- **Done when** — the test that proves it works
- **Claude prompt** — what to paste into Claude Code for that milestone

Keep this file in your repo at `/docs/BUILD_GUIDE.md`. Update the checkboxes as you go.

---

## Part 1 — The honest framing

### What you're actually building

A freelancer in Zamboanga City sells websites. They open TUKLAS, say "I sell websites and booking systems to salons in Zamboanga City, budget ₱30,000+", and click one button. Twenty minutes later they have 32 qualified leads, each with evidence for why it's an opportunity, a recommended pitch, and a draft message ready to send.

That's it. Everything else in the spec serves that one loop.

### The three-stage business plan

You are not building a SaaS company yet. You're doing this:

| Stage | What you do | Revenue source | When to move on |
|---|---|---|---|
| **1. Internal tool** | Use TUKLAS to find clients for *your own* web dev services | Your own client work (₱15k–30k per website) | When it reliably produces leads you'd actually call |
| **2. Productized service** | Sell "100 qualified local leads/month" to 3–5 freelancers | Monthly fee or per-lead fee | When people pay twice without you chasing them |
| **3. SaaS** | Self-serve product, tiered pricing | Subscriptions | When manual delivery becomes the bottleneck |

**Why this order matters:** one website client at ₱30,000 is worth more than 50 months of a ₱600 subscription. Stage 1 funds Stage 2. Do not skip to Stage 3 because it feels more like a "real startup."

### Your actual constraints (be honest about these)

- Solo developer
- ₱0–1,200/month infrastructure budget
- Claude Pro ($20/mo) as your only AI tooling
- First startup — you will make ordering mistakes
- Philippine market, starting hyper-local (Zamboanga City)

Every decision in this guide is made against those constraints. When a "better" architecture exists but costs money you don't have, this guide picks the free one and shows you the upgrade path.

### The three things most likely to kill this project

1. **You build for six months without talking to a single freelancer.** Phase 0 exists to prevent this. Do not skip it.
2. **You chase the "OS" vision instead of the 8-item MVP.** The spec lists 75 sections. The MVP needs about 12 of them.
3. **Data sourcing turns out to be harder than you assumed.** Milestone 3 is deliberately early so you find this out in week 3, not month 5.

---

## Part 2 — Complete architecture

### Stack decision: Python

Final answer, based on our earlier discussion:

```
Frontend    Next.js 14 + TypeScript + Tailwind + shadcn/ui
API         FastAPI + Uvicorn + Pydantic v2
Queue       Celery + Redis (+ Flower for monitoring)
Database    PostgreSQL + SQLAlchemy 2 (async) + Alembic
Scraping    httpx + BeautifulSoup4 + Playwright
LLM         Ollama (local, free) → Claude API later
Packaging   uv
Deploy      Docker Compose → Railway
```

**Why Python over Node.js:** your ML and evaluation code (Phase 12+) lives in the same language as your app. No microservice boundary, no model-serving hop. Pydantic gives you the structured-output validation the spec demands, for free.

### System diagram

```
┌─────────────────────────────────────────────────────────┐
│  NEXT.JS FRONTEND                                       │
│  Dashboard · Campaigns · Leads · Lead detail · Settings │
└────────────────────────┬────────────────────────────────┘
                         │ REST (JSON)
┌────────────────────────▼────────────────────────────────┐
│  FASTAPI                                                │
│  Auth (JWT) · Routes · Pydantic validation · RLS        │
└────────────────────────┬────────────────────────────────┘
                         │ enqueue
┌────────────────────────▼────────────────────────────────┐
│  CELERY ORCHESTRATOR                                    │
│  Deterministic pipeline · run state · retries · logging │
└────────────────────────┬────────────────────────────────┘
                         │
     ┌───────────────────┼───────────────────┐
     ▼                   ▼                   ▼
┌─────────┐  ┌─────────┐  ┌────────┐  ┌───────────┐  ┌──────────┐
│Discovery│→ │Research │→ │ Audit  │→ │Opportunity│→ │ Outreach │
│ no LLM  │  │ no LLM  │  │ no LLM │  │  Ollama   │  │  Ollama  │
└─────────┘  └─────────┘  └────────┘  └───────────┘  └──────────┘
     │            │            │            │              │
     └────────────┴────────────┴────────────┴──────────────┘
                         │ writes
┌────────────────────────▼────────────────────────────────┐
│  POSTGRESQL                                             │
│  businesses · evidence · scores · campaigns · agent_runs│
└────────────────────────┬────────────────────────────────┘
                         │ feeds
┌────────────────────────▼────────────────────────────────┐
│  LEARNING LOOP (Phase 12+)                              │
│  Labeled dataset · metrics · conversion outcomes · ML   │
└─────────────────────────────────────────────────────────┘
```

**The single most important thing on this diagram:** agents 1–3 make zero LLM calls. They scrape, fetch, and check with plain code. Only agents 4 and 5 touch a model, and only for leads that already passed a deterministic filter. This is what keeps your AI cost near zero.

### The cost funnel (memorize this)

```
1,000 businesses discovered
    ↓  cheap deterministic filters (name/domain dedup, category match)
  400 candidates
    ↓  basic HTTP website checks (no browser, no LLM)
  200 candidates
    ↓  cheap classification (small local model)
  100 candidates
    ↓  expensive reasoning (only here)
   50 qualified leads
```

If you ever find yourself sending all 1,000 to an LLM, stop and re-read this.

### Repository structure

```
tuklas/
├── docs/
│   ├── BUILD_GUIDE.md          ← this file
│   ├── ARCHITECTURE.md
│   ├── EVALUATION.md           ← Phase 12 results live here
│   └── DECISIONS.md            ← why you chose things (portfolio gold)
│
├── frontend/
│   ├── app/
│   │   ├── (auth)/login/
│   │   ├── dashboard/
│   │   ├── campaigns/
│   │   │   ├── page.tsx
│   │   │   ├── new/page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── leads/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   └── settings/
│   ├── components/
│   │   ├── ui/                 ← shadcn primitives
│   │   ├── leads/
│   │   ├── campaigns/
│   │   └── evidence/
│   ├── lib/
│   │   ├── api.ts
│   │   └── types.ts            ← generated from FastAPI OpenAPI
│   └── package.json
│
├── backend/
│   ├── main.py
│   ├── config.py               ← pydantic-settings
│   │
│   ├── api/
│   │   ├── auth.py
│   │   ├── campaigns.py
│   │   ├── leads.py
│   │   ├── dashboard.py
│   │   └── agent_runs.py
│   │
│   ├── agents/
│   │   ├── base.py             ← shared run-logging wrapper
│   │   ├── discovery.py
│   │   ├── research.py
│   │   ├── audit.py
│   │   ├── opportunity.py
│   │   └── outreach.py
│   │
│   ├── providers/              ← THE PLUGGABLE LAYER
│   │   ├── business_data/
│   │   │   ├── base.py         ← BusinessDataSource interface
│   │   │   ├── maps_scraper.py ← Phase 1 impl
│   │   │   └── places_api.py   ← Phase 2 impl (later)
│   │   └── llm/
│   │       ├── base.py         ← LLMProvider interface
│   │       ├── ollama.py       ← Phase 1 impl
│   │       └── anthropic.py    ← Phase 2 impl (later)
│   │
│   ├── schemas/                ← Pydantic models
│   │   ├── business.py
│   │   ├── campaign.py
│   │   ├── evidence.py
│   │   └── agent.py
│   │
│   ├── models/                 ← SQLAlchemy tables
│   ├── queue/
│   │   ├── celery_app.py
│   │   └── tasks.py
│   ├── db/
│   │   ├── session.py
│   │   └── migrations/         ← Alembic
│   └── core/
│       ├── security.py         ← JWT, password hashing
│       └── ssrf.py             ← URL safety (CRITICAL)
│
├── scripts/
│   ├── evaluate.py             ← Phase 12
│   ├── label_helper.py         ← speeds up manual labeling
│   └── train_model.py          ← Phase 15
│
├── notebooks/
├── tests/
├── data/
│   └── labeled/                ← your evaluation dataset
├── docker-compose.yml
├── pyproject.toml
└── .env.example
```

### The two interfaces that make everything upgradeable

Write these in Milestone 3 and never change them again. Everything else swaps behind them.

```python
# backend/providers/business_data/base.py
from abc import ABC, abstractmethod
from schemas.business import RawBusiness

class BusinessDataSource(ABC):
    """Every business data provider implements this.
    Phase 1: Google Maps scraper. Phase 2: Places API. Phase 3: Apollo.
    The pipeline never knows which one it's talking to."""

    @abstractmethod
    async def search(
        self, category: str, location: str, limit: int = 50
    ) -> list[RawBusiness]:
        ...

    @abstractmethod
    def source_name(self) -> str:
        """For provenance tracking in business_sources table."""
        ...
```

```python
# backend/providers/llm/base.py
from abc import ABC, abstractmethod
from pydantic import BaseModel

class LLMProvider(ABC):
    """Phase 1: Ollama. Phase 2: Claude API. Phase 3: routed by task.
    Agents call this, never a vendor SDK directly."""

    @abstractmethod
    async def complete_structured(
        self,
        prompt: str,
        schema: type[BaseModel],
        tier: str = "cheap",   # "cheap" | "standard" | "strong"
    ) -> BaseModel:
        """Returns a validated Pydantic object. Retries once on
        invalid output, then raises. Never returns free-form text."""
        ...
```

**This is the single highest-leverage thing in the whole codebase.** Two files, maybe 40 lines, and they mean upgrading from free-Ollama to paid-Claude in Phase 2 is a one-file change instead of a rewrite.

### Database schema (Milestone 2)

Core tables, in dependency order:

```
users                 id, email, password_hash, created_at
user_profiles         user_id, services[], target_industries[],
                      target_locations[], price_range, icp_notes

campaigns             id, user_id, name, service, industries[],
                      location, budget_min, status, created_at

businesses            id, user_id, name, normalized_name, domain,
                      address, phone, category, lat, lng
business_sources      business_id, source_name, source_id, fetched_at
business_contacts     business_id, type, value, confidence

business_evidence     id, business_id, claim, observed_value,
                      source_url, confidence, collected_at
digital_audits        business_id, has_website, website_status,
                      has_booking, has_ordering, social_activity,
                      mobile_ok, audited_at

lead_scores           business_id, campaign_id, score, breakdown(jsonb),
                      model_version, scored_at
lead_opportunities    business_id, recommended_service, sales_angle,
                      reasoning, confidence

campaign_leads        campaign_id, business_id, status, added_at
lead_activity         id, business_id, user_id, type, note, created_at
outreach_messages     id, business_id, channel, draft, approved,
                      sent_at, edited_by_user

agent_runs            id, user_id, campaign_id, agent, status,
                      started_at, ended_at, duration_ms, cost_usd
agent_tool_calls      run_id, tool, input(jsonb), output(jsonb), ms
agent_errors          run_id, error_type, message, traceback
```

**Non-negotiable rules:**
- Every user-owned row has `user_id`, `created_at`, `updated_at`
- Enable Postgres row-level security on every user-owned table
- Write a test that proves user A cannot read user B's leads. Write it in Milestone 2, not later.

### Security: the one that can actually hurt you

Your crawler fetches URLs. If a user (or a scraped page) can make your server fetch `http://169.254.169.254/`, they can read your cloud credentials.

Write this in Milestone 4, before the first `fetch_page()`:

```python
# backend/core/ssrf.py
import ipaddress, socket
from urllib.parse import urlparse

BLOCKED_NETS = [
    ipaddress.ip_network("127.0.0.0/8"),
    ipaddress.ip_network("10.0.0.0/8"),
    ipaddress.ip_network("172.16.0.0/12"),
    ipaddress.ip_network("192.168.0.0/16"),
    ipaddress.ip_network("169.254.0.0/16"),   # cloud metadata
    ipaddress.ip_network("::1/128"),
    ipaddress.ip_network("fc00::/7"),
]

def is_safe_url(url: str) -> bool:
    p = urlparse(url)
    if p.scheme not in ("http", "https"):
        return False
    if not p.hostname:
        return False
    try:
        for info in socket.getaddrinfo(p.hostname, None):
            ip = ipaddress.ip_address(info[4][0])
            if any(ip in net for net in BLOCKED_NETS):
                return False
            if ip.is_private or ip.is_loopback or ip.is_link_local:
                return False
    except Exception:
        return False
    return True
```

Every fetch goes through this. Plus: 5s timeout, 2MB max page size, max 10 pages per business, respect robots.txt, identify your crawler in the User-Agent.

---

## Part 3 — The build, milestone by milestone

Fifteen milestones. Realistic solo timeline: **5–7 months to paying users.** Weeks are guides, not deadlines.

### Roadmap at a glance

| # | Milestone | Weeks | Gate |
|---|---|---|---|
| 0 | Validation interviews | 1–2 | 20 conversations done |
| 1 | Skeleton + auth | 1 | You can log in |
| 2 | Database + isolation | 1 | Cross-user test passes |
| 3 | Discovery agent | 1–2 | 50 real Zamboanga City businesses in DB |
| 4 | Website analyzer | 1 | Correct on 20 hand-checked sites |
| 5 | Research agent + evidence | 1–2 | Every claim has a source URL |
| 6 | Audit agent | 1 | Structured audit per business |
| 7 | Scoring | 1–2 | Top 10 leads look right to you |
| 8 | Dashboard + lead UI | 2–3 | Usable without the terminal |
| 9 | Outreach agent | 1 | Drafts you'd actually send |
| 10 | Observability | 1 | Click into any run |
| 11 | Analytics | 1 | Funnel visible |
| 12 | Evaluation | 1–2 | 100 labeled, metrics documented |
| 13 | Beta | 3–4 | 3–5 users, real feedback |
| 14 | Monetization | 2–4 | First peso earned |
| 15+ | Advanced AI | ongoing | Only after 14 |

---

### MILESTONE 0 — Validation (weeks 1–2)

**Do not write code this milestone.** This is the one that saves you five months.

**Goal:** know whether freelancers in your market actually feel this pain, and what they'd pay.

**Build:** nothing. A spreadsheet.

**Do this:**

Talk to 20 people — 5 web developers, 5 small agencies, 5 freelancers, 5 people doing local-business marketing. Facebook groups, local dev meetups, Upwork PH, LinkedIn. In Zamboanga City you can probably reach most of these in person or by Messenger.

Ask exactly these, and shut up while they answer:

1. How do you find clients right now? Walk me through the last one.
2. How many hours a week does prospecting take you?
3. What makes a lead worth calling versus ignoring?
4. What do you need to know about a business before you contact them?
5. Have you paid for leads before? What happened?
6. If someone handed you 100 qualified local leads a month, what's that worth?

**Record in a spreadsheet:** name, role, current method, hours/week, what makes a lead good, would-pay (y/n), price mentioned.

**Done when:** 20 rows filled in, and you can answer: *what specific evidence makes a lead worth calling, in their words?* That answer becomes your scoring weights in Milestone 7.

**Red flag:** if 15+ say "I get clients from referrals and I'm fine" — you may be building for a pain that isn't sharp enough. That's worth knowing in week 2 for ₱0.

**Claude prompt:**
```
I'm doing customer validation interviews for TUKLAS (AI lead-gen for
freelancers selling web services to local PH businesses). Here are my
20 interview notes: [paste]. Help me identify: (1) the sharpest pain
point mentioned repeatedly, (2) what evidence they use to judge lead
quality, (3) realistic price anchors, (4) anything that contradicts
my assumptions.
```

---

### MILESTONE 1 — Skeleton + auth (week 3)

**Goal:** a running app you can log into.

**Build:**
- `uv init`, project structure from Part 2
- `docker-compose.yml`: api, worker, redis, postgres
- FastAPI app with `/health`
- JWT auth: register, login, `/me`
- Next.js frontend with login page
- Git repo, first commit, GitHub Actions running `pytest`

**Setup:**
```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
uv init backend && cd backend && uv python pin 3.12

uv add fastapi uvicorn[standard] sqlalchemy asyncpg alembic \
       pydantic-settings python-jose[cryptography] passlib[bcrypt] \
       httpx beautifulsoup4 playwright celery redis tenacity

uv add --dev pytest pytest-asyncio httpx ruff pandas scikit-learn jupyter

cd ../ && npx create-next-app@latest frontend --typescript --tailwind --app
cd frontend && npx shadcn@latest init
```

**Done when:** `docker compose up` → you register, log in, see a page that says your email.

**Claude prompt:**
```
Milestone 1 of TUKLAS only. Set up: FastAPI + uv + Docker Compose
(api, celery worker, redis, postgres), JWT auth with register/login/me,
Next.js frontend with a login page hitting that API, GitHub Actions
running pytest. Do not implement campaigns, agents, or any later phase.
Explain the plan, create the files, then stop and wait for my approval.
```

---

### MILESTONE 2 — Database + user isolation (week 4)

**Goal:** the full schema exists and one user provably cannot see another's data.

**Build:**
- SQLAlchemy models for every table in Part 2
- Alembic migration
- Indexes: `businesses(user_id)`, `campaign_leads(campaign_id)`, `lead_scores(campaign_id, score DESC)`, `agent_runs(campaign_id, started_at)`
- Row-level security policies
- User profile CRUD (services, industries, locations, price range)

**The test that matters:**
```python
async def test_user_cannot_read_other_users_leads(client, user_a, user_b):
    b = await create_business(user_a, name="ABC Salon")
    r = await client.get(f"/leads/{b.id}", headers=auth(user_b))
    assert r.status_code in (403, 404)
```

**Done when:** that test passes, and it also passes for campaigns, messages, and agent runs.

---

### MILESTONE 3 — Discovery agent (weeks 5–6)

**Goal:** 50 real Zamboanga City salons in your database, deduplicated.

**This is your riskiest milestone.** It's early on purpose. If getting Philippine local-business data turns out to be brutal, you find out now.

**Build:**
- `BusinessDataSource` interface (Part 2)
- `MapsScraperSource` — Playwright against Google Maps search
- Normalization: lowercase, strip suffixes (Inc/Corp/Salon), normalize phone to E.164, extract domain from any URL
- Deduplication: exact domain match → normalized-name + address fuzzy match (rapidfuzz, threshold ~90)
- Save with source provenance
- Celery task wrapping it

**Rules:**
- 2–4 second delay between requests. Never hammer.
- Cache raw HTML by URL hash — never fetch the same page twice
- Cap at 100 businesses per campaign
- Log every run to `agent_runs`

**Done when:** `POST /campaigns/{id}/discover` returns 50 real businesses, and running it twice adds zero duplicates.

**If scraping proves unreliable:** fall back to Google Places API. It's paid but the free tier plus $200/mo Google credit covers early MVP usage. Test this before assuming you must scrape.

**Claude prompt:**
```
Milestone 3 of TUKLAS only. Build the Discovery agent in Python:
a BusinessDataSource abstract interface, one implementation scraping
Google Maps with Playwright, normalization (names, phones, domains),
deduplication with rapidfuzz, provenance tracking, and a Celery task.
Rate-limit 2-4s between requests, cache by URL hash, cap at 100 results.
No LLM calls anywhere in this milestone. Do not build research, audit,
or scoring. Explain the plan first, then implement, then stop.
```

---

### MILESTONE 4 — Website analyzer (week 7)

**Goal:** for each business, know deterministically whether they have a working website and what's on it.

**No LLM. Pure HTTP.**

**Build:**
- `core/ssrf.py` from Part 2 — write this FIRST
- `check_website(domain)` returning: reachable, status code, redirect chain, HTTPS, title, meta description, mobile viewport tag, booking links, ordering links, social links, contact presence
- Booking detection: look for links/text matching `book|appointment|reserve|schedule|calendly|setmore`
- Ordering: `order|delivery|menu|foodpanda|grab`
- Only escalate to Playwright if the HTTP response has <500 chars of text (JS-rendered)

**Done when:** you hand-check 20 Zamboanga City businesses and the analyzer agrees with your eyes on all 20. If not, fix it before moving on — everything downstream depends on this being right.

---

### MILESTONE 5 — Research agent + evidence store (weeks 8–9)

**Goal:** every future claim TUKLAS makes traces back to a URL.

**Build:**
- `search_web(query)` — organic search scrape, top 5 results
- `fetch_page(url)` — SSRF-checked, 5s timeout, 2MB cap
- `extract_business_info(html)` — phone, email, social handles, address, last-modified
- `save_evidence(business_id, claim, value, source_url, confidence)`
- Facebook page check: does a public page exist, recent post activity, follower count

**The evidence rule:** nothing gets stored as a fact without `source_url` and `collected_at`. If you can't cite it, you don't know it.

**Done when:** open any business in the DB, see 5–15 evidence rows, every one with a working source URL.

---

### MILESTONE 6 — Audit agent (week 10)

**Goal:** one structured digital audit per business.

**Build:** `digital_audit(business)` returning a validated Pydantic model:

```python
class DigitalAudit(BaseModel):
    has_website: bool
    website_status: Literal["none","broken","outdated","basic","good"]
    has_booking: bool
    has_ordering: bool
    mobile_friendly: bool | None
    social_presence: Literal["none","inactive","active","very_active"]
    digital_gaps: list[str]
    evidence_ids: list[UUID]
    confidence: float = Field(ge=0, le=1)
```

Still deterministic — this composes Milestones 4 and 5 outputs into a structured verdict.

**Done when:** every business has an audit row, and every audit's `evidence_ids` are non-empty.

---

### MILESTONE 7 — Opportunity scoring (weeks 11–12)

**Goal:** ranked leads where the top 10 genuinely look worth calling.

**Build in two layers.**

**Layer 1 — transparent weighted score (no LLM):**

```python
WEIGHTS = {
    "no_website":            30,
    "broken_website":        25,
    "outdated_website":      15,
    "no_booking":            20,   # only if service includes booking
    "no_ordering":           15,
    "active_social":         20,
    "high_review_count":     15,
    "contactable":           10,
    "industry_match":        20,
    "location_match":        10,
}
```

Start with the weights from your Milestone 0 interviews, not from intuition. Store the full breakdown in `lead_scores.breakdown` so users can see *why*.

**Layer 2 — LLM reasoning, only above threshold:**

```python
if quick_score < 50:
    return LeadScore(score=quick_score, qualified=False, llm_used=False)

result = await llm.complete_structured(
    prompt=build_opportunity_prompt(business, audit, evidence, user_profile),
    schema=OpportunityAnalysis,
    tier="cheap",
)
```

```python
class OpportunityAnalysis(BaseModel):
    score: int = Field(ge=0, le=100)
    recommended_service: str
    sales_angle: str
    reasoning: str
    confidence: float = Field(ge=0, le=1)
    evidence_ids: list[UUID]   # must reference real evidence
```

**Validation rule:** if the model returns evidence IDs that don't exist, or reasoning that cites facts not in the evidence store, reject it. Retry once. Then mark the run failed and log it. Never save an ungrounded conclusion.

**Done when:** you run a real campaign, look at the top 10, and would actually call at least 7 of them.

**Claude prompt:**
```
Milestone 7 of TUKLAS only. Build opportunity scoring: (1) a transparent
weighted scoring function with configurable weights and a stored breakdown,
(2) an LLM layer that only runs when the deterministic score is >= 50,
calling my LLMProvider interface with a Pydantic schema, (3) validation
that rejects output citing non-existent evidence IDs, retries once, then
fails the run. Ollama is the current provider. Do not build the dashboard
or outreach yet.
```

---

### MILESTONE 8 — Dashboard + lead UI (weeks 13–15)

**Goal:** the whole workflow usable without touching a terminal.

**Build:**

*Campaign creation* — service description, industry multi-select, location, budget in ₱, "Find opportunities" button.

*Campaign running state* — progress bar per stage (discovering → researching → auditing → scoring), live counts.

*Dashboard* — four KPI cards: found / analyzed / qualified / high priority. Recent campaigns list.

*Lead list* — sortable table, default sort by score desc. Columns: business, score, status badge, evidence count, action. Filters: score range, status, industry, has-website.

*Lead detail* — the most important screen in the product:

```
┌──────────────────────────────────────────────────┐
│  ABC Salon                          Score  94    │
│  Tetuan, Zamboanga City                          │
├──────────────────────────────────────────────────┤
│  WHY THIS IS AN OPPORTUNITY                      │
│  ✗ No website              → source              │
│  ✓ Active Facebook (posts weekly)  → source      │
│  ✓ 340 reviews, 4.6 stars  → source              │
│  ✗ No online booking       → source              │
├──────────────────────────────────────────────────┤
│  RECOMMENDED       Website + appointment booking │
│  SALES ANGLE       They're handling bookings     │
│                    manually via FB comments —    │
│                    high volume, no system.       │
├──────────────────────────────────────────────────┤
│  [ Generate outreach ]     Status: NEW ▾         │
└──────────────────────────────────────────────────┘
```

Every evidence line links to its source URL. That link is your entire credibility.

**Done when:** you run a campaign start to finish in the browser and never open a terminal.

---

### MILESTONE 9 — Outreach agent (week 16)

**Goal:** drafts good enough that you'd send them yourself.

**Build:**
- Generate email + Facebook DM variants
- Prompt uses only evidence-backed facts about the business
- Fully editable before sending
- Approve → status NEW becomes CONTACTED, logged in `lead_activity`
- Copy-to-clipboard (no auto-sending yet)

**Hard rules from the spec:**
- Human-in-the-loop always. No auto-send in MVP.
- Never invent facts about the business.
- Build the suppression list table now even though you won't use it until Phase 17.

**Done when:** you send 10 real messages generated by TUKLAS and don't feel embarrassed by any of them.

---

### MILESTONE 10 — Observability (week 17)

**Goal:** when something goes wrong, you can see exactly where.

**Build:**
- `/agent-runs` page: list of runs with agent, status, duration, cost
- Click into a run: every tool call with input/output, timing, errors
- Never expose model chain-of-thought — log decisions and tool calls, not hidden reasoning

**Done when:** a campaign fails and you diagnose it from the UI in under two minutes.

This is also the screen that makes your portfolio credible. Most "AI agent" projects have nothing like it.

---

### MILESTONE 11 — Analytics (week 18)

**Goal:** see the funnel.

**Build:** Discovered → Qualified → Contacted → Replied → Meeting → Proposal → Won. Rates between each stage. Per-campaign comparison. Revenue per campaign once you have any.

**Done when:** you can answer "which industry converts best for me?" from the UI.

---

### MILESTONE 12 — Evaluation (weeks 19–20)

**Goal:** know, with numbers, whether TUKLAS is actually good.

This is where most solo projects quietly skip and stay anecdotal forever. Don't.

**Build:**

*The labeled dataset.* 100 businesses, hand-labeled by you:

```csv
business_id,website_exists,website_quality,social_activity,
booking_available,ordering_available,digital_gap,business_activity,
icp_fit,lead_quality
```

`lead_quality` is your judgment: would you call this business? 1–5. This is the ground truth everything is measured against.

Budget a full weekend. It's boring. Do it anyway.

*The evaluation script:*

```python
# scripts/evaluate.py
import pandas as pd
from sklearn.metrics import precision_score, recall_score, f1_score

labeled = pd.read_csv("data/labeled/businesses_100.csv")
preds   = pd.read_csv("data/labeled/agent_output.csv")
df = labeled.merge(preds, on="business_id")

print("Website detection accuracy:",
      (df.website_exists == df.pred_website_exists).mean())

print("Qualification F1:",
      f1_score(df.actual_qualified, df.pred_qualified))

top10 = df.nlargest(10, "score")
print("Precision@10:", top10.actual_qualified.mean())

print("Evidence grounding rate:",
      df.claims_with_evidence.sum() / df.total_claims.sum())

print("AI cost per qualified lead:",
      df.total_cost.sum() / df.pred_qualified.sum())
```

*Track these six numbers:*

| Metric | Target for MVP |
|---|---|
| Website detection accuracy | > 95% |
| Opportunity classification F1 | > 0.70 |
| Precision@10 | > 0.70 |
| Evidence grounding rate | > 0.95 |
| Outreach human rating (1–5) | > 3.5 |
| AI cost per qualified lead | < ₱3 |

**Done when:** `docs/EVALUATION.md` exists with real numbers, including the ones that look bad.

**Also document your failure cases** — wrong website matched to a business, false opportunity, hallucinated claim, crawler timeout, rate limit hit, invalid LLM output, duplicate slipped through. Explain how the system handles each. This section alone will separate your portfolio from 95% of AI projects.

---

### MILESTONE 13 — Beta (weeks 21–24)

**Goal:** 3–5 real freelancers using it, giving you honest feedback.

**Build:** nothing new. Onboard people and watch.

Recruit from your Milestone 0 interview list — they already know what you're building.

**Measure per user:** leads found, leads they accepted, leads contacted, replies, meetings, clients won, hours saved, satisfaction 1–10.

**Watch for the real signal:** do they come back unprompted in week 2? Everything else is noise.

**Do not scale before this works.** If beta users don't return, the answer is not more features.

---

### MILESTONE 14 — Monetization (weeks 25–28)

**Goal:** first peso.

**Test in this order** (cheapest to validate first):

**Option D first — use it yourself.** Run TUKLAS for your own web dev business. Close one ₱30,000 website. That single sale funds a year of infrastructure and proves the product works better than any survey.

**Then Option C — lead-gen service.** Offer 3 beta users: "₱2,000/month for 100 qualified Zamboanga City leads." Manual delivery is fine. You're testing willingness to pay, not building billing.

**Then Option B — per qualified lead.** ₱20–50 per lead they accept.

**Then Option A — SaaS tiers.** Only once manual delivery is your bottleneck.

**Done when:** someone pays you twice without you chasing them.


---

## Part 4 — Frontend UI/UX

### The design problem

TUKLAS shows a freelancer a business and says "this is worth ₱30,000 to you." They will not believe you unless the interface makes the *evidence* feel solid. This isn't a dashboard-design problem, it's a trust problem.

So the design principle is: **evidence is the hero, score is the summary.** Most lead tools show a number and hide the reasoning. Yours shows the reasoning and treats the number as a shortcut.

### Design tokens

Pick these once, put them in `globals.css`, never deviate.

```css
:root {
  /* Base — warm neutral, not the default cold gray */
  --bg:              #FAFAF8;
  --surface:         #FFFFFF;
  --border:          #E8E6E1;
  --text:            #1C1B19;
  --text-muted:      #6B6A65;

  /* Score tiers — the only place strong color appears */
  --score-high:      #1D7A5F;   /* 80+  deep green  */
  --score-mid:       #B87503;   /* 60-79 amber      */
  --score-low:       #8A8A85;   /* <60   gray       */

  /* Evidence semantics */
  --gap:             #C2410C;   /* a missing thing = opportunity */
  --strength:        #1D7A5F;   /* a present thing = signal      */

  /* Interactive */
  --accent:          #1E3A5F;   /* deep navy, not blue-500 */
  --accent-hover:    #16304E;
}
```

**Why these:** the "gap" color is warm orange, not red. A missing website isn't an error — it's money. Making it red teaches users the wrong emotion. Small choice, real impact.

### Typography

```
Display / headings:  Instrument Serif  (or Fraunces)
Body / UI:           Inter
Numbers / data:      JetBrains Mono  — tabular, aligns in tables
```

Use the serif only for the business name on the lead detail page and page titles. Everything else Inter. Scores and counts in mono so columns line up.

The serif is your one deliberate risk. Every SaaS dashboard uses Inter-everything; a serif business name makes the lead page feel like a dossier rather than a CRM row. That's the feeling you want.

### The screens, in build order

**1. Campaign creation** — one column, max 480px wide, generous vertical space. Four questions, one button. This screen should feel like almost nothing, because the value is what happens after.

**2. Campaign running** — stage-by-stage progress with live counts. Not a spinner. People trust systems that show their work: "Discovering… 47 found → Researching… 31/47 → Auditing…"

**3. Dashboard** — four KPI cards, recent campaigns. Numbers in mono, large. Nothing else.

**4. Lead list** — dense table, sorted by score descending. Score cell colored by tier. Evidence count as a small badge. Row click → detail.

**5. Lead detail** — the screen that sells the product. Layout in Milestone 8. Every evidence row has its source URL as a visible, clickable link. Not an icon, not a tooltip — a link.

**6. Agent runs** — monospace, timeline-like, deliberately technical. This screen is allowed to look like a developer tool because that's what it is.

### Component library

Use **shadcn/ui**. Not a template — primitives you own and restyle. Install only what you need:

```bash
npx shadcn@latest add button card table badge dialog \
    select input textarea tabs progress separator toast skeleton
```

Then override the theme in `globals.css` with your tokens above. Do not use shadcn's default palette — that's the "looks like every AI project" trap.

**Charts:** Recharts, styled down. Analytics only. No chart on the lead page.

**Icons:** Lucide (ships with shadcn). Use sparingly — evidence rows use ✓ and ✗ text marks, not icons, because they read faster.

### Templates worth studying (don't copy, steal principles)

| Source | What to take |
|---|---|
| **Linear** | Density without clutter. How they handle status badges and keyboard nav. |
| **Attio** | The best lead/CRM detail page in existence. Study how they show related records. |
| **Vercel dashboard** | Deployment logs → model your agent-runs page on this. |
| **Stripe dashboard** | How to show a number and its supporting breakdown in the same view. |
| **Cal.com** (open source) | Real production Next.js + Postgres app you can read the source of. |

Free starting points: **shadcn/ui blocks** (ui.shadcn.com/blocks) for dashboard shells and tables, **Tremor** for KPI card patterns.

### Using Claude to design this

The workflow that works on your Pro plan:

**Step 1 — Claude Design, one screen at a time.** Never "design TUKLAS." Always "design the lead detail screen." Paste the design tokens above into every prompt so screens stay consistent.

```
Design the lead detail screen for TUKLAS, a lead-intelligence tool
for Filipino freelancers selling web services to local businesses.

Use these exact tokens: [paste the CSS variables]
Typography: Instrument Serif for the business name, Inter for UI,
JetBrains Mono for the score and numbers.

Content: business name "ABC Salon", location "Tetuan, Zamboanga
Oro", score 94. Four evidence rows, each with a claim and a visible
source link: no website (gap), active Facebook posting weekly
(strength), 340 reviews at 4.6 stars (strength), no online booking
(gap). Recommended service: "Website + appointment booking". Sales
angle: two sentences. Primary action: "Generate outreach". Status
dropdown currently "NEW".

The evidence section is the hero — it should feel like proof, not
decoration. Score is a summary, not the point. Desktop first.
```

**Step 2 — iterate in the same session.** "Make the evidence rows more prominent." "The score is too loud, reduce it." Cheap, fast.

**Step 3 — Claude Code implements it.** Paste the approved design + your tokens, ask for the React component only.

**Model:** Sonnet 4.6 for everything. It's the Pro default and handles UI design well. Don't burn quota reaching for anything heavier.

### MCP servers worth connecting

MCP lets Claude Code talk to your actual tools instead of guessing. The ones that genuinely help here:

| MCP | Why it helps TUKLAS |
|---|---|
| **Filesystem** | Claude Code reads your real component files before editing — stops it inventing prop names |
| **PostgreSQL** | Claude sees your actual schema when writing queries. Big accuracy win from Milestone 2 on. |
| **GitHub** | Reads issues/PRs, keeps context across sessions |
| **Playwright / Puppeteer** | Claude can screenshot your running UI and critique its own work |
| **Figma** (if you use it) | Pull design specs directly into implementation |

Setup is a JSON config in Claude Code settings. Add Filesystem and PostgreSQL first — those two do most of the work. Check current setup docs at docs.claude.com since MCP config changes.

### Quality floor (non-negotiable)

- Responsive to 375px — Filipino freelancers work on phones constantly
- Visible keyboard focus rings
- `prefers-reduced-motion` respected
- Every loading state is a skeleton, not a spinner
- Every empty state says what to do next, not "no data"
- Every error says what broke and how to fix it

---

## Part 5 — Pages & component architecture

This is the complete frontend map: every page, every route, and every reusable component. Build these in the order Part 3 specifies — this Part is the reference for *what exists*, not *when to build it*. Most of these pages come online during Milestone 8; auth pages during Milestone 1; admin during Milestone 13+.

### Four zones

The app splits into four zones with different access rules:

| Zone | Who sees it | Route prefix | Built in |
|---|---|---|---|
| Public | Anyone, logged out | `/`, `/login`, etc. | Milestone 1 |
| Onboarding | New users, once | `/onboarding/*` | Milestone 8 |
| App | Authenticated users | `/dashboard`, `/leads`, etc. | Milestone 8 |
| Admin | Admin accounts only | `/admin/*` | Milestone 13+ |

### First-open experience

A logged-out visitor lands on `/` (the marketing landing page), NOT the dashboard. A logged-in user hitting `/` gets redirected straight to `/dashboard`. New signups go through email verification, then the onboarding flow, then land on the dashboard and never see onboarding again.

```
First visit → Landing (/) → Sign up → Verify email
   → Onboarding (5 steps) → Dashboard → [normal app use]

Returning logged-in user → any URL → straight to app
```

### Complete route map (38 routes)

```
PUBLIC (6)
  /                         Landing page (marketing)
  /login                    Login
  /signup                   Register
  /forgot-password          Request reset link
  /reset-password           Set new password (token in URL)
  /verify-email             Email verification (token in URL)

ONBOARDING (5) — new users only, shown once
  /onboarding/welcome       Intro, what to expect
  /onboarding/services      What do you sell?
  /onboarding/market        Target industries + location
  /onboarding/pricing       Client budget range
  /onboarding/ready         Confirmation → dashboard

APP (20 pages/views) — authenticated
  /dashboard                Home: KPIs + recent campaigns
  /campaigns                Campaign list
  /campaigns/new            Create campaign (the 4-question form)
  /campaigns/[id]           Campaign detail / results overview
  /campaigns/[id]/run       Live running state (pipeline progress)
  /leads                    All leads across campaigns
  /leads/[id]               Lead detail (the hero screen)
  /leads/[id]#evidence      Evidence tab
  /leads/[id]#outreach      Outreach draft tab
  /leads/[id]#activity      Activity history tab
  /outreach                 All outreach messages (drafts + sent)
  /analytics                Funnel + conversion charts
  /runs                     Agent runs list (observability)
  /runs/[id]                Single run detail (tool calls)
  /settings                 Settings shell (redirects to profile)
  /settings/profile         Name, avatar, services, ICP core
  /settings/account         Email, password, delete account
  /settings/icp             Detailed ideal-customer-profile fields
  /settings/notifications   Notification toggles
  /settings/billing         Plan, usage, payment (Phase 3 only)

ADMIN (7) — admin accounts only; non-admins get 403
  /admin                    Aggregate system metrics
  /admin/users              All users
  /admin/users/[id]         Single user detail
  /admin/runs               All agent runs across everyone
  /admin/system             System health, queue depth, error rates
  /admin/billing            Revenue, subscriptions (Phase 3)
  /admin/flags              Feature flags per user / global
```

### Two dashboards, kept separate

There are two distinct dashboards and they must not share routes or navigation.

The user dashboard (`/dashboard`) is every user's home inside the app — their own KPIs, their own campaigns, their own lead activity. A user has zero visibility into other users or system internals.

The admin dashboard (`/admin`) is a separate zone gated on an `is_admin` flag in the database. It has its own sidebar, shows aggregate metrics across all users, all agent runs, system health, and (in Phase 3) billing and feature flags. Any request to `/admin/*` from a non-admin account returns 403 — enforce this in the backend, not just by hiding the nav link.

### The landing page (`/`)

Five sections, in order:

Hero — one headline, one subheadline, two CTAs ("Get started free" / "See how it works"), and a subtle animated mockup of the lead detail screen.

Problem — three short columns naming the pain: hours wasted on dead leads, no way to know who actually needs you, outreach that goes nowhere.

How it works — four numbered steps with icons: describe your service → system finds matches → evidence explained → draft and send.

Social proof — three testimonial cards from beta freelancers (placeholders until you have real ones).

Pricing / waitlist — three tiers in Stage 3; a simple "Join the waitlist" block in Stages 1–2.

Footer — nav links, socials, and legal pages (Privacy Policy and Terms of Service, both required before any public launch).

### The layout shell (present on every app page)

These wrap every authenticated page. Build them once in Milestone 8 as an `AppShell` component.

Sidebar — 64px wide, icon-only, fixed left. Six items: Dashboard, Campaigns, Leads, Outreach, Analytics, Settings. Active item highlighted navy. Logo top, user avatar bottom. Collapses to a bottom bar under 768px.

Top bar — spans the content area. Left: breadcrumb trail. Right: notification bell, command-palette trigger, user avatar. Fixed while content scrolls.

Breadcrumb — inside the top bar; every crumb links except the current page. Matters for nested routes like `/campaigns/[id]/run`.

Mobile bottom navigation — replaces the sidebar under 768px. Five tabs (Dashboard, Campaigns, Leads, Outreach, Settings), icon + label, fixed bottom.

Page header — first element in each page's content: title (serif), subtitle (muted), primary action button right-aligned. Absent on landing and auth pages.

### Global overlays (triggered on demand)

Command palette — Cmd/Ctrl+K or the top-bar search icon. Live search across leads, campaigns, settings; recents when empty; closes on Escape. The fastest way to jump to a lead by business name.

User menu — dropdown from the avatar. Name, email, plan badge; links to Profile, Billing, Help, Log out.

Toast notifications — slide in bottom-right. Success (green), error (red), info (neutral). Auto-dismiss after 4s except errors. Max two at once.

Confirm dialog — centered modal for destructive actions only (delete campaign, remove lead, clear drafts). Cancel + confirm. Never for reversible actions.

Floating settings panel — slide-over from the right for contextual quick-actions. On the lead detail page: change status, edit tags, archive, delete. Not a full settings page — just record-level actions.

Notification panel — dropdown below the bell. Recent events ("Campaign complete — 32 leads found", "Draft ready for La Bella Salon"). Empty state: "No new notifications."

### Page-specific components

KPI card — white card, large mono number, muted label. Fours on the dashboard and atop campaign detail. Colored by context (qualified in green, contacted in navy).

Campaign card — in the campaign list: name, industry tags, location, counts, status badge, date. Click → campaign detail.

Progress stage row — on the running state: stage name, state (waiting / in-progress / complete), live mono count. In-progress row pulses subtly.

Lead table — the main grid on `/leads`. Sortable (score default), filterable (score range, status, industry). Row: business, score badge, status badge, signal tags, location, View link.

Score badge — rounded pill with a number. Deep green 80+, amber 60–79, gray under 60. Used in tables, lead headers, campaign summaries.

Status badge — pipeline stage pill: New, Contacted, Replied, Meeting, Proposal, Won, Not a fit. Each its own color. Clickable on lead detail to change.

Signal tag — tiny pill previewing evidence in the table. Orange = gap (no website, no booking), green = strength (active social, many reviews). Show 2–3 with "+N more".

Evidence row — the core of the lead detail page. Colored dot (orange gap / green strength), claim in plain language, visible source link. Never an icon, never a tooltip — the link must be readable at a glance. This component carries the product's credibility.

Score breakdown accordion — below the main score on lead detail. Expands to show each weighted factor and its contribution. Transparency into why a lead ranked where it did.

Message editor — rich text area on the outreach tab. Shows the AI draft, fully editable. Approve button (→ Contacted) + copy-to-clipboard. No send button in MVP.

Note input — borderless textarea at the bottom of lead detail. Saves on blur, shows "Saved" + timestamp.

Activity timeline — the lead's activity tab. Chronological log of status changes, notes, outreach events; each with timestamp, type icon, description.

Agent run row — on `/runs` and `/admin/runs`: agent name, status badge, business count, duration (mono), AI cost (mono), completed time.

Tool call row — inside run detail: tool name (mono), input summary, duration, outcome. The most granular view in the product.

Funnel chart — on analytics: horizontal bars per pipeline stage with conversion percentages between them. Side-by-side bars when comparing campaigns.

Skeleton loaders — every page has one matching its layout (the lead table shows ~8 placeholder rows). Never a spinner.

Empty states — every list page. Not "No data." Instead: "You haven't run any campaigns yet" + a "Create your first campaign" button; "No leads match these filters" + "Clear filters". An invitation, not an error.

### Settings subpages

Profile — name, avatar, services description (the main free-text ICP field), target industries, target locations, price range. This data drives every campaign.

Account — email, password change, danger zone (delete account).

My ICP — expanded ICP fields: ideal client budget, industries to avoid, notes on what makes a bad lead.

Notifications — toggles: campaign complete, new qualified leads, reply received, weekly digest.

Billing — Phase 3 only: current plan, usage, upgrade/downgrade, payment method, invoices.

### Frontend routing rules for Claude Code

When implementing, enforce these so the zones stay clean:

- Logged-out user hitting any App or Admin route → redirect to `/login` with a `?next=` param.
- Logged-in user hitting `/`, `/login`, or `/signup` → redirect to `/dashboard`.
- New user who hasn't finished onboarding → redirect any App route to `/onboarding/welcome` until complete.
- Non-admin hitting `/admin/*` → 403 from the backend, not just a hidden link.
- The `AppShell` (sidebar + top bar) wraps App routes only. Public, onboarding, and auth pages render without it.

---

## Part 6 — After the MVP

### Short-term goals (months 1–7)

1. Twenty validation interviews done and synthesized
2. Working end-to-end pipeline producing real Zamboanga City leads
3. Evaluation metrics documented, including failures
4. Three to five beta users, with at least two returning weekly
5. One client closed using TUKLAS-sourced leads — ideally your own
6. First payment received

### Long-term goals (months 8–24)

1. Twenty to fifty paying users
2. Conversion outcomes feeding a trained ranking model
3. Cost per qualified lead under ₱1
4. Expansion beyond Zamboanga City to Metro Manila, Cebu, and Davao
5. Portfolio piece that gets you hired if the startup doesn't work

That last one matters. Even in the failure case, you end up with a production AI system with evaluation, observability, and real users — which is a stronger portfolio than most people with jobs have.

### The upgrade path (spend money only when revenue justifies it)

| Layer | Phase 1 · ₱0–800/mo | Phase 2 · ₱3–12k/mo | Phase 3 · ₱30k+/mo |
|---|---|---|---|
| LLM | Ollama local | Claude Haiku + Sonnet | Routed by task tier |
| Business data | Maps scraping | Google Places API | Apollo / Hunter |
| Research | httpx + BS4 | + ScrapingBee proxies | BrightData |
| Orchestration | Celery | Celery | LangGraph |
| Database | Railway free PG | Supabase managed | Supabase Pro + pgvector |
| Hosting | Railway free | Railway paid | AWS / GCP |
| Observability | DB logs | Sentry + PostHog | LangSmith |
| Email | Resend free | Resend paid | Postmark |
| Scoring | Rules | Rules + LLM reasoning | Trained ML model |

**Because of the two interfaces in Part 2, every one of these upgrades is a single-file swap.** Nothing else in the codebase knows or cares.

### Future improvements, in order of value

**Near-term (right after MVP):**
- Website mockup generation — "here's what your booking page could look like" attached to outreach. This is the killer feature in the spec. It turns "here are leads" into "here's a sales opportunity and the assets to pursue it."
- Saved ICP templates so users don't re-enter their profile each campaign
- Bulk actions on the lead list
- CSV export

**Mid-term (after paying users):**
- Conversion prediction model trained on real outcomes
- AI analytics narration — "your salon campaign converts 12% better than restaurants; leads with active social and no booking convert best"
- Follow-up sequencing with approval gates
- Similar-customer discovery: "find more businesses like the ones you closed"

**Long-term (real scale):**
- Natural-language command center over your own data
- Automated sending with full compliance (opt-out, suppression, sender identity, bounce handling)
- Team accounts and shared pipelines
- API for agencies to integrate

### The actual moat

Not the scraper. Anyone can scrape Google Maps.

It's the loop: more users → more businesses analyzed → more outreach sent → more outcomes recorded → more conversion data → better ranking → better leads → more users.

Every campaign a user runs makes the next user's leads slightly better. That compounds and can't be bought with an API subscription. Start recording outcomes from Milestone 9 even though the model doesn't exist until Phase 15 — you can't train on data you didn't collect.

---

## Part 7 — Working rhythm with Claude Pro

### The prompt discipline that keeps you within quota

Every session starts with this frame:

```
We are on Milestone N of TUKLAS. Do not implement future milestones.
Explain the implementation plan, create the necessary files, implement
only this milestone, run the tests, and wait for my approval before
proceeding.
```

That sentence is the difference between a codebase you understand and 20,000 lines you don't.

### Practical quota management

- **One milestone per session, scoped small.** "Implement the website analyzer" not "build the agent layer."
- **`/clear` between unrelated tasks** — stops stale context burning tokens
- **Default to Sonnet.** Reserve heavier models for genuine architecture decisions.
- **Keep `docs/BUILD_GUIDE.md` and `docs/DECISIONS.md` in the repo** and point Claude at them instead of re-explaining the project every session
- **Check `/usage` regularly** so you're not surprised mid-milestone
- **Separate planning (chat) from building (Claude Code)** — they share the same weekly pool, so heavy chat research during the day costs you build capacity at night
- **Watch for `ANTHROPIC_API_KEY`** in your environment — if it's set, Claude Code silently bills the API instead of your subscription. Run `/login` to fix.

### Weekly rhythm that works solo

```
Mon    Plan the week's milestone. Write down the "done when" test.
Tue-Thu  Build. One focused session per day, one thing per session.
Fri    Test, fix, commit, update DECISIONS.md with what you chose and why.
Sat    Talk to one potential user. Every single week, no exceptions.
Sun    Off. Seriously.
```

That Saturday conversation is not optional. It's the thing that prevents you building the wrong product beautifully.

### The question to ask before every feature

> Does this help the user discover, understand, prioritize, contact, or convert a valuable business opportunity?

If no, it doesn't go in the MVP. Not "it's cool." Not "it's technically interesting." Not "competitors have it."

---

## Part 8 — Risk register

| Risk | Likelihood | Impact | What you do about it |
|---|---|---|---|
| Google Maps blocks your scraper | High | High | Provider interface makes swapping to Places API a one-file change. Test the API path early. |
| Nobody wants to pay | Medium | Fatal | Milestone 0 finds this in week 2 for ₱0. Stage 1 (use it yourself) means you profit even if nobody else pays. |
| Scope creep into the "OS" vision | High | High | The milestone gates. Do not start N+1 until N's "done when" passes. |
| Ollama quality too low for scoring | Medium | Medium | Deterministic layer does most of the work. LLM only refines. Upgrade to Claude API in Phase 2. |
| You burn out around month 4 | Medium | High | Sunday off. Weekly user conversations keep motivation real. Ship Milestone 8 early so you can *see* the product. |
| SSRF or scraping legal issue | Low | High | ssrf.py from Milestone 4. Respect robots.txt, rate limits. Never bypass CAPTCHAs or auth. |
| Outreach compliance problem | Low | High | Human-in-the-loop only. No auto-send in MVP. Research PH cold-outreach rules before Phase 17. |
| Evaluation reveals scoring is bad | Medium | Medium | That's the *point* of Milestone 12. Finding it at 100 labeled businesses is cheap. Tune weights and re-run. |

---

## Appendix — Milestone checklist

```
[ ] 0   20 validation interviews, synthesized
[ ] 1   Skeleton, Docker Compose, JWT auth, CI
[ ] 2   Full schema, RLS, cross-user isolation test passing
[ ] 3   Discovery agent, 50 real businesses, zero duplicates
[ ] 4   Website analyzer, correct on 20 hand-checked sites
[ ] 5   Research agent, every claim has a source URL
[ ] 6   Audit agent, structured output, evidence-linked
[ ] 7   Scoring, top 10 leads you'd actually call
[ ] 8   Dashboard + lead detail, no terminal needed
[ ] 9   Outreach drafts you'd send unedited
[ ] 10  Agent runs inspectable in the UI
[ ] 11  Funnel analytics
[ ] 12  100 labeled businesses, EVALUATION.md written
[ ] 13  3-5 beta users, 2 returning weekly
[ ] 14  First payment received
[ ] 15+ Advanced AI — only now
```

---

*Build the smallest system that creates measurable value. Everything else is a distraction until that works.*
