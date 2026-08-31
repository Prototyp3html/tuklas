"""Auth + profile schemas."""

from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING
from uuid import UUID

from pydantic import EmailStr, Field, field_validator

from backend.core.security import PASSWORD_MAX_BYTES, PASSWORD_MIN_LENGTH
from backend.schemas.base import CamelModel

if TYPE_CHECKING:
    from backend.models import User, UserProfile


class RegisterRequest(CamelModel):
    email: EmailStr
    password: str = Field(min_length=PASSWORD_MIN_LENGTH)

    @field_validator("password")
    @classmethod
    def _within_bcrypt_limit(cls, v: str) -> str:
        # Pydantic's min_length counts characters; bcrypt's limit is bytes.
        if len(v.encode("utf-8")) > PASSWORD_MAX_BYTES:
            raise ValueError(f"password must be at most {PASSWORD_MAX_BYTES} bytes")
        return v


class LoginRequest(CamelModel):
    email: EmailStr
    password: str


class UserRead(CamelModel):
    id: UUID
    email: EmailStr
    is_admin: bool
    created_at: datetime


class TokenResponse(CamelModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int


class ProfileWrite(CamelModel):
    services: list[str] = []
    target_industries: list[str] = []
    target_locations: list[str] = []
    price_range_min: int = 0
    price_range_max: int = 0
    icp_notes: str = ""


class ProfileRead(CamelModel):
    """The `types.ts` `UserProfile` shape — identity email + profile fields."""

    email: EmailStr
    services: list[str]
    target_industries: list[str]
    target_locations: list[str]
    price_range_min: int
    price_range_max: int
    icp_notes: str

    @classmethod
    def from_models(cls, user: User, profile: UserProfile | None) -> ProfileRead:
        if profile is None:
            return cls(
                email=user.email,
                services=[],
                target_industries=[],
                target_locations=[],
                price_range_min=0,
                price_range_max=0,
                icp_notes="",
            )
        return cls(
            email=user.email,
            services=list(profile.services),
            target_industries=list(profile.target_industries),
            target_locations=list(profile.target_locations),
            price_range_min=profile.price_range_min,
            price_range_max=profile.price_range_max,
            icp_notes=profile.icp_notes,
        )
