from typing import List, Optional, Dict
from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete
from pydantic import BaseModel
import uuid

from ..database import get_db
from ..models import ContentNode, User, NodeLevel, UserProgress
from ..dependencies import get_current_active_user, require_permission, get_current_user_optional
from ..events.bus import bus
from ..events.events import PathCreated, PathUpdated, PathDeleted

router = APIRouter()


class PathCreate(BaseModel):
    title: str
    slug: str
    description: Optional[str] = None
    block_ids: List[str]
    metadata: Optional[dict] = None


class PathUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    block_ids: Optional[List[str]] = None
    metadata: Optional[dict] = None


class PathResponse(BaseModel):
    id: str
    title: str
    slug: str
    description: Optional[str] = None
    is_published: bool
    metadata: Optional[dict] = None
    created_at: str
    updated_at: str
    created_by_id: Optional[str] = None
    blocks: List[dict] = []
    mastered: bool = False
    mastered_at: Optional[str] = None

    class Config:
        from_attributes = True


@router.get("/paths", response_model=List[PathResponse])
async def get_paths(
    skip: int = 0,
    limit: int = 20,
    db: AsyncSession = Depends(get_db)
):
    """Get all published paths with pagination"""
    # Limit maximum results to prevent large dataset loading
    limit = min(limit, 50)
    result = await db.execute(
        select(ContentNode)
        .where(ContentNode.level == NodeLevel.PATH, ContentNode.is_published == True)
        .offset(skip)
        .limit(limit)
    )
    paths = result.scalars().all()

    # Helper to build ordered blocks list
    async def build_ordered_blocks(path_node: ContentNode) -> List[dict]:
        ordered: List[dict] = []
        order_ids: List[str] = []
        if path_node.metadata and isinstance(path_node.metadata, dict):
            order_ids = [str(i) for i in path_node.metadata.get("block_ids", [])]

        if order_ids:
            try:
                block_uuids = [uuid.UUID(bid) for bid in order_ids]
                result_blocks = await db.execute(
                    select(ContentNode).where(
                        ContentNode.id.in_(block_uuids),
                        ContentNode.level == NodeLevel.BLOCK,
                        ContentNode.is_published == True,
                    )
                )
                fetched = result_blocks.scalars().all()
                by_id: Dict[str, ContentNode] = {str(b.id): b for b in fetched}
                for bid in order_ids:
                    b = by_id.get(bid)
                    if b:
                        ordered.append({
                            "id": str(b.id),
                            "title": b.title,
                            "content": b.content,
                            "slug": b.slug,
                            "block_type": (b.metadata.get("block_type") if isinstance(b.metadata, dict) else "text"),
                            "is_published": b.is_published,
                            "is_locked": b.is_locked,
                            "created_at": b.created_at.isoformat(),
                            "updated_at": b.updated_at.isoformat(),
                            "created_by_id": str(b.created_by_id) if b.created_by_id else None,
                            "metadata": b.metadata,
                        })
                return ordered
            except Exception:
                # If anything goes wrong parsing order ids, fall back to relationship
                pass

        # Fallback: use parent-child relationship ordering (by created_at)
        result_children = await db.execute(
            select(ContentNode)
            .where(
                ContentNode.parent_id == path_node.id,
                ContentNode.level == NodeLevel.BLOCK,
                ContentNode.is_published == True,
            )
            .order_by(ContentNode.created_at.asc())
        )
        children = result_children.scalars().all()
        for b in children:
            ordered.append({
                "id": str(b.id),
                "title": b.title,
                "content": b.content,
                "slug": b.slug,
                "block_type": (b.metadata.get("block_type") if isinstance(b.metadata, dict) else "text"),
                "is_published": b.is_published,
                "is_locked": b.is_locked,
                "created_at": b.created_at.isoformat(),
                "updated_at": b.updated_at.isoformat(),
                "created_by_id": str(b.created_by_id) if b.created_by_id else None,
                "metadata": b.metadata,
            })
        return ordered

    # Convert to response format with blocks
    path_responses = []
    for path in paths:
        blocks = await build_ordered_blocks(path)

        path_responses.append(PathResponse(
            id=str(path.id),
            title=path.title,
            slug=path.slug,
            description=path.content,  # Using content as description for now
            is_published=path.is_published,
            metadata=path.metadata,
            created_at=path.created_at.isoformat(),
            updated_at=path.updated_at.isoformat(),
            created_by_id=str(path.created_by_id) if path.created_by_id else None,
            blocks=blocks
        ))

    return path_responses


