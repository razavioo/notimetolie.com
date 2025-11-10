from __future__ import annotations

from typing import Optional, Dict, Any
import uuid

try:
    from meilisearch import Client
except Exception:  # pragma: no cover - optional dependency environment
    Client = None  # type: ignore

from ..config import settings


class SearchIndexService:
    """
    Simple Meilisearch integration. Safe no-op when not configured or client unavailable.
    """

    def __init__(self) -> None:
        self._client: Optional[Client] = None
        self._blocks_index = "blocks"
        self._paths_index = "paths"
        self._init_client()

    def _init_client(self) -> None:
        if Client is None:
            return
        url = settings.meilisearch_url
        key = settings.meilisearch_master_key
        if not url or not key:
            return
        try:
            self._client = Client(url, key)
            # Ensure indexes exist
            self._client.get_or_create_index(self._blocks_index, {"primaryKey": "id"})
            self._client.get_or_create_index(self._paths_index, {"primaryKey": "id"})
        except Exception:
            # Swallow errors to avoid breaking API when Meilisearch is down/not available
            self._client = None

    def _upsert(self, index: str, document: Dict[str, Any]) -> None:
        if not self._client:
            return
        try:
            self._client.index(index).add_documents([document])
        except Exception:
            pass

    def _delete(self, index: str, id_: str) -> None:
        if not self._client:
            return
        try:
            self._client.index(index).delete_document(id_)
        except Exception:
            pass

    # Public APIs used by listeners
    def index_block(self, block_id: uuid.UUID, slug: str, title: str, extra: Optional[Dict[str, Any]] = None) -> None:
        doc = {"id": str(block_id), "slug": slug, "title": title}
        if extra:
            doc.update(extra)
        self._upsert(self._blocks_index, doc)

    def remove_block(self, block_id: uuid.UUID) -> None:
        self._delete(self._blocks_index, str(block_id))

    def index_path(self, path_id: uuid.UUID, slug: str, title: str, extra: Optional[Dict[str, Any]] = None) -> None:
        doc = {"id": str(path_id), "slug": slug, "title": title}
        if extra:
            doc.update(extra)
        self._upsert(self._paths_index, doc)

    def remove_path(self, path_id: uuid.UUID) -> None:
        self._delete(self._paths_index, str(path_id))


# Global service instance
search_index = SearchIndexService()

