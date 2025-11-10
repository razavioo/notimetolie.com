from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime
import uuid

from ..database import get_db
from ..models import (
    ContentNode,
    EditSuggestion,
    EditSuggestionStatus,
    Revision,
    User,
)
from ..dependencies import get_current_active_user, require_permission
from ..config import settings
from ..events.bus import bus
from ..events.events import SuggestionApproved, SuggestionRejected


router = APIRouter(prefix="/moderation")


def _serialize_suggestion(s: EditSuggestion) -> dict:
    return {
        "id": str(s.id),
        "block_id": str(s.content_node_id),
        "title": s.title,
        "content": s.content,
        "change_summary": s.change_summary,
        "status": s.status.value if hasattr(s.status, "value") else str(s.status),
        "created_at": s.created_at.isoformat() if s.created_at else None,
        "updated_at": s.updated_at.isoformat() if s.updated_at else None,
        "created_by_id": str(s.created_by_id) if s.created_by_id else None,
    }


@router.get("/suggestions")
async def list_suggestions(
    status: Optional[str] = "pending",
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("review_suggestions")),
):
    query = select(EditSuggestion)
    if status:
        try:
            status_enum = EditSuggestionStatus(status)
            query = query.where(EditSuggestion.status == status_enum)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid status filter")

    result = await db.execute(query.offset(skip).limit(limit))
    suggestions: List[EditSuggestion] = result.scalars().all()
    return [_serialize_suggestion(s) for s in suggestions]


async def _recompute_level(user: User) -> None:
    total_xp = int(user.xp or 0)
    # Level 1 is default; levels increase when surpassing thresholds
    new_level = 1
    for i, req in enumerate(settings.levels_xp_requirements, start=1):
        if total_xp >= req:
            new_level = i + 1
        else:
            break
    user.level = new_level


@router.post("/suggestions/{suggestion_id}/approve")
async def approve_suggestion(
    suggestion_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("review_suggestions")),
):
    try:
        sug_uuid = uuid.UUID(suggestion_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid suggestion ID format")

    result = await db.execute(select(EditSuggestion).where(EditSuggestion.id == sug_uuid))
    suggestion = result.scalar_one_or_none()
    if not suggestion:
        raise HTTPException(status_code=404, detail="Suggestion not found")
    if suggestion.status != EditSuggestionStatus.PENDING:
        raise HTTPException(status_code=400, detail="Only pending suggestions can be approved")

    # Load the target block
    result = await db.execute(select(ContentNode).where(ContentNode.id == suggestion.content_node_id))
    block = result.scalar_one_or_none()
    if not block:
        raise HTTPException(status_code=404, detail="Target block not found")

    # Apply suggestion: create a revision and update the block
    revision = Revision(
        content_node_id=block.id,
        title=suggestion.title,
        content=suggestion.content,
        change_summary=suggestion.change_summary,
        created_by_id=current_user.id,
    )
    db.add(revision)

    block.title = suggestion.title
    block.content = suggestion.content

    # Update suggestion status
    suggestion.status = EditSuggestionStatus.APPROVED
    suggestion.reviewed_by_id = current_user.id
    suggestion.reviewed_at = datetime.utcnow()

    # Award XP to the suggestion creator, if known
    if suggestion.created_by_id:
        result = await db.execute(select(User).where(User.id == suggestion.created_by_id))
        author = result.scalar_one_or_none()
        if author:
            author.xp = int(author.xp or 0) + int(settings.xp_per_suggestion_approved)
            await _recompute_level(author)

    await db.commit()

    # Publish event
    await bus.publish(
        SuggestionApproved(
            suggestion_id=suggestion.id,
            block_id=suggestion.content_node_id,
            title=suggestion.title,
            approved_by_id=current_user.id,
            created_by_id=suggestion.created_by_id,
        )
    )

    return _serialize_suggestion(suggestion)


@router.post("/suggestions/{suggestion_id}/reject")
async def reject_suggestion(
    suggestion_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("review_suggestions")),
):
    try:
        sug_uuid = uuid.UUID(suggestion_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid suggestion ID format")

    result = await db.execute(select(EditSuggestion).where(EditSuggestion.id == sug_uuid))
    suggestion = result.scalar_one_or_none()
    if not suggestion:
        raise HTTPException(status_code=404, detail="Suggestion not found")
    if suggestion.status != EditSuggestionStatus.PENDING:
        raise HTTPException(status_code=400, detail="Only pending suggestions can be rejected")

    suggestion.status = EditSuggestionStatus.REJECTED
    suggestion.reviewed_by_id = current_user.id
    suggestion.reviewed_at = datetime.utcnow()

    await db.commit()

    await bus.publish(
        SuggestionRejected(
            suggestion_id=suggestion.id,
            block_id=suggestion.content_node_id,
            title=suggestion.title,
            rejected_by_id=current_user.id,
            created_by_id=suggestion.created_by_id,
        )
    )

    return _serialize_suggestion(suggestion)
