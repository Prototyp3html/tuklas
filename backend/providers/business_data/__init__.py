"""Business-data provider selection.

`get_business_source()` is the one place the pipeline learns which provider it is
talking to. Default `fixture` (deterministic — tests + CI); `DISCOVERY_SOURCE=overpass`
switches to live OpenStreetMap. `MapsScraperSource` / `PlacesApiSource` slot in here
the same way.
"""

from backend.config import settings
from backend.providers.business_data.base import BusinessDataSource
from backend.providers.business_data.fixture import FixtureSource
from backend.providers.business_data.overpass import OverpassSource


def get_business_source() -> BusinessDataSource:
    if settings.discovery_source == "overpass":
        return OverpassSource()
    return FixtureSource()


__all__ = [
    "BusinessDataSource",
    "FixtureSource",
    "OverpassSource",
    "get_business_source",
]
