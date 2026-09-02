"""Business-data provider selection.

`get_business_source()` is the one place the pipeline learns which provider it is
talking to. M3 returns the fixture; swapping in `MapsScraperSource` /
`PlacesApiSource` is a one-line change here.
"""

from backend.providers.business_data.base import BusinessDataSource
from backend.providers.business_data.fixture import FixtureSource


def get_business_source() -> BusinessDataSource:
    return FixtureSource()


__all__ = ["BusinessDataSource", "FixtureSource", "get_business_source"]
