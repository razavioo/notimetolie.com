from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional
import uuid


@dataclass
class Event:
    """Base domain event. Occurred_at is set automatically and excluded from __init__ to avoid dataclass inheritance ordering issues."""
    occurred_at: datetime = field(default_factory=lambda: datetime.utcnow(), init=False)


# Core domain events

@dataclass
class UserRegistered(Event):
    user_id: uuid.UUID
    username: str
    email: str


@dataclass
class BlockCreated(Event):
    block_id: uuid.UUID
    slug: str
    title: str
    created_by_id: Optional[uuid.UUID]


@dataclass
class BlockUpdated(Event):
    block_id: uuid.UUID
    slug: str
    title: str
    updated_by_id: Optional[uuid.UUID]


@dataclass
class BlockDeleted(Event):
    block_id: uuid.UUID
    slug: str
    deleted_by_id: Optional[uuid.UUID]


@dataclass
class PathCreated(Event):
    path_id: uuid.UUID
    slug: str
    title: str
    created_by_id: Optional[uuid.UUID]


@dataclass
class PathUpdated(Event):
    path_id: uuid.UUID
    slug: str
    title: str
    updated_by_id: Optional[uuid.UUID]


@dataclass
class PathDeleted(Event):
    path_id: uuid.UUID
    slug: str
    deleted_by_id: Optional[uuid.UUID]


@dataclass
class SuggestionCreated(Event):
    suggestion_id: uuid.UUID
    block_id: uuid.UUID
    title: str
    created_by_id: Optional[uuid.UUID]


@dataclass
class SuggestionApproved(Event):
    suggestion_id: uuid.UUID
    block_id: uuid.UUID
    title: str
    approved_by_id: Optional[uuid.UUID]
    created_by_id: Optional[uuid.UUID]


@dataclass
class SuggestionRejected(Event):
    suggestion_id: uuid.UUID
    block_id: uuid.UUID
    title: str
    rejected_by_id: Optional[uuid.UUID]
    created_by_id: Optional[uuid.UUID]


@dataclass
class SuggestionApproved(Event):
    suggestion_id: uuid.UUID
    block_id: uuid.UUID
    title: str
    approved_by_id: Optional[uuid.UUID]
    created_by_id: Optional[uuid.UUID]


@dataclass
class SuggestionRejected(Event):
    suggestion_id: uuid.UUID
    block_id: uuid.UUID
    title: str
    rejected_by_id: Optional[uuid.UUID]
    created_by_id: Optional[uuid.UUID]
