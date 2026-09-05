"""Layer-1 scoring knobs — the transparent, no-LLM part of opportunity scoring.

Keys are `ScoreFactor` values (mirrored in `frontend/lib/types.ts`). Points come
from the BUILD_GUIDE WEIGHTS table — start here, tune from real campaign feedback.
`run_opportunity(..., weights=...)` takes an override so a caller can experiment.
"""

from __future__ import annotations

DEFAULT_WEIGHTS: dict[str, int] = {
    "no_website": 30,
    "broken_website": 25,
    "outdated_website": 15,
    "no_booking": 20,  # only when the campaign's service involves booking
    "no_ordering": 15,  # only when it involves ordering
    "active_social": 20,
    "high_review_count": 15,  # no review-count source yet — inert until one lands
    "contactable": 10,
    "industry_match": 20,
    "location_match": 10,
}

# Deterministic score at/above which Layer 2 (the LLM) runs for a business.
LLM_THRESHOLD = 50

# Stamped onto `lead_scores.model_version` so a stored breakdown is traceable to
# the weight set that produced it.
MODEL_VERSION = "m7-weights-1"
