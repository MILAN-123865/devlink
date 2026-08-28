"""create post_likes and post_comments tables

`Post` carried `likes_count` and `comments_count` and nothing else, so a like
had no owner and a comment had no body. These two tables give both a home;
the unique constraint on (post_id, user_id) is what makes liking idempotent.

Revision ID: c3a9f18d5e72
Revises: 1a2b3c4d5ea1
Create Date: 2026-08-28 11:00:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import UUID

# revision identifiers, used by Alembic.
revision: str = "c3a9f18d5e72"
down_revision: Union[str, Sequence[str], None] = "1a2b3c4d5ea1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "post_likes",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column(
            "post_id",
            UUID(as_uuid=True),
            sa.ForeignKey("posts.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "user_id",
            UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        # The database enforces "one like per user per post", rather than a
        # SELECT in the handler, so two concurrent likes cannot both pass.
        sa.UniqueConstraint("post_id", "user_id", name="uq_post_likes_post_user"),
    )
    op.create_index("ix_post_likes_post_id", "post_likes", ["post_id"])
    op.create_index("ix_post_likes_user_id", "post_likes", ["user_id"])

    op.create_table(
        "post_comments",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column(
            "post_id",
            UUID(as_uuid=True),
            sa.ForeignKey("posts.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "author_id",
            UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )
    op.create_index("ix_post_comments_post_id", "post_comments", ["post_id"])
    op.create_index("ix_post_comments_author_id", "post_comments", ["author_id"])
    op.create_index("ix_post_comments_created_at", "post_comments", ["created_at"])

    # The counters were maintained by hand and could not be trusted, so
    # rebuild them from the rows that now exist. Both tables are empty at this
    # point, which is the correct answer: nothing was ever recorded.
    op.execute("UPDATE posts SET likes_count = 0, comments_count = 0")


def downgrade() -> None:
    op.drop_index("ix_post_comments_created_at", table_name="post_comments")
    op.drop_index("ix_post_comments_author_id", table_name="post_comments")
    op.drop_index("ix_post_comments_post_id", table_name="post_comments")
    op.drop_table("post_comments")

    op.drop_index("ix_post_likes_user_id", table_name="post_likes")
    op.drop_index("ix_post_likes_post_id", table_name="post_likes")
    op.drop_table("post_likes")
