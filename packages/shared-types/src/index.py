from typing import Optional, List, Dict, Any, Union
from datetime import datetime
from uuid import UUID
from enum import Enum
from pydantic import BaseModel, Field


class BlockType(str, Enum):
    TEXT = "text"
    IMAGE = "image"
    VIDEO = "video"
    CODE = "code"
    LINK = "link"
    EMBEDDED = "embedded"
    CALLOUT = "callout"
    TABLE = "table"


class UserRole(str, Enum):
    GUEST = "guest"
    BUILDER = "builder"
    TRUSTED_BUILDER = "trusted_builder"
    MODERATOR = "moderator"
    ADMIN = "admin"


class NodeStatus(str, Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    ARCHIVED = "archived"


class SuggestionStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class FeedbackType(str, Enum):
    FLAG = "flag"
    LIKE = "like"
    BOOKMARK = "bookmark"
    HELPFUL = "helpful"


class DifficultyLevel(str, Enum):
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"


class BaseNode(BaseModel):
    id: str
    slug: str
    title: str
    description: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    created_by: str
    updated_by: str
    status: NodeStatus
    metadata: Optional[Dict[str, Any]] = None


class Block(BaseNode):
    type: BlockType
    content: Any
    parent_id: Optional[str] = None
    order_index: int = 0
    tags: Optional[List[str]] = None
    revision_count: int = 0
    latest_revision_id: Optional[str] = None


class PathBlock(BaseModel):
    block_id: str
    order_index: int
    is_optional: bool = False
    prerequisites: Optional[List[str]] = None


class Path(BaseNode):
    type: str = "path"
    blocks: List[PathBlock]
    estimated_read_time: Optional[int] = None
    difficulty_level: Optional[DifficultyLevel] = None
    category: Optional[str] = None


class Revision(BaseModel):
    id: str
    node_id: str
    content: Any
    created_at: datetime
    created_by: str
    change_summary: str
    version: int


class User(BaseModel):
    id: str
    username: str
    email: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    avatar_url: Optional[str] = None
    role: UserRole
    xp: int = 0
    level: int = 1
    badges: List[str] = []
    created_at: datetime
    updated_at: datetime
    is_verified: bool = False
    is_active: bool = True


class EditSuggestion(BaseModel):
    id: str
    node_id: str
    suggested_content: Any
    suggested_by: str
    created_at: datetime
    status: SuggestionStatus
    reviewed_by: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    change_summary: str
    review_comment: Optional[str] = None


class UserFeedback(BaseModel):
    id: str
    node_id: str
    user_id: str
    type: FeedbackType
    comment: Optional[str] = None
    created_at: datetime
    resolved_at: Optional[datetime] = None
    resolved_by: Optional[str] = None


class SearchResult(BaseModel):
    id: str
    type: str
    title: str
    description: Optional[str] = None
    content_snippet: str
    relevance_score: float
    url: str
    created_at: datetime
    updated_at: datetime


class APIResponse(BaseModel):
    data: Any
    message: Optional[str] = None
    success: bool
    errors: Optional[List[str]] = None


class PaginationParams(BaseModel):
    page: int = 1
    limit: int = 20
    sort_by: Optional[str] = None
    sort_order: str = "desc"


class PaginatedResponse(BaseModel):
    data: List[Any]
    pagination: Dict[str, Any]


# Event types for the event bus
class BlockCreated(BaseModel):
    block: Block


class BlockUpdated(BaseModel):
    block: Block


class SuggestionSubmitted(BaseModel):
    suggestion: EditSuggestion


class FlagRaised(BaseModel):
    feedback: UserFeedback


class UserLeveledUp(BaseModel):
    user: User


class RevisionCreated(BaseModel):
    revision: Revision


AppEvent = Union[
    BlockCreated,
    BlockUpdated,
    SuggestionSubmitted,
    FlagRaised,
    UserLeveledUp,
    RevisionCreated
]