"""Dashboard snapshot schema (Milestone 8). Mirrors `frontend/lib/types.ts`
`DashboardSnapshot` / `DashboardKpi` / `DashboardFunnelStage`.
"""

from __future__ import annotations

from typing import Literal

from backend.schemas.base import CamelModel

DateRange = Literal["week", "all"]
KpiKey = Literal["scanned", "analyzed", "qualified", "highPriority", "replies"]


class DashboardKpi(CamelModel):
    key: KpiKey
    label: str
    value: int
    delta_pct: float | None  # vs the preceding window; null for range="all"
    hint: str


class DashboardFunnelStage(CamelModel):
    key: str
    label: str
    count: int
    dropped: int
    drop_reason: str | None


class DashboardSnapshot(CamelModel):
    range: DateRange
    kpis: list[DashboardKpi]
    funnel: list[DashboardFunnelStage]
