import uuid
from datetime import datetime
from typing import Dict, List, Optional
from .schemas import BlockCreate, PathCreate, BlockType


class DatabaseService:
    def __init__(self):
        self.blocks: Dict[str, dict] = {}
        self.blocks_by_slug: Dict[str, str] = {}
        self.paths: Dict[str, dict] = {}
        self.paths_by_slug: Dict[str, str] = {}
        self.suggestions: Dict[str, dict] = {}
        self.revisions: Dict[str, dict] = {}

    def create_block(self, data: dict) -> dict:
        block_id = str(uuid.uuid4())
        now = datetime.utcnow()

        block = {
            "id": block_id,
            "title": data["title"],
            "content": data.get("content"),
            "slug": data["slug"],
            "block_type": data.get("block_type", BlockType.TEXT),
            "is_published": False,
            "is_locked": False,
            "created_at": now,
            "updated_at": now,
            "created_by_id": data.get("created_by_id"),
            "metadata": data.get("metadata")
        }

        self.blocks[block_id] = block
        self.blocks_by_slug[data["slug"]] = block_id

        return block

    def get_block_by_slug(self, slug: str) -> Optional[dict]:
        block_id = self.blocks_by_slug.get(slug)
        if not block_id:
            return None
        return self.blocks.get(block_id)

    def get_block_by_id(self, block_id: str) -> Optional[dict]:
        return self.blocks.get(block_id)

    def update_block(self, block_id: str, data: dict) -> Optional[dict]:
        block = self.blocks.get(block_id)
        if not block:
            return None

        for key, value in data.items():
            if value is not None:
                block[key] = value

        block["updated_at"] = datetime.utcnow()

        if "slug" in data:
            old_slug = None
            for slug, bid in self.blocks_by_slug.items():
                if bid == block_id:
                    old_slug = slug
                    break
            if old_slug:
                del self.blocks_by_slug[old_slug]
            self.blocks_by_slug[data["slug"]] = block_id

        return block

    def create_path(self, data: dict) -> dict:
        path_id = str(uuid.uuid4())
        now = datetime.utcnow()

        path = {
            "id": path_id,
            "title": data["title"],
            "slug": data["slug"],
            "block_ids": data["block_ids"],
            "is_published": False,
            "created_at": now,
            "updated_at": now,
            "created_by_id": data.get("created_by_id"),
            "metadata": data.get("metadata")
        }

        self.paths[path_id] = path
        self.paths_by_slug[data["slug"]] = path_id

        return path

    def get_path_by_slug(self, slug: str) -> Optional[dict]:
        path_id = self.paths_by_slug.get(slug)
        if not path_id:
            return None
        return self.paths.get(path_id)

    def get_path_by_id(self, path_id: str) -> Optional[dict]:
        return self.paths.get(path_id)

    def add_suggestion(self, block_id: str, suggestion: dict) -> dict:
        suggestion_id = str(uuid.uuid4())
        now = datetime.utcnow()

        rec = {
            "id": suggestion_id,
            "block_id": block_id,
            "title": suggestion["title"],
            "content": suggestion.get("content"),
            "change_summary": suggestion["change_summary"],
            "status": "pending",
            "created_at": now,
            "created_by_id": suggestion.get("created_by_id")
        }

        self.suggestions[suggestion_id] = rec
        return rec

    def get_suggestions(self, block_id: str) -> List[dict]:
        return [
            s for s in self.suggestions.values()
            if s["block_id"] == block_id
        ]

    def create_revision(self, block_id: str, data: dict) -> dict:
        revision_id = str(uuid.uuid4())
        now = datetime.utcnow()

        revision = {
            "id": revision_id,
            "block_id": block_id,
            "title": data["title"],
            "content": data.get("content"),
            "change_summary": data.get("change_summary"),
            "created_at": now,
            "created_by_id": data.get("created_by_id")
        }

        self.revisions[revision_id] = revision
        return revision

    def get_revisions(self, block_id: str) -> List[dict]:
        return [
            r for r in self.revisions.values()
            if r["block_id"] == block_id
        ]


db = DatabaseService()