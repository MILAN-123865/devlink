"""
The caller's effective permissions, so the UI does not have to guess them.

Before this existed, ``frontend/src/hooks/usePermissions.ts`` hand-maintained
its own copy of the rules in a ``switch``, and it disagreed with the backend:
it granted ``org:delete`` to org admins and ``project:delete`` to co-owners,
neither of which the API allows. The UI rendered the buttons and the API
answered 403.

Two hand-maintained copies of an authorization table will always drift. This
endpoint makes the backend the single source, and the hook consumes it.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.rbac import get_scoped_permissions
from app.dependencies import get_current_user, get_database
from app.models.user import User
from app.schemas.permissions import ScopedPermissionsResponse

router = APIRouter(tags=["Permissions"])


@router.get(
    "/me/permissions",
    response_model=ScopedPermissionsResponse,
    summary="Effective permissions for the current user",
)
def read_my_permissions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_database),
) -> ScopedPermissionsResponse:
    """Return the caller's permissions grouped by organization and project.

    This is advisory: it exists so the UI can hide actions the caller cannot
    take. It is not the authorization check. Every mutating endpoint still
    runs ``has_org_permission`` / ``has_project_permission`` itself, and a
    caller who ignores this payload gets a 403, not a surprise.
    """
    scoped = get_scoped_permissions(db, current_user.id)

    return ScopedPermissionsResponse(
        system=scoped["system"],
        organizations=scoped["organizations"],
        projects=scoped["projects"],
    )
