from sqlalchemy import Column, String, Text, DateTime, Boolean, Integer, ForeignKey, JSONB
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from enum import Enum as PyEnum

from .database import Base
import uuid


class NodeLevel(PyEnum):
    PATH = "path"
    BLOCK = "block"


class UserRole(PyEnum):
    GUEST = "guest"
    BUILDER = "builder"
    TRUSTED_BUILDER = "trusted_builder"
    MODERATOR = "moderator"
    ADMIN = "admin"


class ContentNode(Base):
    __tablename__ = "content_nodes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    slug = Column(String(255), unique=True, nullable=False, index=True)
    title = Column(String(500), nullable=False)
    content = Column(Text, nullable=True)
    level = Column(String(50), nullable=False, index=True)
    parent_id = Column(UUID(as_uuid=True), ForeignKey("content_nodes.id"), nullable=True)
    is_published = Column(Boolean, default=False, nullable=False, index=True)
    is_locked = Column(Boolean, default=False, nullable=False)
    metadata = Column(JSONB, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    created_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)

    # Relationships
    parent = relationship("ContentNode", remote_side=[id])
    children = relationship("ContentNode")
    created_by = relationship("User")
    revisions = relationship("Revision", back_populates="content_node")
    suggestions = relationship("EditSuggestion", back_populates="content_node")


class Revision(Base):
    __tablename__ = "revisions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    content_node_id = Column(UUID(as_uuid=True), ForeignKey("content_nodes.id"), nullable=False)
    title = Column(String(500), nullable=False)
    content = Column(Text, nullable=True)
    change_summary = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    created_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)

    # Relationships
    content_node = relationship("ContentNode", back_populates="revisions")
    created_by = relationship("User")


class EditSuggestion(Base):
    __tablename__ = "edit_suggestions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    content_node_id = Column(UUID(as_uuid=True), ForeignKey("content_nodes.id"), nullable=False)
    title = Column(String(500), nullable=False)
    content = Column(Text, nullable=True)
    change_summary = Column(Text, nullable=False)
    status = Column(String(50), default="pending", nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    created_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    reviewed_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    content_node = relationship("ContentNode", back_populates="suggestions")
    created_by = relationship("User", foreign_keys=[created_by_id])
    reviewed_by = relationship("User", foreign_keys=[reviewed_by_id])


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    username = Column(String(100), unique=True, nullable=False, index=True)
    full_name = Column(String(255), nullable=True)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(50), default=UserRole.BUILDER.value, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    xp = Column(Integer, default=0, nullable=False)
    level = Column(Integer, default=1, nullable=False)
    metadata = Column(JSONB, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    created_nodes = relationship("ContentNode", foreign_keys=[ContentNode.created_by_id])
    created_revisions = relationship("Revision")
    created_suggestions = relationship("EditSuggestion", foreign_keys=[EditSuggestion.created_by_id])
    reviewed_suggestions = relationship("EditSuggestion", foreign_keys=[EditSuggestion.reviewed_by_id])


class UserFlag(Base):
    __tablename__ = "user_flags"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    content_node_id = Column(UUID(as_uuid=True), ForeignKey("content_nodes.id"), nullable=True)
    reason = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    severity = Column(String(50), default="low", nullable=False)
    status = Column(String(50), default="pending", nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    created_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    reviewed_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    content_node = relationship("ContentNode")
    created_by = relationship("User", foreign_keys=[created_by_id])
    reviewed_by = relationship("User", foreign_keys=[reviewed_by_id])