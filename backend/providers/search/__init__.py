"""Search-provider selection for the research task.

Default `fixture` (deterministic — tests + CI). `RESEARCH_SEARCH=ddg` switches to
live DuckDuckGo HTML. `get_search_provider()` is the one place this is decided.
"""

from backend.config import settings
from backend.providers.search.base import SearchProvider, SearchResult
from backend.providers.search.fixture import FixtureSearch


def get_search_provider() -> SearchProvider:
    if settings.research_search == "ddg":
        from backend.providers.search.duckduckgo import DuckDuckGoSearch

        return DuckDuckGoSearch()
    return FixtureSearch()


__all__ = [
    "FixtureSearch",
    "SearchProvider",
    "SearchResult",
    "get_search_provider",
]
