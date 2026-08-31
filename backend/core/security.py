"""Password hashing (bcrypt) and JWT access tokens (PyJWT).

Deliberately not passlib / python-jose — see docs/DECISIONS.md. passlib 1.7.4
breaks against bcrypt 4.x/5.x; python-jose is barely maintained. We only need
bcrypt + HS256.
"""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from uuid import uuid4

import bcrypt
import jwt
from pydantic import BaseModel

from backend.config import settings

PASSWORD_MIN_LENGTH = 8
# bcrypt only reads the first 72 bytes; bcrypt>=5 *raises* above that rather than
# truncating. The register schema rejects longer input as 422 (not 500).
PASSWORD_MAX_BYTES = 72


def hash_password(password: str) -> str:
    return bcrypt.hashpw(
        password.encode("utf-8"), bcrypt.gensalt(rounds=settings.bcrypt_rounds)
    ).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    """Never raises — a malformed stored hash is a failed match, not a 500."""
    try:
        return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))
    except ValueError:
        return False


# Precomputed once at import. /auth/login runs a bcrypt comparison against this
# for unknown emails so "no such user" and "wrong password" take the same time.
DUMMY_PASSWORD_HASH = hash_password("not-a-real-password-timing-decoy")


class TokenPayload(BaseModel):
    sub: str
    exp: int
    iat: int
    jti: str


def create_access_token(subject: object, expires_delta: timedelta | None = None) -> str:
    now = datetime.now(UTC)
    expire = now + (
        expires_delta or timedelta(minutes=settings.access_token_expire_minutes)
    )
    payload = {
        "sub": str(subject),  # PyJWT 2.10 rejects a non-str sub
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp()),
        "jti": uuid4().hex,  # here from day one — adding it later voids live tokens
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str) -> TokenPayload:
    """Raises `jwt.PyJWTError` on any invalid/expired/tampered token."""
    data = jwt.decode(
        token,
        settings.jwt_secret,
        algorithms=[settings.jwt_algorithm],  # allowlist — never trust the header alg
        options={"require": ["exp", "iat", "sub"]},
    )
    return TokenPayload.model_validate(data)
