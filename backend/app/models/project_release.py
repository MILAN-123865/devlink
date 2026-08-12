from __future__ import annotations

import uuid
from datetime import datetime, timezone
from enum import Enum
from typing import Any

from sqlalchemy import (
    JSON,
    Boolean,
    DateTime,
    ForeignKey,
    Index,
    String,
    Text,
    func,
)
from sqlalchemy import Enum as SqlEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base

MAX_HIGHLIGHTS = 10
MAX_HIGHLIGHT_LENGTH = 200


class ReleaseType(str, Enum):
    MAJOR = "major"
    MINOR = "minor"
    PATCH = "patch"
    PRERELEASE = "prerelease"


class ReleaseStatus(str, Enum):
    DRAFT = "draft"
    PUBLISHED = "published"


class ProjectRelease(Base):
    """
    A published changelog entry for a project (#1043).

    Distinct from ``project_versions`` (#606), which snapshots every edit for
    internal history. A release is something the project chooses to announce:
    it has a version people quote, a body people read, and a publish moment.
    """

    __tablename__ = "project_releases"

    # ==========================================================
    # Primary Key
    # ==========================================================

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    # ==========================================================
    # Foreign Keys
    # ==========================================================

    project_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # A release outlives the person who cut it. SET NULL rather than CASCADE
    # so a maintainer leaving does not erase the project's history.
    author_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    # ==========================================================
    # Identity
    # ==========================================================

    # Free-form on purpose: v1.2.0, 2026.08, beta-3 are all legitimate. The
    # service enforces uniqueness per project case-insensitively.
    version: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )

    title: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
    )

    body: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    # Short bullet points for the collapsed card, so a reader gets the gist
    # without expanding the full markdown body.
    highlights: Mapped[list[Any]] = mapped_column(
        JSON,
        default=list,
        server_default="[]",
        nullable=False,
    )

    # ==========================================================
    # Classification & lifecycle
    # ==========================================================

    release_type: Mapped[ReleaseType] = mapped_column(
        SqlEnum(ReleaseType),
        default=ReleaseType.MINOR,
        nullable=False,
    )

    status: Mapped[ReleaseStatus] = mapped_column(
        SqlEnum(ReleaseStatus),
        default=ReleaseStatus.DRAFT,
        nullable=False,
        index=True,
    )

    published_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        index=True,
    )

    is_pinned: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        server_default="false",
        nullable=False,
    )

    # ==========================================================
    # Relationships
    # ==========================================================

    project = relationship("Project", backref="releases")
    author = relationship("User", backref="authored_releases")

    # ==========================================================
    # Audit
    # ==========================================================

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    __table_args__ = (
        # The public listing: one project's published releases, newest first.
        Index("ix_project_releases_project_published", "project_id", "published_at"),
        # The duplicate-version check and the maintainer's draft list.
        Index("ix_project_releases_project_status", "project_id", "status"),
    )

    def __repr__(self) -> str:
        return f"<ProjectRelease(project={self.project_id}, version='{self.version}', status={self.status})>"
