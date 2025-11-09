from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from uuid import UUID
from enum import Enum


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


class BlockCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=500)
    content: Optional[str] = None
    slug: str = Field(..., min_length=1, max_length=200)
    block_type: BlockType = BlockType.TEXT
    metadata: Optional[dict] = None


class BlockUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=500)
    content: Optional[str] = None
    metadata: Optional[dict] = None


class BlockPublic(BaseModel):
    id: str
    title: str
    content: Optional[str]
    slug: str
    block_type: BlockType
    is_published: bool
    is_locked: bool
    created_at: datetime
    updated_at: datetime
    created_by_id: Optional[str] = None
    metadata: Optional[dict] = None

    class Config:
        from_attributes = True


class SuggestionCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=500)
    content: Optional[str] = None
    change_summary: str = Field(..., min_length=1)


class SuggestionResponse(BaseModel):
    id: str
    block_id: str
    title: str
    content: Optional[str]
    change_summary: str
    status: str
    created_at: datetime
    created_by_id: Optional[str] = None

    class Config:
        from_attributes = True


class PathCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=500)
    slug: str = Field(..., min_length=1, max_length=200)
    block_ids: List[str]
    metadata: Optional[dict] = None


class PathPublic(BaseModel):
    id: str
    title: str
    slug: str
    blocks: List[BlockPublic]
    is_published: bool
    created_at: datetime
    updated_at: datetime
    created_by_id: Optional[str] = None
    metadata: Optional[dict] = None

    class Config:
        from_attributes = True