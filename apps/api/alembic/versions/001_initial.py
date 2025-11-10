"""Initial migration

Revision ID: 001
Revises:
Create Date: 2024-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers
revision = '001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create users table
    op.create_table(
        'users',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('username', sa.String(length=100), nullable=False),
        sa.Column('full_name', sa.String(length=255), nullable=True),
        sa.Column('hashed_password', sa.String(length=255), nullable=False),
        sa.Column('role', sa.String(length=50), nullable=False),
        sa.Column('is_verified', sa.Boolean(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('xp', sa.Integer(), nullable=False),
        sa.Column('level', sa.Integer(), nullable=False),
        sa.Column('metadata', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)
    op.create_index(op.f('ix_users_username'), 'users', ['username'], unique=True)

    # Create content_nodes table
    op.create_table(
        'content_nodes',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('slug', sa.String(length=255), nullable=False),
        sa.Column('title', sa.String(length=500), nullable=False),
        sa.Column('content', sa.Text(), nullable=True),
        sa.Column('level', sa.String(length=50), nullable=False),
        sa.Column('parent_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('is_published', sa.Boolean(), nullable=False),
        sa.Column('is_locked', sa.Boolean(), nullable=False),
        sa.Column('metadata', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('created_by_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.ForeignKeyConstraint(['created_by_id'], ['users'], ),
        sa.ForeignKeyConstraint(['parent_id'], ['content_nodes'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_content_nodes_slug'), 'content_nodes', ['slug'], unique=True)
    op.create_index(op.f('ix_content_nodes_level'), 'content_nodes', ['level'])
    op.create_index(op.f('ix_content_nodes_is_published'), 'content_nodes', ['is_published'])

    # Create revisions table
    op.create_table(
        'revisions',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('content_node_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('title', sa.String(length=500), nullable=False),
        sa.Column('content', sa.Text(), nullable=True),
        sa.Column('change_summary', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('created_by_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.ForeignKeyConstraint(['content_node_id'], ['content_nodes'], ),
        sa.ForeignKeyConstraint(['created_by_id'], ['users'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # Create edit_suggestions table
    op.create_table(
        'edit_suggestions',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('content_node_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('title', sa.String(length=500), nullable=False),
        sa.Column('content', sa.Text(), nullable=True),
        sa.Column('change_summary', sa.Text(), nullable=False),
        sa.Column('status', sa.String(length=50), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('created_by_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('reviewed_by_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('reviewed_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['content_node_id'], ['content_nodes'], ),
        sa.ForeignKeyConstraint(['created_by_id'], ['users'], ),
        sa.ForeignKeyConstraint(['reviewed_by_id'], ['users'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_edit_suggestions_status'), 'edit_suggestions', ['status'])

    # Create user_flags table
    op.create_table(
        'user_flags',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('content_node_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('reason', sa.String(length=500), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('severity', sa.String(length=50), nullable=False),
        sa.Column('status', sa.String(length=50), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('created_by_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('reviewed_by_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('reviewed_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['content_node_id'], ['content_nodes'], ),
        sa.ForeignKeyConstraint(['created_by_id'], ['users'], ),
        sa.ForeignKeyConstraint(['reviewed_by_id'], ['users'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_user_flags_status'), 'user_flags', ['status'])

    # Create path_blocks association table for ordered path composition
    op.create_table(
        'path_blocks',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('path_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('block_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('position', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['path_id'], ['content_nodes'], ),
        sa.ForeignKeyConstraint(['block_id'], ['content_nodes'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('path_id', 'block_id', name='uq_path_block_unique')
    )
    op.create_index('ix_path_blocks_path_id_position', 'path_blocks', ['path_id', 'position'])


def downgrade() -> None:
    op.drop_index('ix_path_blocks_path_id_position', table_name='path_blocks')
    op.drop_table('path_blocks')
    op.drop_index(op.f('ix_user_flags_status'), table_name='user_flags')
    op.drop_table('user_flags')
    op.drop_index(op.f('ix_edit_suggestions_status'), table_name='edit_suggestions')
    op.drop_table('edit_suggestions')
    op.drop_table('revisions')
    op.drop_index(op.f('ix_content_nodes_is_published'), table_name='content_nodes')
    op.drop_index(op.f('ix_content_nodes_level'), table_name='content_nodes')
    op.drop_index(op.f('ix_content_nodes_slug'), table_name='content_nodes')
    op.drop_table('content_nodes')
    op.drop_index(op.f('ix_users_username'), table_name='users')
    op.drop_index(op.f('ix_users_email'), table_name='users')
    op.drop_table('users')
