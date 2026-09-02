"""Pure normalization helpers for discovery. No I/O, no DB.

- `normalize_name`  — a comparable key for fuzzy dedupe (casefold, de-accent,
  drop legal/industry suffixes, collapse punctuation).
- `to_e164`         — Philippine phone numbers to +63E.164, or None.
- `extract_domain`  — a real website host, or None (social links are contacts,
  not websites, so they return None here).
- `normalize`       — RawBusiness -> NormalizedBusiness.
"""

from __future__ import annotations

import re
import unicodedata
from urllib.parse import urlsplit

from backend.schemas.business import NormalizedBusiness, RawBusiness

# Trailing words that carry no identity — legal forms and generic trade nouns.
_SUFFIX_WORDS = {
    "inc",
    "incorporated",
    "corp",
    "corporation",
    "co",
    "company",
    "ltd",
    "llc",
    "enterprises",
    "enterprise",
    "trading",
    "ent",
    "salon",
    "spa",
    "parlor",
    "parlour",
    "barbershop",
    "barber",
    "clinic",
    "dental",
    "restaurant",
    "eatery",
    "cafe",
    "cafeteria",
    "shop",
    "store",
}

_SOCIAL_HOSTS = {
    "facebook.com",
    "m.facebook.com",
    "web.facebook.com",
    "fb.com",
    "instagram.com",
    "linktr.ee",
    "tiktok.com",
    "twitter.com",
    "x.com",
}

_NON_ALNUM = re.compile(r"[^a-z0-9]+")


def _strip_accents(text: str) -> str:
    return "".join(
        c for c in unicodedata.normalize("NFKD", text) if not unicodedata.combining(c)
    )


def normalize_name(raw: str) -> str:
    """Casefold, de-accent, collapse punctuation to single spaces, and drop
    trailing generic/legal suffix words. Order matters: suffix stripping runs on
    the already-tokenized form so ``"Glow & Go Salon"`` and
    ``"Glow and Go Salon, Inc."`` both land on ``"glow and go"``."""
    text = _strip_accents(raw).casefold()
    text = _NON_ALNUM.sub(" ", text).strip()
    tokens = text.split()
    while tokens and tokens[-1] in _SUFFIX_WORDS:
        tokens.pop()
    return " ".join(tokens) if tokens else text


def to_e164(raw: str | None) -> str | None:
    """Philippine numbers to +63E.164. Handles ``09xx``, ``+639xx``, ``639xx``,
    and ``(062) 991-xxxx`` landlines. Returns None if the digit count is
    implausible for a PH number."""
    if not raw:
        return None
    digits = re.sub(r"\D", "", raw)
    if not digits:
        return None
    if digits.startswith("0"):
        digits = "63" + digits[1:]
    elif not digits.startswith("63"):
        digits = "63" + digits
    # 63 + (9xxxxxxxxx mobile | 62xxxxxxx landline) => 11-12 digits total
    if not 11 <= len(digits) <= 12:
        return None
    return "+" + digits


def extract_domain(url: str | None) -> str | None:
    """Registrable host of a website URL, lowercased, ``www.`` stripped. Returns
    None for blanks, unparseable input, and known social hosts (those are
    contacts, tracked elsewhere — never a business's own site)."""
    if not url:
        return None
    candidate = url.strip()
    if "//" not in candidate:
        candidate = "//" + candidate
    host = urlsplit(candidate).hostname
    if not host:
        return None
    host = host.lower()
    if host.startswith("www."):
        host = host[4:]
    if not host or "." not in host or host in _SOCIAL_HOSTS:
        return None
    return host


def normalize(raw: RawBusiness, *, source_name: str) -> NormalizedBusiness:
    return NormalizedBusiness(
        name=raw.name.strip(),
        normalized_name=normalize_name(raw.name),
        domain=extract_domain(raw.website),
        phone=to_e164(raw.phone),
        address=raw.address.strip() if raw.address else None,
        category=raw.category,
        lat=raw.lat,
        lng=raw.lng,
        source_name=source_name,
        source_id=raw.source_id,
    )
