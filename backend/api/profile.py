"""Profile CRUD (Milestone 2).

`PUT` is an upsert: it creates the row on first write. Registration must NOT
create it — `user_profiles` carries RLS and no `app.user_id` GUC is set at
register time, so the `WITH CHECK` policy would reject the insert. Lazy creation
here (where the session *is* scoped) is the only version that works, and a nice
live proof the policies are on.
"""

from __future__ import annotations

from fastapi import APIRouter

from backend.api.deps import CurrentUser, DbSession
from backend.models import UserProfile
from backend.schemas.user import ProfileRead, ProfileWrite

router = APIRouter(tags=["profile"])


@router.get("/me/profile", response_model=ProfileRead)
async def get_profile(user: CurrentUser, db: DbSession) -> ProfileRead:
    profile = await db.get(UserProfile, user.id)
    return ProfileRead.from_models(user, profile)


@router.put("/me/profile", response_model=ProfileRead)
async def put_profile(
    body: ProfileWrite, user: CurrentUser, db: DbSession
) -> ProfileRead:
    profile = await db.get(UserProfile, user.id)
    if profile is None:
        profile = UserProfile(user_id=user.id)
        db.add(profile)
    profile.services = body.services
    profile.target_industries = body.target_industries
    profile.target_locations = body.target_locations
    profile.price_range_min = body.price_range_min
    profile.price_range_max = body.price_range_max
    profile.icp_notes = body.icp_notes
    await db.commit()
    await db.refresh(profile)
    return ProfileRead.from_models(user, profile)
