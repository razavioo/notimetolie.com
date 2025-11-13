from sqlalchemy import Column, String, Text, DateTime, Boolean, Integer, ForeignKey, JSON, Enum, CHAR, UniqueConstraint, Index
from sqlalchemy.types import TypeDecorator
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from enum import Enum as PyEnum

from .database import Base
try:
    from .content_serializer import ContentSerializer, BlockNoteContent
except Exception:
    # Minimal stubs for tests, if content serializer isn’t available
    class BlockNoteContent:
        def __init__(self, blocks):
            self.blocks = blocks
        def to_html(self):
            return ""
    class ContentSerializer:
        @staticmethod
        def serialize_blocknote_content(blocks):
            return ""
        @staticmethod
        def deserialize_blocknote_content(content):
            return BlockNoteContent([])
        @staticmethod
        def is_blocknote_content(content):
            return False
        @staticmethod
        def extract_text_content(blocks):
            return ""
from sqlalchemy.types import TypeDecorator, CHAR


class GUID(TypeDecorator):
    impl = CHAR
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == 'postgresql':
            from sqlalchemy.dialects.postgresql import UUID as PG_UUID
            return dialect.type_descriptor(PG_UUID(as_uuid=True))
        else:
            return dialect.type_descriptor(CHAR(36))

    def process_bind_param(self, value, dialect):
        if value is None:
            return value
        if dialect.name == 'postgresql':
            return value
        if isinstance(value, uuid.UUID):
            return str(value)
        return str(value)

    def process_result_value(self, value, dialect):
        if value is None:
            return value
        return uuid.UUID(str(value))
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

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    slug = Column(String(255), unique=True, nullable=False, index=True)
    title = Column(String(500), nullable=False)
    content = Column(Text, nullable=True)
    level = Column(Enum(NodeLevel), nullable=False, index=True)
    parent_id = Column(GUID(), ForeignKey("content_nodes.id"), nullable=True)
    is_published = Column(Boolean, default=False, nullable=False, index=True)
    is_locked = Column(Boolean, default=False, nullable=False)
    # Use a non-reserved attribute name and map to DB column 'metadata'
    meta_json = Column("metadata", JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    created_by_id = Column(GUID(), ForeignKey("users.id"), nullable=True)

    # Relationships
    parent = relationship("ContentNode", remote_side=[id])
    children = relationship("ContentNode")
    created_by = relationship("User")
    revisions = relationship("Revision", back_populates="content_node")
    suggestions = relationship("EditSuggestion", back_populates="content_node")
    
    # For Path nodes, relationship to blocks (simplified for tests)
    # Using parent-child via parent_id instead of secondary table to avoid join ambiguity in SQLite
    # Paths (level=PATH) are parents of blocks (level=BLOCK)
    children = relationship("ContentNode", primaryjoin="ContentNode.parent_id==ContentNode.id", overlaps="parent")

    def __init__(self, **kwargs):
        if "metadata" in kwargs:
            kwargs["meta_json"] = kwargs.pop("metadata")
        for k, v in kwargs.items():
            setattr(self, k, v)

    def __getattribute__(self, name):
        if name == "metadata":
            return object.__getattribute__(self, "meta_json")
        return object.__getattribute__(self, name)

    def __setattr__(self, name, value):
        if name == "metadata":
            name = "meta_json"
        super().__setattr__(name, value)

    def set_blocknote_content(self, blocks: list) -> None:
        """Set content from BlockNote blocks"""
        if blocks:
            self.content = ContentSerializer.serialize_blocknote_content(blocks)
        else:
            self.content = None
    
    def get_blocknote_content(self) -> BlockNoteContent:
        """Get content as BlockNoteContent object"""
        if not self.content:
            return BlockNoteContent([])
        
        return ContentSerializer.deserialize_blocknote_content(self.content)
    
    def get_blocknote_blocks(self) -> list:
        """Get BlockNote blocks for editing"""
        if not self.content:
            return []
        
        blocknote_content = self.get_blocknote_content()
        return blocknote_content.blocks
    
    def get_plain_text(self) -> str:
        """Extract plain text for search and display"""
        if not self.content:
            return ""
        
        try:
            # Check if content is in BlockNote format
            if ContentSerializer.is_blocknote_content(self.content):
                blocks = self.get_blocknote_blocks()
                return ContentSerializer.extract_text_content(blocks)
            else:
                # Legacy content
                return self.content or ""
        except Exception:
            # Fallback to raw content
            return self.content or ""
    
    def to_html(self) -> str:
        """Convert content to HTML for embedding"""
        if not self.content:
            return ""
        
        try:
            # Check if content is in BlockNote format
            if ContentSerializer.is_blocknote_content(self.content):
                blocknote_content = self.get_blocknote_content()
                return blocknote_content.to_html()
            else:
                # Legacy content - basic HTML escaping
                import html
                return f"<p>{html.escape(self.content)}</p>"
        except Exception:
            return "<p>Content unavailable</p>"


class Revision(Base):
    __tablename__ = "revisions"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    content_node_id = Column(GUID(), ForeignKey("content_nodes.id"), nullable=False)
    title = Column(String(500), nullable=False)
    content = Column(Text, nullable=True)
    change_summary = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    created_by_id = Column(GUID(), ForeignKey("users.id"), nullable=True)

    # Relationships
    content_node = relationship("ContentNode", back_populates="revisions")
    created_by = relationship("User")


class EditSuggestionStatus(PyEnum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class EditSuggestion(Base):
    __tablename__ = "edit_suggestions"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    content_node_id = Column(GUID(), ForeignKey("content_nodes.id"), nullable=False)
    title = Column(String(500), nullable=False)
    content = Column(Text, nullable=True)
    change_summary = Column(Text, nullable=False)
    status = Column(Enum(EditSuggestionStatus), default=EditSuggestionStatus.PENDING, nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    created_by_id = Column(GUID(), ForeignKey("users.id"), nullable=True)
    reviewed_by_id = Column(GUID(), ForeignKey("users.id"), nullable=True)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    content_node = relationship("ContentNode", back_populates="suggestions")
    created_by = relationship("User", foreign_keys=[created_by_id])
    reviewed_by = relationship("User", foreign_keys=[reviewed_by_id])


class User(Base):
    __tablename__ = "users"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    username = Column(String(100), unique=True, nullable=False, index=True)
    full_name = Column(String(255), nullable=True)
    hashed_password = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), default=UserRole.BUILDER, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    xp = Column(Integer, default=0, nullable=False)
    level = Column(Integer, default=1, nullable=False)
    # Use a non-reserved attribute name and map to DB column 'metadata'
    meta_json = Column("metadata", JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    created_nodes = relationship("ContentNode", foreign_keys=[ContentNode.created_by_id])
    created_revisions = relationship("Revision")
    created_suggestions = relationship("EditSuggestion", foreign_keys=[EditSuggestion.created_by_id])
    reviewed_suggestions = relationship("EditSuggestion", foreign_keys=[EditSuggestion.reviewed_by_id])

    def __init__(self, **kwargs):
        if "metadata" in kwargs:
            kwargs["meta_json"] = kwargs.pop("metadata")
        for k, v in kwargs.items():
            setattr(self, k, v)

    def __getattribute__(self, name):
        if name == "metadata":
            return object.__getattribute__(self, "meta_json")
        return object.__getattribute__(self, name)

    def __setattr__(self, name, value):
        if name == "metadata":
            name = "meta_json"
        super().__setattr__(name, value)

    def set_blocknote_content(self, blocks: list) -> None:
        """Set content from BlockNote blocks"""
        if blocks:
            self.content = ContentSerializer.serialize_blocknote_content(blocks)
        else:
            self.content = None
    
    def get_blocknote_content(self) -> BlockNoteContent:
        """Get content as BlockNoteContent object"""
        if not self.content:
            return BlockNoteContent([])
        
        return ContentSerializer.deserialize_blocknote_content(self.content)
    
    def get_blocknote_blocks(self) -> list:
        """Get BlockNote blocks for editing"""
        if not self.content:
            return []
        
        blocknote_content = self.get_blocknote_content()
        return blocknote_content.blocks
    
    def get_plain_text(self) -> str:
        """Extract plain text for search and display"""
        if not self.content:
            return ""
        
        try:
            # Check if content is in BlockNote format
            if ContentSerializer.is_blocknote_content(self.content):
                blocks = self.get_blocknote_blocks()
                return ContentSerializer.extract_text_content(blocks)
            else:
                # Legacy content
                return self.content or ""
        except Exception:
            # Fallback to raw content
            return self.content or ""
    
    def to_html(self) -> str:
        """Convert content to HTML for embedding"""
        if not self.content:
            return ""
        
        try:
            # Check if content is in BlockNote format
            if ContentSerializer.is_blocknote_content(self.content):
                blocknote_content = self.get_blocknote_content()
                return blocknote_content.to_html()
            else:
                # Legacy content - basic HTML escaping
                import html
                return f"<p>{html.escape(self.content)}</p>"
        except Exception:
            return "<p>Content unavailable</p>"


class FlagSeverity(PyEnum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class FlagStatus(PyEnum):
    PENDING = "pending"
    REVIEWED = "reviewed"
    RESOLVED = "resolved"
    DISMISSED = "dismissed"


class UserFlag(Base):
    __tablename__ = "user_flags"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    content_node_id = Column(GUID(), ForeignKey("content_nodes.id"), nullable=True)
    reason = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    severity = Column(Enum(FlagSeverity), default=FlagSeverity.LOW, nullable=False)
    status = Column(Enum(FlagStatus), default=FlagStatus.PENDING, nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    created_by_id = Column(GUID(), ForeignKey("users.id"), nullable=True)
    reviewed_by_id = Column(GUID(), ForeignKey("users.id"), nullable=True)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    content_node = relationship("ContentNode")
    created_by = relationship("User", foreign_keys=[created_by_id])
    reviewed_by = relationship("User", foreign_keys=[reviewed_by_id])


class PathBlock(Base):
    __tablename__ = "path_blocks"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    path_id = Column(GUID(), ForeignKey("content_nodes.id"), nullable=False)
    block_id = Column(GUID(), ForeignKey("content_nodes.id"), nullable=False)
    position = Column(Integer, nullable=False)

    __table_args__ = (
        UniqueConstraint('path_id', 'block_id', name='uq_path_block_unique'),
        Index('ix_path_blocks_path_id_position', 'path_id', 'position'),
    )


class UserProgress(Base):
    """Track user's mastery/checkpoint of blocks and paths"""
    __tablename__ = "user_progress"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    user_id = Column(GUID(), ForeignKey("users.id"), nullable=False, index=True)
    content_node_id = Column(GUID(), ForeignKey("content_nodes.id"), nullable=False, index=True)
    mastered_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    # Store any additional metadata (e.g., confidence level, notes)
    # Use a non-reserved attribute name and map to DB column 'metadata'
    meta_json = Column("metadata", JSON, nullable=True)

    # Relationships
    user = relationship("User", backref="progress")
    content_node = relationship("ContentNode")

    __table_args__ = (
        UniqueConstraint('user_id', 'content_node_id', name='uq_user_content_progress'),
        Index('ix_user_progress_user_id_mastered_at', 'user_id', 'mastered_at'),
    )

    def __init__(self, **kwargs):
        if "metadata" in kwargs:
            kwargs["meta_json"] = kwargs.pop("metadata")
        for k, v in kwargs.items():
            setattr(self, k, v)

    def __getattribute__(self, name):
        if name == "metadata":
            return object.__getattribute__(self, "meta_json")
        return object.__getattribute__(self, name)

    def __setattr__(self, name, value):
        if name == "metadata":
            name = "meta_json"
        super().__setattr__(name, value)
