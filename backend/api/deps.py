"""Shared FastAPI dependencies."""

from __future__ import annotations

from typing import Annotated
from uuid import UUID

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession

from backend.core.security import decode_access_token
from backend.db.session import get_db, set_rls_user
from backend.models import User

# tokenUrl is relative — resolves under settings.api_prefix (empty for now).
_oauth2 = OAuth2PasswordBearer(tokenUrl="auth/token", auto_error=False)

_UNAUTHENTICATED = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Not authenticated",
    headers={"WWW-Authenticate": "Bearer"},
)

DbSession = Annotated[AsyncSession, Depends(get_db)]


async def get_current_user(
    token: Annotated[str | None, Depends(_oauth2)],
    db: DbSession,
) -> User:
    if not token:
        raise _UNAUTHENTICATED
    try:
        payload = decode_access_token(token)
        user_id = UUID(payload.sub)
    except (jwt.PyJWTError, ValueError):
        raise _UNAUTHENTICATED from None

    # `users` has no RLS, so this load works before the session is scoped. FastAPI
    # caches `get_db` per request, so `db` here is the same session the route gets.
    user = await db.get(User, user_id)
    if user is None:
        raise _UNAUTHENTICATED
    await set_rls_user(db, user.id)
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


async def require_admin(user: CurrentUser) -> User:
    if not user.is_admin:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Admin only")
    return user


AdminUser = Annotated[User, Depends(require_admin)]