@router.get("/paths/{slug}", response_model=PathResponse)
async def get_path(
    slug: str, 
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """Get a specific path by slug with optional progress status"""
    result = await db.execute(
        select(ContentNode).where(ContentNode.slug == slug, ContentNode.level == NodeLevel.PATH)
    )
    path = result.scalar_one_or_none()

    if not path:
        raise HTTPException(status_code=404, detail="Path not found")

    # Get user's progress for all content if authenticated
    user_progress_map = {}
    if current_user:
        progress_result = await db.execute(
            select(UserProgress).where(UserProgress.user_id == current_user.id)
        )
        for progress in progress_result.scalars().all():
            user_progress_map[str(progress.content_node_id)] = progress.mastered_at.isoformat()

    # Get blocks for this path (ordered by metadata.block_ids, fallback to relationship)
    async def build_ordered_blocks(path_node: ContentNode) -> List[dict]:
        ordered: List[dict] = []
        order_ids: List[str] = []
        if path_node.metadata and isinstance(path_node.metadata, dict):
            order_ids = [str(i) for i in path_node.metadata.get("block_ids", [])]
        if order_ids:
            try:
                block_uuids = [uuid.UUID(bid) for bid in order_ids]
                result_blocks = await db.execute(
                    select(ContentNode).where(
                        ContentNode.id.in_(block_uuids),
                        ContentNode.level == NodeLevel.BLOCK,
                        ContentNode.is_published == True,
                    )
                )
                fetched = result_blocks.scalars().all()
                by_id: Dict[str, ContentNode] = {str(b.id): b for b in fetched}
                for bid in order_ids:
                    b = by_id.get(bid)
                    if b:
                        block_id = str(b.id)
                        ordered.append({
                            "id": block_id,
                            "title": b.title,
                            "content": b.content,
                            "slug": b.slug,
                            "block_type": (b.metadata.get("block_type") if isinstance(b.metadata, dict) else "text"),
                            "is_published": b.is_published,
                            "is_locked": b.is_locked,
                            "created_at": b.created_at.isoformat(),
                            "updated_at": b.updated_at.isoformat(),
                            "created_by_id": str(b.created_by_id) if b.created_by_id else None,
                            "metadata": b.metadata,
                            "mastered": block_id in user_progress_map,
                            "mastered_at": user_progress_map.get(block_id)
                        })
                return ordered
            except Exception:
                pass
        # Fallback: use parent-child relationship ordering (by created_at)
        result_children = await db.execute(
            select(ContentNode)
            .where(
                ContentNode.parent_id == path_node.id,
                ContentNode.level == NodeLevel.BLOCK,
                ContentNode.is_published == True,
            )
            .order_by(ContentNode.created_at.asc())
        )
        children = result_children.scalars().all()
        for b in children:
            block_id = str(b.id)
            ordered.append({
                "id": block_id,
                "title": b.title,
                "content": b.content,
                "slug": b.slug,
                "block_type": (b.metadata.get("block_type") if isinstance(b.metadata, dict) else "text"),
                "is_published": b.is_published,
                "is_locked": b.is_locked,
                "created_at": b.created_at.isoformat(),
                "updated_at": b.updated_at.isoformat(),
                "created_by_id": str(b.created_by_id) if b.created_by_id else None,
                "metadata": b.metadata,
                "mastered": block_id in user_progress_map,
                "mastered_at": user_progress_map.get(block_id)
            })
        return ordered

    blocks = await build_ordered_blocks(path)
    
    # Check if path itself is mastered
    path_id = str(path.id)
    path_mastered = path_id in user_progress_map
    path_mastered_at = user_progress_map.get(path_id)

    return PathResponse(
        id=path_id,
        title=path.title,
        slug=path.slug,
        description=path.content,
        is_published=path.is_published,
        metadata=path.metadata,
        created_at=path.created_at.isoformat(),
        updated_at=path.updated_at.isoformat(),
        created_by_id=str(path.created_by_id) if path.created_by_id else None,
        blocks=blocks,
        mastered=path_mastered,
        mastered_at=path_mastered_at
    )


@router.post("/paths", response_model=PathResponse, status_code=201, dependencies=[])
async def create_path(
    path_data: PathCreate,
    db: AsyncSession = Depends(get_db)
):
    """Create a new path (public endpoint for testing - auth to be added later)"""
    # Check if slug already exists
    result = await db.execute(
        select(ContentNode).where(ContentNode.slug == path_data.slug)
    )
    existing_path = result.scalar_one_or_none()

    if existing_path:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Path slug already exists"
        )

    # Verify all block IDs exist
    if path_data.block_ids:
        block_uuids = [uuid.UUID(block_id) for block_id in path_data.block_ids]
        result = await db.execute(
            select(ContentNode).where(
                ContentNode.id.in_(block_uuids),
                ContentNode.level == NodeLevel.BLOCK
            )
        )
        existing_blocks = result.scalars().all()

        if len(existing_blocks) != len(block_uuids):
            found_ids = [str(block.id) for block in existing_blocks]
            missing_ids = set(path_data.block_ids) - set(found_ids)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Block IDs not found: {list(missing_ids)}"
            )

    # Create new path (without user for now - testing mode)
    path = ContentNode(
        title=path_data.title,
        content=path_data.description,
        slug=path_data.slug,
        level=NodeLevel.PATH,
        created_by_id=None,  # No auth for testing
        is_published=True,  # Auto-publish for testing
        metadata={**(path_data.metadata or {}), "block_ids": path_data.block_ids}
    )

    db.add(path)
    await db.commit()
    await db.refresh(path)

    # Publish event
    await bus.publish(PathCreated(path_id=path.id, slug=path.slug, title=path.title, created_by_id=None))

    # Get blocks for response (ordered)
    blocks: List[dict] = []
    order_ids = [str(i) for i in path_data.block_ids]
    if order_ids:
        result_blocks = await db.execute(
            select(ContentNode).where(
                ContentNode.id.in_([uuid.UUID(bid) for bid in order_ids]),
                ContentNode.level == NodeLevel.BLOCK,
                ContentNode.is_published == True,
            )
        )
        fetched = result_blocks.scalars().all()
        by_id: Dict[str, ContentNode] = {str(b.id): b for b in fetched}
        for bid in order_ids:
            b = by_id.get(bid)
            if b:
                blocks.append({
                    "id": str(b.id),
                    "title": b.title,
                    "content": b.content,
                    "slug": b.slug,
                    "block_type": (b.metadata.get("block_type") if isinstance(b.metadata, dict) else "text"),
                    "is_published": b.is_published,
                    "is_locked": b.is_locked,
                    "created_at": b.created_at.isoformat(),
                    "updated_at": b.updated_at.isoformat(),
                    "created_by_id": str(b.created_by_id) if b.created_by_id else None,
                    "metadata": b.metadata,
                })

    return PathResponse(
        id=str(path.id),
        title=path.title,
        slug=path.slug,
        description=path.content,
        is_published=path.is_published,
        metadata=path.metadata,
        created_at=path.created_at.isoformat(),
        updated_at=path.updated_at.isoformat(),
        created_by_id=str(path.created_by_id),
        blocks=blocks
    )


