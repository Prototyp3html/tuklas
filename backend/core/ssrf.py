"""URL safety guard. Every outbound fetch goes through is_safe_url() first.

See BUILD_GUIDE.md Part 2 — "Security: the one that can actually hurt you".
Plus, at the call site: 5s timeout, 2MB max page size, max 10 pages per business,
respect robots.txt, identify the crawler in the User-Agent.
"""

import ipaddress
import socket
from urllib.parse import urlparse

BLOCKED_NETS = [
    ipaddress.ip_network("127.0.0.0/8"),
    ipaddress.ip_network("10.0.0.0/8"),
    ipaddress.ip_network("172.16.0.0/12"),
    ipaddress.ip_network("192.168.0.0/16"),
    ipaddress.ip_network("169.254.0.0/16"),  # cloud metadata
    ipaddress.ip_network("::1/128"),
    ipaddress.ip_network("fc00::/7"),
]


def is_safe_url(url: str) -> bool:
    p = urlparse(url)
    if p.scheme not in ("http", "https"):
        return False
    if not p.hostname:
        return False
    try:
        for info in socket.getaddrinfo(p.hostname, None):
            ip = ipaddress.ip_address(info[4][0])
            if any(ip in net for net in BLOCKED_NETS):
                return False
            if ip.is_private or ip.is_loopback or ip.is_link_local:
                return False
    except Exception:
        return False
    return True
