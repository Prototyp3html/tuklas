"""`backend/core/ssrf.py` ships complete but untested. Lock in its behaviour."""

import pytest

from backend.core.ssrf import is_safe_url


@pytest.mark.parametrize(
    "url",
    [
        "http://127.0.0.1/",
        "http://localhost/",
        "http://169.254.169.254/latest/meta-data/",  # cloud metadata
        "http://10.0.0.5/",
        "http://192.168.1.1/",
        "http://[::1]/",
        "ftp://example.com/",  # scheme not allowed
        "file:///etc/passwd",
        "not-a-url",
        "http://",  # no host
    ],
)
def test_unsafe_urls_are_rejected(url: str) -> None:
    assert is_safe_url(url) is False


@pytest.mark.parametrize("url", ["https://example.com/", "http://example.com/path?q=1"])
def test_public_urls_are_allowed(url: str) -> None:
    assert is_safe_url(url) is True
