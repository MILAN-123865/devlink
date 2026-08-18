"""add video introduction url columns to users

The ORM model (`app/models/user.py`) has carried `video_introduction_url` and
`video_introduction_thumbnail_url` since the video-introduction feature landed,
but no migration was ever written for them -- only the voice-introduction
sibling column got one. On any database created from the migration history
rather than `create_all`, selecting a user raises `UndefinedColumn`.

Chained off `voice_intro_url_001` rather than off `ea6d6738e0ae` so this does
not add yet another head to a history that already has more than one (#926).

Revision ID: video_intro_url_001
Revises: voice_intro_url_001
Create Date: 2026-08-16
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "video_intro_url_001"
down_revision: Union[str, Sequence[str], None] = "voice_intro_url_001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _has_column(table: str, column: str) -> bool:
    """Whether ``table.column`` already exists.

    Environments that were bootstrapped with ``Base.metadata.create_all`` (the
    test suite, and some local setups) already have these columns, and
    ``add_column`` on an existing column is a hard error. Checking first makes
    the migration safe to run against both kinds of database.
    """
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if table not in inspector.get_table_names():
        return False
    return column in {col["name"] for col in inspector.get_columns(table)}


def upgrade() -> None:
    if not _has_column("users", "video_introduction_url"):
        op.add_column(
            "users",
            sa.Column("video_introduction_url", sa.String(length=500), nullable=True),
        )

    if not _has_column("users", "video_introduction_thumbnail_url"):
        op.add_column(
            "users",
            sa.Column(
                "video_introduction_thumbnail_url",
                sa.String(length=500),
                nullable=True,
            ),
        )


def downgrade() -> None:
    if _has_column("users", "video_introduction_thumbnail_url"):
        op.drop_column("users", "video_introduction_thumbnail_url")

    if _has_column("users", "video_introduction_url"):
        op.drop_column("users", "video_introduction_url")
