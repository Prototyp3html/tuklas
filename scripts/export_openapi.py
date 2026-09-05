"""Dump the live OpenAPI schema to `docs/openapi.json`.

Run after changing any route or response model. The committed file is the
frontend's type source (Milestone 8 wiring regenerates from it), and
`tests/test_openapi.py` fails CI if it drifts:

    uv run python scripts/export_openapi.py
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

_ROOT = Path(__file__).resolve().parent.parent
if str(_ROOT) not in sys.path:
    sys.path.insert(0, str(_ROOT))

from backend.main import app  # noqa: E402

_OUT = _ROOT / "docs" / "openapi.json"


def render() -> str:
    return json.dumps(app.openapi(), indent=2, sort_keys=True) + "\n"


if __name__ == "__main__":
    _OUT.write_text(render(), encoding="utf-8")
    print(f"wrote {_OUT.relative_to(Path.cwd())}")
