from __future__ import annotations

from typing import Any, Dict
import uuid
try:
    from meilisearch.errors import MeilisearchApiError
except Exception:
    class MeilisearchApiError(Exception):
        pass

from ..services.search import index_node, delete_node, ensure_index_bootstrapped
from ..config import settings

from .events import (
    Event,
    UserRegistered,
    BlockCreated,
    BlockUpdated,
    BlockDeleted,
    PathCreated,
    PathUpdated,
    PathDeleted,
    SuggestionCreated,
    SuggestionApproved,
    SuggestionRejected,
)


async def search_index_listener(event: Event) -> None:
    """Index maintenance listener for content events.

    Keeps Meilisearch `content_nodes` index in sync with block/path lifecycle.
    No-op if Meilisearch is not reachable.
    """
    try:
        ensure_index_bootstrapped()
    except Exception:
        # If bootstrapping fails, skip silently
        return None

    try:
        from .events import BlockCreated, BlockUpdated, BlockDeleted, PathCreated, PathUpdated, PathDeleted
        from ..database import AsyncSessionLocal
        from sqlalchemy import select
        from ..models import ContentNode

        if isinstance(event, (BlockCreated, PathCreated, BlockUpdated, PathUpdated)):
            # Fetch node from DB and index
            node_id = getattr(event, "block_id", None) or getattr(event, "path_id", None)
            async with AsyncSessionLocal() as session:
                result = await session.execute(select(ContentNode).where(ContentNode.id == node_id))
                node = result.scalar_one_or_none()
                if node:
                    index_node(node)
        elif isinstance(event, (BlockDeleted, PathDeleted)):
            node_id = getattr(event, "block_id", None) or getattr(event, "path_id", None)
            delete_node(node_id)
    except MeilisearchApiError:
        # Swallow Meilisearch API errors to avoid impacting app flow
        return None
    except Exception:
        return None


def notification_listener(event: Event) -> None:
    """
    Basic notification listener stub.
    Future: send emails or in-app notifications.
    """
    # No-op for now to avoid side effects during tests.
    # Example future handling:
    # - Send email to suggestion author when approved/rejected
    # - In-app notification to moderators on new suggestions
    if isinstance(event, (SuggestionApproved, SuggestionRejected, SuggestionCreated)):
        _ = serialize_event(event)
    return None


def serialize_event(event: Event) -> Dict[str, Any]:
    """Helper to convert events to simple dicts, if needed."""
    data = event.__dict__.copy()
    for k, v in list(data.items()):
        if isinstance(v, uuid.UUID):
            data[k] = str(v)
    return data
