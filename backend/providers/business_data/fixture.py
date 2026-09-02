"""FixtureSource: a `BusinessDataSource` backed by a checked-in JSON dataset.

Milestone 3 builds the whole deterministic pipeline against this so it is fully
testable with no network. `MapsScraperSource` (Playwright) is the drop-in
replacement — `get_business_source()` in this package's `__init__` is the seam.
"""

from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path

from backend.providers.business_data.base import BusinessDataSource
from backend.schemas.business import RawBusiness

_DATA_FILE = Path(__file__).parent / "data" / "zamboanga_city.json"


@lru_cache(maxsize=1)
def _load() -> tuple[RawBusiness, ...]:
    records = json.loads(_DATA_FILE.read_text(encoding="utf-8"))
    return tuple(RawBusiness(**r) for r in records)


class FixtureSource(BusinessDataSource):
    SOURCE_NAME = "fixture:zamboanga_city"

    def source_name(self) -> str:
        return self.SOURCE_NAME

    async def search(
        self, category: str, location: str, limit: int = 50
    ) -> list[RawBusiness]:
        query_tokens = [t for t in category.lower().split() if t]
        loc = location.strip().lower()

        out: list[RawBusiness] = []
        for rec in _load():
            rec_cat = (rec.category or "").lower()
            if query_tokens and not any(t in rec_cat for t in query_tokens):
                continue
            if loc and loc not in (rec.address or "").lower():
                continue
            out.append(rec)
            if len(out) >= limit:
                break
        return out