@router.put("/paths/{path_id}", response_model=PathResponse)
async def update_path(
    path_id: str,
    path_data: PathUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Update a path"""
    try:
        path_uuid = uuid.UUID(path_id)
        result = await db.execute(
            select(ContentNode).where(ContentNode.id == path_uuid, ContentNode.level == NodeLevel.PATH)
        )
        path = result.scalar_one_or_none()

        if not path:
            raise HTTPException(status_code=404, detail="Path not found")

        # Check permissions
        if current_user.role.value == "admin":
            pass  # Admin can edit any path
        elif path.created_by_id == current_user.id:
            # Check if user has permission to edit own paths
            from ..rbac import rbac_manager
            if not rbac_manager.check_permission(db, current_user, "edit_own_paths"):
                raise HTTPException(status_code=403, detail="Cannot edit own paths")
        else:
            # Check if user has permission to edit others' paths
            from ..rbac import rbac_manager
            if not rbac_manager.check_permission(db, current_user, "edit_others_paths"):
                raise HTTPException(status_code=403, detail="Cannot edit others' paths")

        # Update path fields
        update_data = path_data.dict(exclude_unset=True)
        if "description" in update_data:
            update_data["content"] = update_data.pop("description")

        for field, value in update_data.items():
            if field != "block_ids":
                setattr(path, field, value)

        # Handle block_ids ordering in metadata
        if "block_ids" in update_data and update_data["block_ids"] is not None:
            # Ensure metadata exists
            if not path.meta_json or not isinstance(path.meta_json, dict):
                path.meta_json = {}
            path.meta_json["block_ids"] = update_data["block_ids"]

        await db.commit()
        await db.refresh(path)

        # Get blocks for response (ordered by metadata, fallback to relationship)
        blocks: List[dict] = []
        order_ids: List[str] = []
        if path.metadata and isinstance(path.metadata, dict):
            order_ids = [str(i) for i in path.metadata.get("block_ids", [])]
        if order_ids:
            try:
                block_uuids = [uuid.UUID(bid) for bid in order_ids]
                result_blocks = await db.execute(
                    select(ContentNode).where(
                        ContentNode.id.in_(block_uuids),
                        ContentNode.level == NodeLevel.BLOCK,
                        ContentNode.is_published == True,
                    )
                )
                fetched = result_blocks.scalars().all()
                by_id: Dict[str, ContentNode] = {str(b.id): b for b in fetched}
                for bid in order_ids:
                    b = by_id.get(bid)
                    if b:
                        blocks.append({
                            "id": str(b.id),
                            "title": b.title,
                            "content": b.content,
                            "slug": b.slug,
                            "block_type": (b.metadata.get("block_type") if isinstance(b.metadata, dict) else "text"),
                            "is_published": b.is_published,
                            "is_locked": b.is_locked,
                            "created_at": b.created_at.isoformat(),
                            "updated_at": b.updated_at.isoformat(),
                            "created_by_id": str(b.created_by_id) if b.created_by_id else None,
                            "metadata": b.metadata,
                        })
            except Exception:
                blocks = []
        if not blocks:
            result_children = await db.execute(
                select(ContentNode)
                .where(
                    ContentNode.parent_id == path.id,
                    ContentNode.level == NodeLevel.BLOCK,
                    ContentNode.is_published == True,
                )
                .order_by(ContentNode.created_at.asc())
            )
            children = result_children.scalars().all()
            for b in children:
                blocks.append({
                    "id": str(b.id),
                    "title": b.title,
                    "content": b.content,
                    "slug": b.slug,
                    "block_type": (b.metadata.get("block_type") if isinstance(b.metadata, dict) else "text"),
                    "is_published": b.is_published,
                    "is_locked": b.is_locked,
                    "created_at": b.created_at.isoformat(),
                    "updated_at": b.updated_at.isoformat(),
                    "created_by_id": str(b.created_by_id) if b.created_by_id else None,
                    "metadata": b.metadata,
                })

        # Publish event
        await bus.publish(PathUpdated(path_id=path.id, slug=path.slug, title=path.title, updated_by_id=current_user.id))

        return PathResponse(
            id=str(path.id),
            title=path.title,
            slug=path.slug,
            description=path.content,
            is_published=path.is_published,
            metadata=path.metadata,
            created_at=path.created_at.isoformat(),
            updated_at=path.updated_at.isoformat(),
            created_by_id=str(path.created_by_id) if path.created_by_id else None,
            blocks=blocks
        )
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid path ID format")


@router.delete("/paths/{path_id}")
async def delete_path(
    path_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a path"""
    try:
        path_uuid = uuid.UUID(path_id)
        result = await db.execute(
            select(ContentNode).where(ContentNode.id == path_uuid, ContentNode.level == NodeLevel.PATH)
        )
        path = result.scalar_one_or_none()

        if not path:
            raise HTTPException(status_code=404, detail="Path not found")

        # Check permissions
        if current_user.role.value == "admin":
            pass  # Admin can delete any path
        elif path.created_by_id == current_user.id:
            # Check if user has permission to delete own paths
            from ..rbac import rbac_manager
            if not rbac_manager.check_permission(db, current_user, "delete_own_paths"):
                raise HTTPException(status_code=403, detail="Cannot delete own paths")
        else:
            # Check if user has permission to delete others' paths
            from ..rbac import rbac_manager
            if not rbac_manager.check_permission(db, current_user, "delete_any_paths"):
                raise HTTPException(status_code=403, detail="Cannot delete others' paths")

        await db.delete(path)
        await db.commit()

        # Publish event
        await bus.publish(PathDeleted(path_id=path.id, slug=path.slug, deleted_by_id=current_user.id))

        return {"message": "Path deleted successfully"}
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid path ID format")
