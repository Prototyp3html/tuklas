"""Pure extractors for the research task. No I/O.

`extract_contacts` pulls citable facts out of any fetched page; `parse_facebook`
does a best-effort read of a public Facebook page (which serves bots a thin,
often login-walled page).
"""

from __future__ import annotations

import re

from bs4 import BeautifulSoup
from pydantic import BaseModel

from backend.core.webparse import (
    find_copyright_year,
    find_emails,
    find_phones,
    find_social_links,
    hrefs_of,
    meta_content,
    visible_text,
)


class ContactFindings(BaseModel):
    phones: list[str] = []
    emails: list[str] = []
    social_links: list[str] = []
    address: str | None = None
    last_seen_year: str | None = None


class FacebookFindings(BaseModel):
    title: str | None = None
    followers: int | None = None
    likes: int | None = None
    login_walled: bool = False


def extract_contacts(html: str, *, source_url: str) -> ContactFindings:
    soup = BeautifulSoup(html or "", "html.parser")
    text = visible_text(soup)
    hrefs = hrefs_of(soup)

    tel = [
        h.split(":", 1)[1].split("?")[0].strip()
        for h in hrefs
        if h.lower().startswith("tel:")
    ]
    mailto = [
        h.split(":", 1)[1].split("?")[0].strip().lower()
        for h in hrefs
        if h.lower().startswith("mailto:")
    ]

    addr_tag = soup.find("address")
    return ContactFindings(
        phones=sorted({*find_phones(text), *(t for t in tel if t)}),
        emails=sorted({*find_emails(text), *(m for m in mailto if "@" in m)}),
        social_links=find_social_links(hrefs),
        address=addr_tag.get_text(" ", strip=True) if addr_tag else None,
        last_seen_year=find_copyright_year(text),
    )


_FB_FOLLOWERS_RE = re.compile(r"([\d,]+)\s+followers", re.I)
_FB_LIKES_RE = re.compile(r"([\d,]+)\s+(?:people\s+like\s+this|likes)", re.I)
_FB_WALL_RE = re.compile(
    r"log in to continue|you must log in|see more of .* on facebook|"
    r"log in or create an account",
    re.I,
)


def _num(match: re.Match[str] | None) -> int | None:
    return int(match.group(1).replace(",", "")) if match else None


def parse_facebook(html: str) -> FacebookFindings:
    soup = BeautifulSoup(html or "", "html.parser")
    text = visible_text(soup)
    title = meta_content(soup, prop="og:title")
    followers = _num(_FB_FOLLOWERS_RE.search(text))
    likes = _num(_FB_LIKES_RE.search(text))
    walled = bool(_FB_WALL_RE.search(text)) or (
        title is None and followers is None and likes is None
    )
    return FacebookFindings(
        title=title, followers=followers, likes=likes, login_walled=walled
    )
