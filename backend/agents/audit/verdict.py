"""Deterministic audit verdict — the M6 composition step.

M4's `check_website` writes the site-derived fields of `digital_audits`; M5's
research writes cited `business_evidence` rows. M6 reads both and derives the
rest of the verdict — `social_presence`, `digital_gaps`, `confidence` — plus a
`kind` (`gap` | `strength`) for every evidence row. No LLM, no I/O, no DB here:
these are pure functions over already-collected data.
"""

from __future__ import annotations

from dataclasses import dataclass

from backend.models import BusinessEvidence
from backend.models.enums import EvidenceKind, SocialPresence, WebsiteStatus

# Audience size is a *proxy* for activity: no post-recency signal is collected
# anywhere yet (that needs the Facebook page's post timestamps — a research
# follow-up). Presence of a link, then follower/like counts, is the best we have.
_ACTIVE_SOCIAL_AUDIENCE = 300
_VERY_ACTIVE_SOCIAL_AUDIENCE = 1500

_SOCIAL_LINK_CLAIMS = ("facebook_url", "instagram_url", "social_url")
_SOCIAL_COUNT_CLAIMS = ("facebook_followers", "facebook_likes")

# Gap slugs. The first three of the website group match `ScoreFactor` values
# verbatim (`no_website` / `broken_website` / `outdated_website`), as do
# `no_booking` / `no_ordering`, so M7 can map them straight onto weights. The
# rest (`basic_website`, `not_mobile_friendly`, `weak_social_presence`,
# `no_public_contact`) are M6-only and carry no scoring factor.
GAP_NO_WEBSITE = "no_website"
GAP_BROKEN_WEBSITE = "broken_website"
GAP_OUTDATED_WEBSITE = "outdated_website"
GAP_BASIC_WEBSITE = "basic_website"
GAP_NOT_MOBILE_FRIENDLY = "not_mobile_friendly"
GAP_NO_BOOKING = "no_booking"
GAP_NO_ORDERING = "no_ordering"
GAP_WEAK_SOCIAL_PRESENCE = "weak_social_presence"
GAP_NO_PUBLIC_CONTACT = "no_public_contact"


@dataclass(frozen=True)
class AuditInputs:
    """Everything the verdict needs, pulled from the `digital_audits` row and the
    business's `business_evidence` rows."""

    has_website: bool
    website_status: WebsiteStatus
    has_booking: bool
    has_ordering: bool
    mobile_friendly: bool | None
    evidence: list[BusinessEvidence]


def _as_int(value: str) -> int:
    try:
        return int(value.strip().replace(",", ""))
    except ValueError:
        return 0


def _claims(evidence: list[BusinessEvidence]) -> set[str]:
    return {e.claim for e in evidence}


def classify_social_presence(evidence: list[BusinessEvidence]) -> SocialPresence:
    """`none` (no link) → `inactive` (link, tiny/unknown audience) → `active` →
    `very_active`, bucketed on the largest follower/like count seen."""
    if not any(c in _claims(evidence) for c in _SOCIAL_LINK_CLAIMS):
        return SocialPresence.NONE

    audience = max(
        (_as_int(e.observed_value) for e in evidence if e.claim in _SOCIAL_COUNT_CLAIMS),
        default=0,
    )
    if audience >= _VERY_ACTIVE_SOCIAL_AUDIENCE:
        return SocialPresence.VERY_ACTIVE
    if audience >= _ACTIVE_SOCIAL_AUDIENCE:
        return SocialPresence.ACTIVE
    return SocialPresence.INACTIVE


def derive_digital_gaps(inp: AuditInputs) -> list[str]:
    """Stable, ordered list of gap slugs — the deterministic verdict M7 scores."""
    gaps: list[str] = []

    if not inp.has_website:
        gaps.append(GAP_NO_WEBSITE)
    elif inp.website_status is WebsiteStatus.BROKEN:
        gaps.append(GAP_BROKEN_WEBSITE)
    elif inp.website_status is WebsiteStatus.OUTDATED:
        gaps.append(GAP_OUTDATED_WEBSITE)
    elif inp.website_status is WebsiteStatus.BASIC:
        gaps.append(GAP_BASIC_WEBSITE)

    if inp.has_website:
        if inp.mobile_friendly is False:
            gaps.append(GAP_NOT_MOBILE_FRIENDLY)
        if not inp.has_booking:
            gaps.append(GAP_NO_BOOKING)
        if not inp.has_ordering:
            gaps.append(GAP_NO_ORDERING)

    if classify_social_presence(inp.evidence) in (
        SocialPresence.NONE,
        SocialPresence.INACTIVE,
    ):
        gaps.append(GAP_WEAK_SOCIAL_PRESENCE)

    claims = _claims(inp.evidence)
    if "phone" not in claims and "email" not in claims:
        gaps.append(GAP_NO_PUBLIC_CONTACT)

    return gaps


def score_confidence(inp: AuditInputs) -> float:
    """How much signal fed the verdict, in [0, 1]. A clear website read (either
    way) and corroborating research rows raise it; a bare discovery record floors
    it around 0.35–0.5."""
    c = 0.35  # name / category / domain-or-not always come from discovery
    if inp.has_website and inp.website_status is not WebsiteStatus.NONE:
        c += 0.30
    elif not inp.has_website:
        c += 0.15  # "no site" is a real, if weaker, signal
    c += min(0.30, 0.10 * len(inp.evidence))  # saturates at 3 evidence rows
    return round(min(c, 1.0), 2)


def classify_evidence_kind(claim: str, observed_value: str) -> EvidenceKind:
    """Every research row is a point for (`strength`) or against (`gap`) the
    business. Total by design — an unrecognised claim falls through to
    `strength` so a later milestone's new claim key can't fail the run."""
    if claim == "website_reachable":
        return EvidenceKind.STRENGTH if observed_value == "true" else EvidenceKind.GAP
    if claim == "website_last_seen":
        return EvidenceKind.GAP  # a stale copyright year
    # phone / email / socials / address / follower counts — corroborating strengths
    return EvidenceKind.STRENGTH
