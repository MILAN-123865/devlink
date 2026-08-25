"""Schemas for exposing a user's effective permissions."""

from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field


class ScopedPermissionsResponse(BaseModel):
    """Every permission the caller holds, grouped by the scope it applies in.

    A flat list of permission strings is not answerable: owning one project
    and viewing another means holding ``project:delete`` *somewhere*, which
    tells a UI nothing about the project in front of the user. Grouping by id
    is what makes the payload usable for gating a button.
    """

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "system": ["system:contribute", "system:create_project"],
                "organizations": {
                    "3f1c2b7e-0000-0000-0000-000000000001": [
                        "org:update",
                        "org:view_content",
                    ]
                },
                "projects": {
                    "3f1c2b7e-0000-0000-0000-000000000002": [
                        "project:delete",
                        "project:update",
                        "project:view",
                    ]
                },
            }
        }
    )

    system: list[str] = Field(
        default_factory=list,
        description="Platform-wide permissions, not scoped to any resource.",
    )
    organizations: dict[str, list[str]] = Field(
        default_factory=dict,
        description="Permissions per organization id.",
    )
    projects: dict[str, list[str]] = Field(
        default_factory=dict,
        description="Permissions per project id.",
    )
