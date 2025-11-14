"""Add mcp_capable field to ai_configurations

Revision ID: 001
Revises: 
Create Date: 2025-11-13

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Add mcp_capable column to ai_configurations table."""
    op.add_column(
        'ai_configurations',
        sa.Column('mcp_capable', sa.Boolean(), nullable=False, server_default='0')
    )


def downgrade() -> None:
    """Remove mcp_capable column from ai_configurations table."""
    op.drop_column('ai_configurations', 'mcp_capable')
