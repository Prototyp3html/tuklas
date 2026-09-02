"""FixtureSearch: canned results from a checked-in JSON file.

The default provider and the only one tests/CI use — keeps research deterministic
and offline. Keys are matched as case-insensitive substrings of the query, so the
research task's `'"<business name>" <city> contact'` query hits the entry keyed by
the business name.
"""

from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path

from backend.providers.search.base import SearchProvider, SearchResult

_DATA_FILE = Path(__file__).parent / "data" / "results.json"


@lru_cache(maxsize=1)
def _table() -> dict[str, list[SearchResult]]:
    raw = json.loads(_DATA_FILE.read_text(encoding="utf-8"))
    return {
        key.casefold(): [SearchResult(**r) for r in results]
        for key, results in raw.items()
    }


class FixtureSearch(SearchProvider):
    async def search(self, query: str, limit: int = 5) -> list[SearchResult]:
        q = query.casefold()
        for key, results in _table().items():
            if key in q:
                return results[:limit]
        return []
