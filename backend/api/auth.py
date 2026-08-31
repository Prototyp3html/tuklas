"""register / login / token / me."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from backend.api.deps import CurrentUser, DbSession
from backend.config import settings
from backend.core.security import (
    DUMMY_PASSWORD_HASH,
    create_access_token,
    hash_password,
    verify_password,
)
from backend.models import User, UserProfile
from backend.schemas.user import (
    LoginRequest,
    ProfileRead,
    RegisterRequest,
    TokenResponse,
    UserRead,
)

router = APIRouter(tags=["auth"])


def _issue_token(user: User) -> TokenResponse:
    return TokenResponse(
        access_token=create_access_token(user.id),
        expires_in=settings.access_token_expire_minutes * 60,
    )


async def _authenticate(db: DbSession, email: str, password: str) -> User | None:
    """Same wall-clock cost whether the email is unknown or the password wrong —
    an unknown email still spends one bcrypt verify against a decoy hash."""
    user = (
        await db.execute(select(User).where(User.email == email.strip().lower()))
    ).scalar_one_or_none()
    if user is None:
        verify_password(password, DUMMY_PASSWORD_HASH)
        return None
    if not verify_password(password, user.password_hash):
        return None
    return user


@router.post(
    "/auth/register",
    status_code=status.HTTP_201_CREATED,
    response_model=UserRead,
)
async def register(body: RegisterRequest, db: DbSession) -> User:
    user = User(
        email=body.email.strip().lower(),
        password_hash=hash_password(body.password),
    )
    db.add(user)
    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(
            status.HTTP_409_CONFLICT, "Email already registered"
        ) from None
    await db.refresh(user)
    return user


@router.post("/auth/login", response_model=TokenResponse)
async def login(body: LoginRequest, db: DbSession) -> TokenResponse:
    user = await _authenticate(db, body.email, body.password)
    if user is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid email or password")
    return _issue_token(user)


@router.post("/auth/token", response_model=TokenResponse)
async def login_form(
    form: Annotated[OAuth2PasswordRequestForm, Depends()], db: DbSession
) -> TokenResponse:
    """OAuth2 password flow — powers the /docs Authorize button. `username` is the
    email."""
    user = await _authenticate(db, form.username, form.password)
    if user is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid email or password")
    return _issue_token(user)


@router.get("/me", response_model=ProfileRead)
async def me(user: CurrentUser, db: DbSession) -> ProfileRead:
    profile = await db.get(UserProfile, user.id)
    return ProfileRead.from_models(user, profile)
