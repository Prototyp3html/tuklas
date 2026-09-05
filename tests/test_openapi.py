"""The committed OpenAPI schema must match the live app.

`docs/openapi.json` is the frontend's type source (Milestone 8 wiring regenerates
from it). If a route or response model changed, run
`uv run python scripts/export_openapi.py` and commit the result.
"""

from __future__ import annotations

import json
from pathlib import Path

from backend.main import app

_COMMITTED = Path(__file__).resolve().parent.parent / "docs" / "openapi.json"


def test_openapi_json_is_committed_and_current() -> None:
    live = json.dumps(app.openapi(), indent=2, sort_keys=True) + "\n"
    assert _COMMITTED.read_text(encoding="utf-8") == live, (
        "docs/openapi.json is stale — run `uv run python scripts/export_openapi.py`"
    )
