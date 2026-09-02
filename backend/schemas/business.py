"""Business-related Pydantic schemas.

`RawBusiness` is what a data source hands back, verbatim. `NormalizedBusiness` is
the cleaned form the discovery pipeline dedupes and persists. Both are internal
(no camelCase alias generator) — the wire-facing lead shapes arrive in M8.
"""

from pydantic import BaseModel


class RawBusiness(BaseModel):
    """One business exactly as a data source returned it, before normalization."""

    name: str
    address: str | None = None
    phone: str | None = None
    website: str | None = None
    category: str | None = None
    lat: float | None = None
    lng: float | None = None
    source_id: str | None = None


class NormalizedBusiness(BaseModel):
    """A `RawBusiness` after name/phone/domain normalization — the unit the
    discovery deduper compares and the runner writes to `businesses`."""

    name: str
    normalized_name: str
    domain: str | None = None
    phone: str | None = None  # E.164, or None if unparseable
    address: str | None = None
    category: str | None = None
    lat: float | None = None
    lng: float | None = None
    source_name: str
    source_id: str | None = None
