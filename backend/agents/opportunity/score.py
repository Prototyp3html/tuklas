"""Layer-1 opportunity score — pure, deterministic, no I/O, no LLM.

`score_lead` maps a business's audit verdict + evidence + campaign fit onto a
`{factor: points}` breakdown; the score is the capped sum of those points. The
breakdown is stored so the total stays auditable independently of the evidence
rows (`frontend/lib/types.ts` `LeadDetail.breakdown` sums to `LeadDetail.score`).
"""

from __future__ import annotations

from dataclasses import dataclass

from backend.agents.opportunity.weights import DEFAULT_WEIGHTS
from backend.models.enums import ScoreTier, SocialPresence, WebsiteStatus

_BOOKING_SERVICE_HINTS = (
    "book",
    "appointment",
    "reservation",
    "salon",
    "spa",
    "barber",
    "dental",
    "dentist",
    "clinic",
    "grooming",
)
_ORDERING_SERVICE_HINTS = (
    "order",
    "delivery",
    "menu",
    "restaurant",
    "food",
    "cafe",
    "eatery",
    "catering",
    "bakery",
)


def _wants(service: str, hints: tuple[str, ...]) -> bool:
    s = service.casefold()
    return any(h in s for h in hints)


@dataclass(frozen=True)
class ScoreInputs:
    has_website: bool
    website_status: WebsiteStatus
    has_booking: bool
    has_ordering: bool
    social_presence: SocialPresence
    campaign_service: str
    campaign_industries: list[str]
    campaign_location: str
    business_category: str | None
    business_address: str | None
    evidence_claims: set[str]  # {"phone", "email", "facebook_url", ...}


def _industry_match(industries: list[str], category: str | None) -> bool:
    if not category:
        return False
    cat = category.casefold()
    return any(i.casefold() in cat for i in industries if i)


def _location_match(location: str, address: str | None) -> bool:
    if not address:
        return False
    tail = location.split(",")[-1].strip().casefold()  # "…, Zamboanga City" -> "zamboanga city"
    return bool(tail) and tail in address.casefold()


def score_lead(
    inp: ScoreInputs, weights: dict[str, int] = DEFAULT_WEIGHTS
) -> tuple[int, dict[str, int]]:
    """Return `(score 0..100, breakdown)` where breakdown holds only the factors
    that fired. `sum(breakdown.values()) == score` unless the sum exceeded 100."""
    fired: list[str] = []

    # Website quality — mutually exclusive, worst wins (mirrors derive_digital_gaps).
    if not inp.has_website:
        fired.append("no_website")
    elif inp.website_status is WebsiteStatus.BROKEN:
        fired.append("broken_website")
    elif inp.website_status is WebsiteStatus.OUTDATED:
        fired.append("outdated_website")

    if (
        inp.has_website
        and not inp.has_booking
        and _wants(inp.campaign_service, _BOOKING_SERVICE_HINTS)
    ):
        fired.append("no_booking")
    if (
        inp.has_website
        and not inp.has_ordering
        and _wants(inp.campaign_service, _ORDERING_SERVICE_HINTS)
    ):
        fired.append("no_ordering")

    if inp.social_presence in (SocialPresence.ACTIVE, SocialPresence.VERY_ACTIVE):
        fired.append("active_social")

    if {"phone", "email"} & inp.evidence_claims:
        fired.append("contactable")

    if _industry_match(inp.campaign_industries, inp.business_category):
        fired.append("industry_match")
    if _location_match(inp.campaign_location, inp.business_address):
        fired.append("location_match")

    breakdown = {f: weights[f] for f in fired if weights.get(f, 0)}
    return min(100, sum(breakdown.values())), breakdown


def tier_for(score: int) -> ScoreTier:
    if score >= 80:
        return ScoreTier.HIGH
    if score >= 50:
        return ScoreTier.MID
    return ScoreTier.LOW
