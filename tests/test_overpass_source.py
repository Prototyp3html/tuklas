"""OverpassSource — parsing + query building, all against a mocked Overpass API.

No test hits the real network; CI/discovery stay on FixtureSource.
"""

from __future__ import annotations

import json

import httpx
import pytest

from backend.providers.business_data import FixtureSource, OverpassSource, get_business_source
from backend.schemas.business import RawBusiness

_OVERPASS_JSON = {
    "elements": [
        {
            "type": "node",
            "id": 1,
            "lat": 6.9130,
            "lon": 122.0740,
            "tags": {
                "name": "Bella Rosa Salon",
                "shop": "hairdresser",
                "phone": "+63 62 991 1234",
                "website": "https://bellarosa.example",
                "addr:housenumber": "12",
                "addr:street": "Nunez Ext",
                "addr:barangay": "Tetuan",
                "addr:city": "Zamboanga City",
            },
        },
        {
            "type": "way",
            "id": 2,
            "center": {"lat": 6.9200, "lon": 122.0800},
            "tags": {
                "name": "Glow Beauty Bar",
                "shop": "beauty",
                "contact:phone": "0917 555 0000",
                "contact:facebook": "glowbeautybar",
            },
        },
        {
            "type": "node",
            "id": 3,
            "lat": 6.90,
            "lon": 122.06,
            "tags": {"shop": "hairdresser"},  # no name -> dropped
        },
    ]
}


def _client_capturing(sink: dict) -> httpx.AsyncClient:
    def handler(request: httpx.Request) -> httpx.Response:
        sink["url"] = str(request.url)
        sink["body"] = request.content.decode()
        return httpx.Response(200, json=_OVERPASS_JSON)

    return httpx.AsyncClient(transport=httpx.MockTransport(handler))


async def test_overpass_parses_elements() -> None:
    sink: dict = {}
    async with _client_capturing(sink) as client:
        src = OverpassSource(client=client)
        out = await src.search("salon", "Zamboanga City", limit=50)

    assert [b.name for b in out] == ["Bella Rosa Salon", "Glow Beauty Bar"]  # nameless dropped
    assert all(isinstance(b, RawBusiness) for b in out)

    bella = out[0]
    assert bella.phone == "+63 62 991 1234"
    assert bella.website == "https://bellarosa.example"
    assert bella.address == "12, Nunez Ext, Tetuan, Zamboanga City"
    assert bella.category == "hairdresser"
    assert (bella.lat, bella.lng) == (6.9130, 122.0740)
    assert bella.source_id == "node/1"

    glow = out[1]
    assert glow.phone == "0917 555 0000"  # from contact:phone
    assert glow.website == "https://www.facebook.com/glowbeautybar"  # from contact:facebook
    assert (glow.lat, glow.lng) == (6.9200, 122.0800)  # from way center
    assert glow.source_id == "way/2"


async def test_overpass_query_uses_bbox_and_mapped_selectors() -> None:
    sink: dict = {}
    async with _client_capturing(sink) as client:
        await OverpassSource(client=client).search("salon", "Zamboanga City", limit=10)

    body = sink["body"]
    assert "[out:json]" in body
    assert "6.87,121.93,6.99,122.16" in body  # Zamboanga City bbox
    assert '["shop"="hairdresser"]' in body
    assert '["shop"="beauty"]' in body


async def test_overpass_unmapped_category_falls_back_to_name_match() -> None:
    sink: dict = {}
    async with _client_capturing(sink) as client:
        await OverpassSource(client=client).search("artisan cheese shop", "Zamboanga City", 5)
    assert '["name"~"artisan cheese shop",i]' in sink["body"]


async def test_overpass_non_zamboanga_location_uses_area_clause() -> None:
    sink: dict = {}
    async with _client_capturing(sink) as client:
        await OverpassSource(client=client).search("cafe", "Cebu City", 5)
    assert 'area["name"~"Cebu City",i]->.a;' in sink["body"]
    assert "(area.a)" in sink["body"]


async def test_overpass_respects_limit() -> None:
    many = {
        "elements": [
            {
                "type": "node",
                "id": i,
                "lat": 6.9,
                "lon": 122.0,
                "tags": {"name": f"S{i}", "shop": "hairdresser"},
            }
            for i in range(20)
        ]
    }

    def handler(_req: httpx.Request) -> httpx.Response:
        return httpx.Response(200, content=json.dumps(many))

    async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
        out = await OverpassSource(client=client).search("salon", "Zamboanga City", limit=7)
    assert len(out) == 7


async def test_overpass_retries_once_on_429(monkeypatch: pytest.MonkeyPatch) -> None:
    async def _instant_sleep(_seconds: float) -> None:
        return None

    monkeypatch.setattr(
        "backend.providers.business_data.overpass.asyncio.sleep", _instant_sleep
    )
    calls = {"n": 0}

    def handler(_req: httpx.Request) -> httpx.Response:
        calls["n"] += 1
        if calls["n"] == 1:
            return httpx.Response(429)
        return httpx.Response(200, json=_OVERPASS_JSON)

    async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
        out = await OverpassSource(client=client).search("salon", "Zamboanga City", 50)

    assert calls["n"] == 2
    assert len(out) == 2


async def test_overpass_http_error_propagates() -> None:
    async with httpx.AsyncClient(
        transport=httpx.MockTransport(lambda _r: httpx.Response(504))
    ) as client:
        with pytest.raises(httpx.HTTPStatusError):
            await OverpassSource(client=client).search("salon", "Zamboanga City", 5)


def test_get_business_source_defaults_to_fixture() -> None:
    assert isinstance(get_business_source(), FixtureSource)


def test_get_business_source_honours_overpass_setting(monkeypatch: pytest.MonkeyPatch) -> None:
    from backend.config import settings

    monkeypatch.setattr(settings, "discovery_source", "overpass")
    assert isinstance(get_business_source(), OverpassSource)
