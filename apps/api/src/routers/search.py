from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query, Depends, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..dependencies import require_role
from ..services.search import get_client, ensure_index_bootstrapped, INDEX_NAME, reindex_all


router = APIRouter()


class SearchHit(BaseModel):
    id: str
    title: str
    slug: str
    level: str
    snippet: Optional[str] = None


class SearchResponse(BaseModel):
    query: str
    limit: int
    offset: int
    total: int
    hits: List[SearchHit]


@router.get("/search", response_model=SearchResponse)
async def search(
    q: str = Query(..., min_length=1, description="Search query"),
    limit: int = Query(10, ge=1, le=100),
    offset: int = Query(0, ge=0),
    level: Optional[str] = Query(None, pattern="^(block|path)$", description="Filter by node level"),
    db: AsyncSession = Depends(get_db),
) -> SearchResponse:
    """Search for blocks and paths. Falls back to DB search if Meilisearch is unavailable."""
    try:
        ensure_index_bootstrapped()
        client = get_client()
        index = client.index(INDEX_NAME)

        filters: List[str] = ["is_published = true"]
        if level:
            filters.append(f"level = \"{level}\"")

        params = {
            "limit": limit,
            "offset": offset,
            "filter": filters,
            "attributesToRetrieve": ["id", "title", "slug", "level", "content"],
            "attributesToHighlight": ["title", "content"],
            "highlightPreTag": "<em>",
            "highlightPostTag": "</em>",
        }

        result = index.search(q, params)
        raw_hits = result.get("hits", [])
        total = result.get("estimatedTotalHits") or result.get("totalHits") or len(raw_hits)

        hits: List[SearchHit] = []
        for h in raw_hits:
            formatted = h.get("_formatted") if isinstance(h.get("_formatted"), dict) else {}
            snippet = formatted.get("content") or h.get("content")
            if isinstance(snippet, str):
                snippet = snippet[:240]

            doc_id = h.get("id")
            if doc_id is None:
                continue
            doc_id = str(doc_id)

            hits.append(SearchHit(
                id=doc_id,
                title=h.get("title") or "",
                slug=h.get("slug") or "",
                level=str(h.get("level")) if h.get("level") is not None else "",
                snippet=snippet,
            ))

        return SearchResponse(
            query=q,
            limit=limit,
            offset=offset,
            total=int(total) if isinstance(total, (int, float)) else len(hits),
            hits=hits,
        )
    except Exception as e:
        # Fallback to database search if Meilisearch is unavailable
        from sqlalchemy import select, or_
        from ..models import ContentNode
        
        query_obj = select(ContentNode).where(
            ContentNode.is_published == True,
            or_(
                ContentNode.title.ilike(f"%{q}%"),
                ContentNode.content.ilike(f"%{q}%")
            )
        )
        
        if level:
            from ..models import NodeLevel
            query_obj = query_obj.where(ContentNode.level == NodeLevel(level))
        
        query_obj = query_obj.offset(offset).limit(limit)
        result = await db.execute(query_obj)
        nodes = result.scalars().all()
        
        hits = [
            SearchHit(
                id=str(node.id),
                title=node.title,
                slug=node.slug,
                level=node.level.value,
                snippet=node.content[:200] if node.content else None
            )
            for node in nodes
        ]
        
        return SearchResponse(
            query=q,
            limit=limit,
            offset=offset,
            total=len(hits),
            hits=hits,
        )


@router.post("/search/reindex", status_code=status.HTTP_202_ACCEPTED)
async def reindex(
    _: object = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    """Admin-only endpoint to rebuild the Meilisearch index from DB."""
    try:
        ensure_index_bootstrapped()
        result = await reindex_all(db)
        return {"status": "ok", "indexed": result.get("indexed", 0)}
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Reindex failed: {e}")
