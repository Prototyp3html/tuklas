"""Opportunity-scoring runner (Milestone 7) — the first stage that calls an LLM.

Two layers per business:
  1. `score_lead` — a transparent weighted score written to `lead_scores` with its
     full `{factor: points}` breakdown. Deterministic, always runs.
  2. When that score is >= `threshold`, one `LLMProvider.complete_structured` call
     for an `OpportunityAnalysis`. Every `evidence_id` it cites must be a real row
     for that business; otherwise it is retried once, then logged to `agent_errors`
     and skipped. A validated result becomes a `lead_opportunities` row. **An
     ungrounded conclusion is never persisted.**

The deterministic scores always commit. The run is marked `failed` only if the
LLM layer was entirely non-functional (every business it was attempted on
failed). A business that qualifies deterministically but has no evidence to cite
is counted as qualified and skips Layer 2 without being a failure.
Idempotent: `lead_scores` and `lead_opportunities` are upserted by primary key;
a re-run that drops a lead below `threshold` deletes its stale opportunity row.
"""

from __future__ import annotations

from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.agents.base import agent_run
from backend.agents.opportunity.prompt import build_opportunity_prompt
from backend.agents.opportunity.score import ScoreInputs, score_lead
from backend.agents.opportunity.weights import DEFAULT_WEIGHTS, LLM_THRESHOLD, MODEL_VERSION
from backend.models import (
    AgentErrorRow,
    AgentRun,
    Business,
    BusinessEvidence,
    Campaign,
    DigitalAudit,
    LeadOpportunity,
    LeadScore,
    UserProfile,
)
from backend.models.enums import AgentName, RunStatus, SocialPresence, WebsiteStatus
from backend.providers.llm.base import LLMProvider
from backend.schemas.opportunity import OpportunityAnalysis, OpportunityResult

_LLM_ATTEMPTS = 2


def _score_inputs(
    biz: Business,
    audit: DigitalAudit | None,
    evidence: list[BusinessEvidence],
    campaign: Campaign,
) -> ScoreInputs:
    return ScoreInputs(
        has_website=audit.has_website if audit else bool(biz.domain),
        website_status=audit.website_status if audit else WebsiteStatus.NONE,
        has_booking=audit.has_booking if audit else False,
        has_ordering=audit.has_ordering if audit else False,
        social_presence=audit.social_presence if audit else SocialPresence.NONE,
        campaign_service=campaign.service,
        campaign_industries=list(campaign.industries),
        campaign_location=campaign.location,
        business_category=biz.category,
        business_address=biz.address,
        evidence_claims={e.claim for e in evidence},
    )


def _log_error(
    session: AsyncSession, run: AgentRun, *, error_type: str, message: str
) -> None:
    session.add(
        AgentErrorRow(
            run_id=run.id,
            user_id=run.user_id,
            error_type=error_type,
            message=message[:2000],
        )
    )


async def _analyse(
    llm: LLMProvider,
    prompt: str,
    real_ids: set[UUID],
    *,
    session: AsyncSession,
    run: AgentRun,
    business_id: UUID,
) -> OpportunityAnalysis | None:
    """Up to two attempts. Returns a grounded analysis or None (logged)."""
    for _ in range(_LLM_ATTEMPTS):
        try:
            result = await llm.complete_structured(
                prompt, OpportunityAnalysis, tier="cheap"
            )
        except Exception as exc:  # provider unreachable / bad shape after its own retry
            _log_error(
                session, run, error_type="llm_error",
                message=f"{type(exc).__name__}: {exc} (business {business_id})",
            )
            continue
        cited = set(result.evidence_ids)
        unknown = cited - real_ids
        if not cited or unknown:
            _log_error(
                session, run, error_type="ungrounded",
                message=(
                    f"business {business_id}: cited {len(cited)} ids, "
                    f"{len(unknown)} not in evidence store"
                ),
            )
            continue
        return result  # type: ignore[return-value]
    return None


async def run_opportunity(
    session: AsyncSession,
    campaign: Campaign,
    *,
    llm: LLMProvider,
    weights: dict[str, int] = DEFAULT_WEIGHTS,
    threshold: int = LLM_THRESHOLD,
) -> OpportunityResult:
    qualified = llm_calls = llm_failures = 0

    async with agent_run(session, campaign=campaign, agent=AgentName.OPPORTUNITY) as run:
        businesses = list((await session.execute(select(Business))).scalars().all())
        audits = {
            a.business_id: a
            for a in (await session.execute(select(DigitalAudit))).scalars().all()
        }
        ev_by_biz: dict[UUID, list[BusinessEvidence]] = {}
        for row in (await session.execute(select(BusinessEvidence))).scalars().all():
            ev_by_biz.setdefault(row.business_id, []).append(row)
        profile = await session.get(UserProfile, campaign.user_id)

        for biz in businesses:
            rows = ev_by_biz.get(biz.id, [])
            audit = audits.get(biz.id)
            score, breakdown = score_lead(
                _score_inputs(biz, audit, rows, campaign), weights
            )

            ls = await session.get(LeadScore, (biz.id, campaign.id))
            if ls is None:
                ls = LeadScore(
                    business_id=biz.id, campaign_id=campaign.id, user_id=campaign.user_id
                )
                session.add(ls)
            ls.score = score
            ls.breakdown = breakdown
            ls.model_version = MODEL_VERSION
            ls.scored_at = datetime.now(UTC)

            existing_opp = await session.get(LeadOpportunity, biz.id)
            if score < threshold:
                if existing_opp is not None:  # re-run dropped it below the cutoff
                    await session.delete(existing_opp)
                continue

            qualified += 1
            if not rows:
                # Deterministically qualified, but the LLM layer has nothing to
                # cite — Layer 2 needs evidence by definition. Not a failure.
                continue

            prompt = build_opportunity_prompt(biz, audit, rows, profile, campaign)
            analysis = await _analyse(
                llm,
                prompt,
                {e.id for e in rows},
                session=session,
                run=run,
                business_id=biz.id,
            )
            if analysis is None:
                llm_failures += 1
                continue

            llm_calls += 1
            if existing_opp is None:
                existing_opp = LeadOpportunity(
                    business_id=biz.id, user_id=campaign.user_id
                )
                session.add(existing_opp)
            existing_opp.recommended_service = analysis.recommended_service
            existing_opp.sales_angle = analysis.sales_angle
            existing_opp.reasoning = analysis.reasoning
            existing_opp.confidence = analysis.confidence

        await session.flush()
        run.business_count = len(businesses)
        attempted = llm_calls + llm_failures
        if attempted and llm_failures == attempted:  # LLM layer entirely non-functional
            run.status = RunStatus.FAILED

    return OpportunityResult(
        run_id=run.id,
        campaign_id=campaign.id,
        status=run.status,
        scored=len(businesses),
        qualified=qualified,
        llm_calls=llm_calls,
        llm_failures=llm_failures,
        duration_ms=run.duration_ms or 0,
    )
