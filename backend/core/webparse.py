"""Small HTML-scraping helpers shared by the website analyzer (M4) and research (M5).

Pure functions over already-fetched markup — no I/O. The regexes live here once so
`check_website` and `extract_contacts` can't drift apart.
"""

from __future__ import annotations

import re
from urllib.parse import urlsplit

from bs4 import BeautifulSoup

SOCIAL_HOSTS = (
    "facebook.com",
    "instagram.com",
    "tiktok.com",
    "twitter.com",
    "x.com",
    "linktr.ee",
    "youtube.com",
)

# Philippine numbers: +63 / 63 / 0 prefix, then 9-11 more digits with spacing/dashes.
PHONE_RE = re.compile(r"(?:\+?63|0)\d[\d\-\s]{7,}\d")
EMAIL_RE = re.compile(r"[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}")
_COPYRIGHT_YEAR_RE = re.compile(
    r"(?:©|&copy;|copyright)\s*(?:20\d{2}\s*[-–]\s*)?(20\d{2})", re.I
)


def visible_text(soup: BeautifulSoup) -> str:
    return soup.get_text(" ", strip=True)


def hrefs_of(soup: BeautifulSoup) -> list[str]:
    return [a.get("href", "") for a in soup.find_all("a", href=True)]


def meta_content(
    soup: BeautifulSoup, *, name: str | None = None, prop: str | None = None
) -> str | None:
    attrs: dict[str, object] = {}
    if name is not None:
        attrs["name"] = re.compile(rf"^{re.escape(name)}$", re.I)
    if prop is not None:
        attrs["property"] = re.compile(rf"^{re.escape(prop)}$", re.I)
    tag = soup.find("meta", attrs=attrs)
    content = tag.get("content") if tag else None
    return content.strip() if content else None


def has_viewport(soup: BeautifulSoup) -> bool:
    return soup.find("meta", attrs={"name": re.compile(r"^viewport$", re.I)}) is not None


def find_social_links(hrefs: list[str]) -> list[str]:
    return sorted(
        {
            h
            for h in hrefs
            if any(host in urlsplit(h).netloc.lower() for host in SOCIAL_HOSTS)
        }
    )


def find_emails(text: str) -> list[str]:
    return sorted({m.group(0).lower() for m in EMAIL_RE.finditer(text)})


def find_phones(text: str) -> list[str]:
    return sorted({m.group(0).strip() for m in PHONE_RE.finditer(text)})


def find_copyright_year(text: str) -> str | None:
    m = _COPYRIGHT_YEAR_RE.search(text)
    return m.group(1) if m else None
