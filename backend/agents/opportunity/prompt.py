"""The opportunity-analysis prompt.

A deterministic string builder — the runner hands the output to
`LLMProvider.complete_structured(..., OpportunityAnalysis)`. Every evidence row is
printed with its id so the model can cite only ids that actually exist.
"""

from __future__ import annotations

from backend.models import Business, BusinessEvidence, Campaign, DigitalAudit, UserProfile


def _profile_block(profile: UserProfile | None) -> str:
    if profile is None:
        return "The freelancer has not filled in a profile."
    lines = [
        f"Services offered: {', '.join(profile.services) or '—'}",
        f"Target industries: {', '.join(profile.target_industries) or '—'}",
        f"Target locations: {', '.join(profile.target_locations) or '—'}",
        f"Typical project price: {profile.price_range_min}–{profile.price_range_max} PHP",
    ]
    if profile.icp_notes:
        lines.append(f"Notes on ideal customer: {profile.icp_notes}")
    return "\n".join(lines)


def _audit_block(audit: DigitalAudit | None) -> str:
    if audit is None:
        return "No digital audit on file."
    return "\n".join(
        [
            f"Has website: {audit.has_website} (status: {audit.website_status.value})",
            f"Online booking: {audit.has_booking}   Online ordering: {audit.has_ordering}",
            f"Mobile friendly: {audit.mobile_friendly}",
            f"Social presence: {audit.social_presence.value}",
            f"Digital gaps: {', '.join(audit.digital_gaps) or 'none found'}",
        ]
    )


def _evidence_block(evidence: list[BusinessEvidence]) -> str:
    if not evidence:
        return "(no evidence collected)"
    return "\n".join(
        f"- {e.id} | {e.claim} = {e.observed_value}  (source: {e.source_url})"
        for e in evidence
    )


def build_opportunity_prompt(
    business: Business,
    audit: DigitalAudit | None,
    evidence: list[BusinessEvidence],
    profile: UserProfile | None,
    campaign: Campaign,
) -> str:
    return f"""You are helping a freelance web developer decide whether a local \
business is worth pitching.

## The freelancer
{_profile_block(profile)}

## The campaign
Service being sold: {campaign.service}
Industries: {', '.join(campaign.industries) or '—'}
Location: {campaign.location}

## The business
Name: {business.name}
Category: {business.category or '—'}
Address: {business.address or '—'}
Website domain: {business.domain or '(none)'}

## Digital audit
{_audit_block(audit)}

## Evidence (cite ONLY these ids)
{_evidence_block(evidence)}

## Your task
Return an OpportunityAnalysis JSON object:
- score: 0-100, how strong this lead is for the freelancer's service
- recommended_service: the single service to lead the pitch with
- sales_angle: one sentence the freelancer could open with
- reasoning: 2-3 sentences, grounded in the evidence above
- confidence: 0-1
- evidence_ids: the ids from the Evidence section that support your reasoning. \
Use only ids listed above. If there is no supporting evidence, return an empty list.
"""
