"""Create AI configuration tables

Revision ID: 002
Revises: 001
Create Date: 2025-11-14

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import Column, String, Text, Boolean, ForeignKey, JSON, Enum as SQLEnum, CHAR


# revision identifiers, used by Alembic.
revision = '002'
down_revision = '001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Create AI configuration, jobs, and suggestion tables."""
    
    # Create ai_configurations table
    op.create_table(
        'ai_configurations',
        Column('id', CHAR(36), primary_key=True),
        Column('user_id', CHAR(36), ForeignKey('users.id'), nullable=False, index=True),
        Column('name', String(100), nullable=False),
        Column('description', Text, nullable=True),
        Column('provider', String(50), nullable=False),
        Column('agent_type', String(50), nullable=False),
        Column('api_key_encrypted', Text, nullable=True),
        Column('model_name', String(50), nullable=False),
        Column('api_endpoint', String(255), nullable=True),
        Column('temperature', JSON, nullable=True),
        Column('max_tokens', JSON, nullable=True),
        Column('system_prompt', Text, nullable=True),
        Column('mcp_enabled', Boolean, nullable=False, server_default='1'),
        Column('mcp_server_url', String(255), nullable=True),
        Column('mcp_capable', Boolean, nullable=False, server_default='0'),
        Column('can_create_blocks', Boolean, nullable=False, server_default='1'),
        Column('can_edit_blocks', Boolean, nullable=False, server_default='0'),
        Column('can_search_web', Boolean, nullable=False, server_default='1'),
        Column('daily_request_limit', JSON, nullable=True),
        Column('is_active', Boolean, nullable=False, server_default='1'),
        Column('created_at', JSON, nullable=False),
        Column('updated_at', JSON, nullable=False),
    )
    
    # Create ai_jobs table
    op.create_table(
        'ai_jobs',
        Column('id', CHAR(36), primary_key=True),
        Column('configuration_id', CHAR(36), ForeignKey('ai_configurations.id'), nullable=False, index=True),
        Column('user_id', CHAR(36), ForeignKey('users.id'), nullable=False, index=True),
        Column('job_type', String(50), nullable=False),
        Column('status', String(20), nullable=False),
        Column('input_prompt', Text, nullable=False),
        Column('input_metadata', JSON, nullable=True),
        Column('output_data', JSON, nullable=True),
        Column('suggested_blocks', JSON, nullable=True),
        Column('started_at', JSON, nullable=True),
        Column('completed_at', JSON, nullable=True),
        Column('error_message', Text, nullable=True),
        Column('tokens_used', JSON, nullable=True),
        Column('execution_time_ms', JSON, nullable=True),
        Column('created_at', JSON, nullable=False),
        Column('updated_at', JSON, nullable=False),
    )
    
    # Create ai_block_suggestions table
    op.create_table(
        'ai_block_suggestions',
        Column('id', CHAR(36), primary_key=True),
        Column('ai_job_id', CHAR(36), ForeignKey('ai_jobs.id'), nullable=False, index=True),
        Column('user_id', CHAR(36), ForeignKey('users.id'), nullable=False, index=True),
        Column('title', String(255), nullable=False),
        Column('slug', String(255), nullable=False),
        Column('content', Text, nullable=False),
        Column('block_type', String(50), nullable=False, server_default='text'),
        Column('language', String(10), nullable=True),
        Column('tags', JSON, nullable=True),
        Column('source_urls', JSON, nullable=True),
        Column('confidence_score', JSON, nullable=True),
        Column('ai_rationale', Text, nullable=True),
        Column('status', String(20), nullable=False, server_default='pending'),
        Column('user_feedback', Text, nullable=True),
        Column('approved_at', JSON, nullable=True),
        Column('rejected_at', JSON, nullable=True),
        Column('created_block_id', CHAR(36), ForeignKey('content_nodes.id'), nullable=True),
        Column('created_at', JSON, nullable=False),
        Column('updated_at', JSON, nullable=False),
    )


def downgrade() -> None:
    """Drop AI configuration tables."""
    op.drop_table('ai_block_suggestions')
    op.drop_table('ai_jobs')
    op.drop_table('ai_configurations')
