"""The pluggable web-search layer for the research task."""

from abc import ABC, abstractmethod

from pydantic import BaseModel


class SearchResult(BaseModel):
    title: str
    url: str
    snippet: str = ""


class SearchProvider(ABC):
    """Phase 1: a checked-in fixture. Opt-in: DuckDuckGo HTML. The research task
    never knows which one it is talking to."""

    @abstractmethod
    async def search(self, query: str, limit: int = 5) -> list[SearchResult]:
        ...
