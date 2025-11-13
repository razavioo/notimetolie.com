"""
AI Configuration models for agent setup and management.
"""
from datetime import datetime
from sqlalchemy import Column, String, JSON, Boolean, ForeignKey, Text, Enum as SQLEnum
from sqlalchemy.orm import relationship
from src.models.base import Base, GUID
import enum


class AIProvider(str, enum.Enum):
    """Supported AI providers."""
    OPENAI = "openai"
    ANTHROPIC = "anthropic"
    CUSTOM = "custom"


class AIAgentType(str, enum.Enum):
    """Types of AI agents."""
    CONTENT_CREATOR = "content_creator"
    CONTENT_RESEARCHER = "content_researcher"
    CONTENT_EDITOR = "content_editor"
    COURSE_DESIGNER = "course_designer"


class AIJobStatus(str, enum.Enum):
    """Status of AI job execution."""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class AIConfiguration(Base):
    """AI agent configuration for users."""
    __tablename__ = "ai_configurations"

    id = Column(GUID, primary_key=True)
    user_id = Column(GUID, ForeignKey("users.id"), nullable=False, index=True)
    
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    provider = Column(SQLEnum(AIProvider), nullable=False, default=AIProvider.OPENAI)
    agent_type = Column(SQLEnum(AIAgentType), nullable=False)
    
    # API configuration
    api_key_encrypted = Column(Text, nullable=True)  # Encrypted API key
    model_name = Column(String(50), nullable=False, default="gpt-4")
    api_endpoint = Column(String(255), nullable=True)  # For custom providers
    
    # Agent settings
    temperature = Column(JSON, nullable=True, default={"value": 0.7})
    max_tokens = Column(JSON, nullable=True, default={"value": 2000})
    system_prompt = Column(Text, nullable=True)
    
    # MCP configuration
    mcp_enabled = Column(Boolean, default=True, nullable=False)
    mcp_server_url = Column(String(255), nullable=True)
    
    # Permissions and limits
    can_create_blocks = Column(Boolean, default=True, nullable=False)
    can_edit_blocks = Column(Boolean, default=False, nullable=False)
    can_search_web = Column(Boolean, default=True, nullable=False)
    daily_request_limit = Column(JSON, nullable=True, default={"value": 50})
    
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(JSON, nullable=False)
    updated_at = Column(JSON, nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="ai_configurations")
    ai_jobs = relationship("AIJob", back_populates="configuration", cascade="all, delete-orphan")


class AIJob(Base):
    """AI job execution tracking."""
    __tablename__ = "ai_jobs"

    id = Column(GUID, primary_key=True)
    configuration_id = Column(GUID, ForeignKey("ai_configurations.id"), nullable=False, index=True)
    user_id = Column(GUID, ForeignKey("users.id"), nullable=False, index=True)
    
    # Job details
    job_type = Column(SQLEnum(AIAgentType), nullable=False)
    status = Column(SQLEnum(AIJobStatus), nullable=False, default=AIJobStatus.PENDING)
    
    # Input and output
    input_prompt = Column(Text, nullable=False)
    input_metadata = Column(JSON, nullable=True)  # Additional context
    
    output_data = Column(JSON, nullable=True)  # Generated content
    suggested_blocks = Column(JSON, nullable=True)  # Block IDs found via MCP
    
    # Execution tracking
    started_at = Column(JSON, nullable=True)
    completed_at = Column(JSON, nullable=True)
    error_message = Column(Text, nullable=True)
    
    # Resource usage
    tokens_used = Column(JSON, nullable=True, default={"prompt": 0, "completion": 0})
    execution_time_ms = Column(JSON, nullable=True)
    
    created_at = Column(JSON, nullable=False)
    updated_at = Column(JSON, nullable=False)
    
    # Relationships
    configuration = relationship("AIConfiguration", back_populates="ai_jobs")
    user = relationship("User", back_populates="ai_jobs")
    suggestions = relationship("AIBlockSuggestion", back_populates="ai_job", cascade="all, delete-orphan")


class AIBlockSuggestion(Base):
    """AI-generated block suggestions awaiting user approval."""
    __tablename__ = "ai_block_suggestions"

    id = Column(GUID, primary_key=True)
    ai_job_id = Column(GUID, ForeignKey("ai_jobs.id"), nullable=False, index=True)
    user_id = Column(GUID, ForeignKey("users.id"), nullable=False, index=True)
    
    # Suggested content
    title = Column(String(255), nullable=False)
    slug = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    block_type = Column(String(50), nullable=False, default="text")
    language = Column(String(10), nullable=True)
    tags = Column(JSON, nullable=True)
    
    # Metadata
    source_urls = Column(JSON, nullable=True)  # URLs found during research
    confidence_score = Column(JSON, nullable=True, default={"value": 0.0})
    ai_rationale = Column(Text, nullable=True)  # Why AI suggested this
    
    # Status
    status = Column(String(20), nullable=False, default="pending")  # pending, approved, rejected
    user_feedback = Column(Text, nullable=True)
    
    approved_at = Column(JSON, nullable=True)
    rejected_at = Column(JSON, nullable=True)
    created_block_id = Column(GUID, ForeignKey("content_nodes.id"), nullable=True)
    
    created_at = Column(JSON, nullable=False)
    updated_at = Column(JSON, nullable=False)
    
    # Relationships
    ai_job = relationship("AIJob", back_populates="suggestions")
    user = relationship("User")
    created_block = relationship("ContentNode", foreign_keys=[created_block_id])
