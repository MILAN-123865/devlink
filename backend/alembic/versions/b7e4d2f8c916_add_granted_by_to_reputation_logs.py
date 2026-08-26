"""add granted_by_id to reputation_logs

The log recorded who received points and never who granted them, so a manual
adjustment could not be attributed to anyone. Nullable: entries the platform
awards itself have no human actor, and neither does any row that already
exists.

Revision ID: b7e4d2f8c916
Revises: 1c63e6c28cf8
Create Date: 2026-08-26 17:30:00.000000

"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "b7e4d2f8c916"
down_revision = "1c63e6c28cf8"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "reputation_logs",
        sa.Column("granted_by_id", postgresql.UUID(as_uuid=True), nullable=True),
    )
    op.create_index(
        "ix_reputation_logs_granted_by_id",
        "reputation_logs",
        ["granted_by_id"],
    )

    # SQLite cannot add a foreign key to an existing table with ALTER, and the
    # test database is SQLite. The constraint is skipped there; the column and
    # the index -- which is what queries need -- are created either way.
    if op.get_bind().dialect.name == "postgresql":
        op.create_foreign_key(
            "fk_reputation_logs_granted_by_id_users",
            "reputation_logs",
            "users",
            ["granted_by_id"],
            ["id"],
            ondelete="SET NULL",
        )


def downgrade() -> None:
    if op.get_bind().dialect.name == "postgresql":
        op.drop_constraint(
            "fk_reputation_logs_granted_by_id_users",
            "reputation_logs",
            type_="foreignkey",
        )

    op.drop_index("ix_reputation_logs_granted_by_id", table_name="reputation_logs")
    op.drop_column("reputation_logs", "granted_by_id")
