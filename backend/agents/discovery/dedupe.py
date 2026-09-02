"""Pure dedupe logic for discovery. No I/O, no DB.

A candidate is a duplicate of an existing record when:

1. both have the same non-empty `domain`; or
2. their `normalized_name` matches exactly, or fuzzily at/above
   ``settings.discovery_fuzzy_threshold`` (rapidfuzz ``token_sort_ratio``) — but
   only when *corroborated*: a shared address token, an equal E.164 phone, or
   neither side having any address or phone to contradict it.

The corroboration guard is what stops two same-named businesses in different
barangays ("Sunrise Spa" in Tetuan vs. in Guiwan) from being merged.
"""

from __future__ import annotations

import re
from collections.abc import Iterable
from typing import Protocol

from rapidfuzz import fuzz

from backend.config import settings

_ADDR_TOKEN = re.compile(r"[a-z0-9]{3,}")

# Tokens that appear in nearly every local address and so carry no discriminating
# power — an overlap on these must not count as corroboration.
_ADDR_STOPWORDS = frozenset(
    {
        "zamboanga",
        "city",
        "brgy",
        "barangay",
        "purok",
        "sitio",
        "street",
        "road",
        "ave",
        "avenue",
        "blvd",
        "highway",
        "philippines",
        "9000",
    }
)


class _Identity(Protocol):
    normalized_name: str
    domain: str | None
    address: str | None
    phone: str | None


def _addr_tokens(address: str | None) -> set[str]:
    if not address:
        return set()
    return set(_ADDR_TOKEN.findall(address.lower())) - _ADDR_STOPWORDS


def _corroborated(a: _Identity, b: _Identity) -> bool:
    if _addr_tokens(a.address) & _addr_tokens(b.address):
        return True
    if a.phone and b.phone and a.phone == b.phone:
        return True
    # Nothing on either side to contradict the name match.
    return not (a.address or a.phone or b.address or b.phone)


def _same_name(a: _Identity, b: _Identity) -> bool:
    if not a.normalized_name or not b.normalized_name:
        return False
    if a.normalized_name == b.normalized_name:
        return True
    return (
        fuzz.token_sort_ratio(a.normalized_name, b.normalized_name)
        >= settings.discovery_fuzzy_threshold
    )


def is_duplicate(cand: _Identity, other: _Identity) -> bool:
    if cand.domain and other.domain and cand.domain == other.domain:
        return True
    return _same_name(cand, other) and _corroborated(cand, other)


def find_duplicate(cand: _Identity, existing: Iterable[_Identity]) -> _Identity | None:
    for row in existing:
        if is_duplicate(cand, row):
            return row
    return None


def dedupe_batch(candidates: Iterable[_Identity]) -> list[_Identity]:
    """Drop in-batch duplicates (a source can return the same place twice),
    keeping the first occurrence."""
    kept: list[_Identity] = []
    for cand in candidates:
        if find_duplicate(cand, kept) is None:
            kept.append(cand)
    return kept
