"""Add block_type, language, and tags to content_nodes

Revision ID: 003
Revises: 002
Create Date: 2025-11-14

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '003'
down_revision = '002'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Add block_type, language, and tags columns to content_nodes table."""
    # Add columns with default values
    try:
        op.add_column('content_nodes', sa.Column('block_type', sa.String(50), nullable=True, server_default='text'))
    except:
        pass  # Column might already exist
    
    try:
        op.add_column('content_nodes', sa.Column('language', sa.String(10), nullable=True, server_default='en'))
    except:
        pass  # Column might already exist
    
    try:
        op.add_column('content_nodes', sa.Column('tags', sa.Text, nullable=True))
    except:
        pass  # Column might already exist


def downgrade() -> None:
    """Remove block_type, language, and tags columns from content_nodes table."""
    op.drop_column('content_nodes', 'tags')
    op.drop_column('content_nodes', 'language')
    op.drop_column('content_nodes', 'block_type')
