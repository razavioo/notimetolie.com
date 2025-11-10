from __future__ import annotations

from typing import Optional, Dict, Any, List
import uuid

try:
    from meilisearch import Client
except Exception:
    # Minimal stub for tests when Meilisearch client isn't available
    class Client:
        def __init__(self, *a, **k): pass
        def get_index(self, *a, **k):
            return self
        def create_index(self, *a, **k):
            return {"uid": "0"}
        def index(self, *a, **k):
            return self
        def update_settings(self, *a, **k):
            return {"uid": "0"}
        def wait_for_task(self, *a, **k):
            return None
        def add_documents(self, *a, **k):
            return {"uid": "0"}
        def delete_document(self, *a, **k):
            return {"uid": "0"}
        def delete_all_documents(self, *a, **k):
            return {"uid": "0"}

from ..config import settings


INDEX_NAME = "content_nodes"

_client: Optional[Client] = None
_initialized: bool = False


def get_client() -> Client:
    global _client
    if _client is None:
        _client = Client(settings.meilisearch_url, settings.meilisearch_master_key)
    return _client


def ensure_index_bootstrapped() -> None:
    """Create index and configure filterable/searchable attributes if missing."""
    global _initialized
    if _initialized:
        return

    client = get_client()
    try:
        client.get_index(INDEX_NAME)
    except Exception:
        client.create_index(INDEX_NAME, {"primaryKey": "id"})

    # Settings: filter on booleans and enums; search over relevant fields
    index = client.index(INDEX_NAME)
    try:
        task = index.update_settings({
            "filterableAttributes": ["is_published", "level"],
            "searchableAttributes": ["title", "content", "slug"],
            "displayedAttributes": ["id", "title", "slug", "level", "content", "is_published"],
        })
        if isinstance(task, dict) and task.get("uid"):
            client.wait_for_task(task["uid"])  # best effort
    except Exception:
        # Non-fatal; continue
        pass

    _initialized = True


def serialize_node(node) -> Dict[str, Any]:
    from ..models import NodeLevel

    return {
        "id": str(node.id),
        "slug": node.slug,
        "title": node.title or "",
        "content": node.content or "",
        "level": node.level.value if isinstance(node.level, NodeLevel) else str(node.level),
        "is_published": bool(node.is_published),
    }


def index_nodes(docs: List[Dict[str, Any]]) -> None:
    client = get_client()
    index = client.index(INDEX_NAME)
    if not docs:
        return
    index.add_documents(docs)


def index_node(node) -> None:
    index_nodes([serialize_node(node)])


def delete_node(node_id: uuid.UUID | str) -> None:
    client = get_client()
    index = client.index(INDEX_NAME)
    index.delete_document(str(node_id))


async def reindex_all(db_session) -> Dict[str, Any]:
    """Rebuild index from DB content."""
    from sqlalchemy import select
    from ..models import ContentNode

    ensure_index_bootstrapped()
    client = get_client()
    index = client.index(INDEX_NAME)

    # Clear existing documents
    try:
        task = index.delete_all_documents()
        if isinstance(task, dict) and task.get("uid"):
            client.wait_for_task(task["uid"])  # wait to avoid race with add
    except Exception:
        pass

    result = await db_session.execute(select(ContentNode))
    nodes = result.scalars().all()
    docs = [serialize_node(n) for n in nodes]
    # Batch add
    for i in range(0, len(docs), 500):
        batch = docs[i:i+500]
        index.add_documents(batch)

    return {"indexed": len(docs)}
