"""Business-related Pydantic schemas.

TODO (Milestone 3): flesh out RawBusiness and add normalized / stored variants.
This stub exists so the provider interfaces in backend/providers/ can import it.
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
