"""Add profile view features

Revision ID: zzzz00000002
Revises: zzzz00000001
Create Date: 2026-08-26 15:55:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'zzzz00000002'
down_revision = ('a3f7c1d29b48', 'b7e4d2f8c916')
branch_labels = None
depends_on = None

def upgrade() -> None:
    # Add visit_count to profile_views
    op.add_column('profile_views', sa.Column('visit_count', sa.Integer(), nullable=True))
    op.execute("UPDATE profile_views SET visit_count = 1")
    op.alter_column('profile_views', 'visit_count', nullable=False)
    
    # Add hide_profile_views to users
    op.add_column('users', sa.Column('hide_profile_views', sa.Boolean(), nullable=True))
    op.execute("UPDATE users SET hide_profile_views = FALSE")
    op.alter_column('users', 'hide_profile_views', nullable=False)

def downgrade() -> None:
    op.drop_column('users', 'hide_profile_views')
    op.drop_column('profile_views', 'visit_count')
