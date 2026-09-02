"""OverpassSource: live business records from OpenStreetMap via the Overpass API.

Real data, no API key, no browser. Coverage is thinner than Google's (phone /
website tags are often missing) but it is genuine and enough to shake the
discovery pipeline out on live records. Not used by tests or CI — those stay on
`FixtureSource`. Selected with `DISCOVERY_SOURCE=overpass`.
"""

from __future__ import annotations

import asyncio

import httpx

from backend.config import settings
from backend.providers.business_data.base import BusinessDataSource
from backend.schemas.business import RawBusiness

# Zamboanga City is the project's hyper-local scope (BUILD_GUIDE Part 1). A bbox
# is more reliable than area-name matching, which fragments across OSM
# ("Zamboanga City" vs "City of Zamboanga"). south, west, north, east.
_ZAMBOANGA_CITY_BBOX = "6.87,121.93,6.99,122.16"

# overpass-api.de rejects (HTTP 406) User-Agents containing "example.com", so the
# shared CRAWLER_USER_AGENT can't be reused here — send an honest project UA.
_USER_AGENT = "tuklas-discovery/0.1 (+https://github.com/Prototyp3html/tuklas)"
_MAX_ATTEMPTS = 3

# Free-text campaign category -> OSM tag selectors (raw Overpass filter syntax).
_CATEGORY_SELECTORS: dict[str, list[str]] = {
    "salon": ['["shop"="hairdresser"]', '["shop"="beauty"]', '["beauty"]'],
    "hair": ['["shop"="hairdresser"]'],
    "barber": ['["shop"="hairdresser"]'],
    "beauty": ['["shop"="beauty"]', '["beauty"]'],
    "spa": ['["leisure"="spa"]', '["shop"="massage"]', '["amenity"="spa"]'],
    "nail": ['["shop"="beauty"]', '["beauty"="nails"]'],
    "restaurant": ['["amenity"="restaurant"]'],
    "eatery": ['["amenity"="restaurant"]', '["amenity"="fast_food"]'],
    "cafe": ['["amenity"="cafe"]'],
    "coffee": ['["amenity"="cafe"]', '["shop"="coffee"]'],
    "bakery": ['["shop"="bakery"]'],
    "dental": ['["amenity"="dentist"]', '["healthcare"="dentist"]'],
    "dentist": ['["amenity"="dentist"]', '["healthcare"="dentist"]'],
    "clinic": ['["amenity"="clinic"]', '["amenity"="doctors"]', '["healthcare"]'],
    "pharmacy": ['["amenity"="pharmacy"]'],
    "auto": ['["shop"="car_repair"]'],
    "car": ['["shop"="car_repair"]', '["shop"="car"]'],
    "repair": ['["shop"="car_repair"]'],
    "gym": ['["leisure"="fitness_centre"]', '["leisure"="sports_centre"]'],
    "fitness": ['["leisure"="fitness_centre"]'],
    "hardware": ['["shop"="hardware"]', '["shop"="doityourself"]'],
    "hotel": ['["tourism"="hotel"]', '["tourism"="guest_house"]'],
    "laundry": ['["shop"="laundry"]', '["shop"="dry_cleaning"]'],
}

_CATEGORY_TAG_KEYS = (
    "shop",
    "amenity",
    "leisure",
    "healthcare",
    "tourism",
    "office",
    "craft",
)


def _oql_escape(value: str) -> str:
    return value.replace("\\", "\\\\").replace('"', '\\"')


def _selectors_for(category: str) -> list[str]:
    lowered = category.casefold()
    picked: list[str] = []
    for key, selectors in _CATEGORY_SELECTORS.items():
        if key in lowered:
            picked.extend(s for s in selectors if s not in picked)
    if picked:
        return picked
    # No mapping — fall back to a name substring match.
    return [f'["name"~"{_oql_escape(category)}",i]']


def _address(tags: dict[str, str]) -> str | None:
    parts = [
        tags.get("addr:housenumber"),
        tags.get("addr:street"),
        tags.get("addr:barangay")
        or tags.get("addr:suburb")
        or tags.get("addr:neighbourhood"),
        tags.get("addr:city"),
    ]
    joined = ", ".join(p.strip() for p in parts if p and p.strip())
    return joined or None


def _category_of(tags: dict[str, str]) -> str | None:
    for key in _CATEGORY_TAG_KEYS:
        if tags.get(key):
            return tags[key]
    return tags.get("beauty")


def _website(tags: dict[str, str]) -> str | None:
    site = tags.get("website") or tags.get("contact:website") or tags.get("url")
    if site:
        return site
    fb = tags.get("contact:facebook") or tags.get("facebook")
    if fb:
        return fb if fb.startswith("http") else f"https://www.facebook.com/{fb.lstrip('/')}"
    return None


def _to_raw(element: dict) -> RawBusiness | None:
    tags = element.get("tags") or {}
    name = (tags.get("name") or "").strip()
    if not name:
        return None
    center = element.get("center") or {}
    lat = element.get("lat", center.get("lat"))
    lon = element.get("lon", center.get("lon"))
    return RawBusiness(
        name=name,
        address=_address(tags),
        phone=tags.get("phone") or tags.get("contact:phone") or tags.get("contact:mobile"),
        website=_website(tags),
        category=_category_of(tags),
        lat=float(lat) if lat is not None else None,
        lng=float(lon) if lon is not None else None,
        source_id=f"{element.get('type')}/{element.get('id')}",
    )


class OverpassSource(BusinessDataSource):
    SOURCE_NAME = "overpass:openstreetmap"

    def __init__(self, *, client: httpx.AsyncClient | None = None) -> None:
        self._client = client

    def source_name(self) -> str:
        return self.SOURCE_NAME

    def _build_query(self, category: str, location: str, limit: int) -> str:
        selectors = _selectors_for(category)
        fetch = limit * 3  # headroom for nameless elements dropped in parsing
        if "zamboanga" in location.casefold():
            region = _ZAMBOANGA_CITY_BBOX
            clauses = "".join(f"nwr{sel}({region});" for sel in selectors)
        else:
            area = f'area["name"~"{_oql_escape(location)}",i]->.a;'
            clauses = area + "".join(f"nwr{sel}(area.a);" for sel in selectors)
        return f"[out:json][timeout:25];({clauses});out center tags {fetch};"

    async def _post(self, query: str) -> dict:
        client = self._client
        owned = client is None
        if client is None:
            client = httpx.AsyncClient(
                timeout=settings.discovery_overpass_timeout,
                headers={"User-Agent": _USER_AGENT},
            )
        try:
            body = query.encode("utf-8")
            for attempt in range(_MAX_ATTEMPTS):
                resp = await client.post(settings.discovery_overpass_url, content=body)
                # Overpass returns 429 when the public slot is busy — back off once.
                if resp.status_code == 429 and attempt < _MAX_ATTEMPTS - 1:
                    await asyncio.sleep(2**attempt)
                    continue
                resp.raise_for_status()
                return resp.json()
            raise RuntimeError("unreachable")  # pragma: no cover
        finally:
            if owned:
                await client.aclose()

    async def search(
        self, category: str, location: str, limit: int = 50
    ) -> list[RawBusiness]:
        data = await self._post(self._build_query(category, location, limit))
        out: list[RawBusiness] = []
        for element in data.get("elements", []):
            raw = _to_raw(element)
            if raw is None:
                continue
            out.append(raw)
            if len(out) >= limit:
                break
        return out
