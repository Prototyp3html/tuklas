"""The pluggable business-data layer. Write this once, never change it.

See BUILD_GUIDE.md Part 2 — "The two interfaces that make everything upgradeable".
"""

from abc import ABC, abstractmethod

from backend.schemas.business import RawBusiness


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
