from typing import List, Optional
from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete
from pydantic import BaseModel
import uuid

from ..database import get_db
from ..models import ContentNode, User, Revision, EditSuggestion, NodeLevel, EditSuggestionStatus
from ..dependencies import get_current_active_user, require_permission
from ..events.bus import bus
from ..events.events import BlockCreated, BlockUpdated, BlockDeleted
from ..content_serializer import ContentSerializer

router = APIRouter()


class RevisionResponse(BaseModel):
    id: str
    title: str
    content: Optional[str] = None
    change_summary: Optional[str] = None
    created_at: str
    created_by_id: Optional[str] = None

    class Config:
        from_attributes = True


class BlockCreate(BaseModel):
    title: str
    content: Optional[str] = None
    slug: str
    block_type: str = "text"
    metadata: Optional[dict] = None


class BlockUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    metadata: Optional[dict] = None


class BlockResponse(BaseModel):
    id: str
    title: str
    content: Optional[str] = None
    slug: str
    block_type: str
    is_published: bool
    is_locked: bool
    metadata: Optional[dict] = None
    created_at: str
    updated_at: str
    created_by_id: Optional[str] = None
    
    # Enhanced BlockNote fields
    blocknote_blocks: Optional[list] = None
    plain_text: Optional[str] = None
    html_content: Optional[str] = None
    is_blocknote_format: bool = False

    class Config:
        from_attributes = True
    
    @classmethod
    def from_content_node(cls, node: ContentNode) -> 'BlockResponse':
        """Create BlockResponse from ContentNode with BlockNote integration"""
        response = cls(
            id=str(node.id),
            title=node.title,
            content=node.content,
            slug=node.slug,
            block_type=node.metadata.get("block_type", "text") if node.metadata else "text",
            is_published=node.is_published,
            is_locked=node.is_locked,
            metadata=node.metadata,
            created_at=node.created_at.isoformat(),
            updated_at=node.updated_at.isoformat(),
            created_by_id=str(node.created_by_id) if node.created_by_id else None
        )
        
        # Add BlockNote metadata if content exists
        if node.content:
            try:
                # Check if content is in BlockNote format
                if ContentSerializer.is_blocknote_content(node.content):
                    response.is_blocknote_format = True
                    response.blocknote_blocks = node.get_blocknote_blocks()
                    response.plain_text = node.get_plain_text()
                    response.html_content = node.to_html()
                else:
                    # Legacy content
                    response.is_blocknote_format = False
                    response.plain_text = node.content
                    response.html_content = f"<p>{node.content}</p>"
            except Exception:
                # Fallback for any serialization issues
                response.plain_text = node.content or ""
                response.html_content = f"<p>{node.content or 'No content available'}</p>"
        
        return response


class SuggestionCreate(BaseModel):
    title: str
    content: Optional[str] = None
    change_summary: str


class SuggestionResponse(BaseModel):
    id: str
    block_id: str
    title: str
    content: Optional[str] = None
    change_summary: str
    status: str
    created_at: str
    updated_at: str
    created_by_id: Optional[str] = None

    class Config:
        from_attributes = True


@router.get("/blocks", response_model=List[BlockResponse])
async def get_blocks(
    skip: int = 0,
    limit: int = 20,
    db: AsyncSession = Depends(get_db)
):
    """Get all published blocks with pagination"""
    # Limit maximum results to prevent large dataset loading
    limit = min(limit, 50)
    
    result = await db.execute(
        select(ContentNode)
        .where(ContentNode.level == NodeLevel.BLOCK, ContentNode.is_published == True)
        .offset(skip)
        .limit(limit)
    )
    nodes = result.scalars().all()
    return [BlockResponse.from_content_node(node) for node in nodes]


@router.get("/blocks/{slug}", response_model=BlockResponse)
async def get_block(slug: str, db: AsyncSession = Depends(get_db)):
    """Get a specific block by slug"""
    result = await db.execute(
        select(ContentNode).where(ContentNode.slug == slug, ContentNode.level == NodeLevel.BLOCK)
    )
    block = result.scalar_one_or_none()

    if not block:
        raise HTTPException(status_code=404, detail="Block not found")

    return BlockResponse.from_content_node(block)


@router.post("/blocks", response_model=BlockResponse, status_code=201, dependencies=[])
async def create_block(
    block_data: BlockCreate,
    db: AsyncSession = Depends(get_db)
):
    """Create a new block (public endpoint for testing - auth to be added later)"""
    # Check if slug already exists
    result = await db.execute(
        select(ContentNode).where(ContentNode.slug == block_data.slug)
    )
    existing_block = result.scalar_one_or_none()

    if existing_block:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Block slug already exists"
        )

    # Create new block (without user for now - testing mode)
    block = ContentNode(
        title=block_data.title,
        content=block_data.content,
        slug=block_data.slug,
        level=NodeLevel.BLOCK,
        created_by_id=None,  # No auth for testing
        metadata=block_data.metadata,
        is_published=True  # Auto-publish for testing
    )
    
    # If content is provided as BlockNote blocks, serialize it
    if block_data.content and isinstance(block_data.content, list):
        block.set_blocknote_content(block_data.content)
    
    # Validate BlockNote content if present (simplified for now)
    if block.content and ContentSerializer.is_blocknote_content(str(block.content)):
        try:
            # Just verify it's parseable
            blocknote_content = block.get_blocknote_content()
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid BlockNote format: {str(e)}")

    db.add(block)
    await db.commit()
    await db.refresh(block)

    return BlockResponse.from_content_node(block)


@router.put("/blocks/{block_id}", response_model=BlockResponse)
async def update_block(
    block_id: str,
    block_data: BlockUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Update a block"""
    try:
        block_uuid = uuid.UUID(block_id)
        result = await db.execute(
            select(ContentNode).where(ContentNode.id == block_uuid, ContentNode.level == NodeLevel.BLOCK)
        )
        block = result.scalar_one_or_none()

        if not block:
            raise HTTPException(status_code=404, detail="Block not found")

        # Check permissions
        if current_user.role.value == "admin":
            pass  # Admin can edit any block
        elif block.created_by_id == current_user.id:
            # Check if user has permission to edit own blocks
            from ..rbac import rbac_manager
            if not rbac_manager.check_permission(db, current_user, "edit_own_blocks"):
                raise HTTPException(status_code=403, detail="Cannot edit own blocks")
        else:
            # Check if user has permission to edit others' blocks
            from ..rbac import rbac_manager
            if not rbac_manager.check_permission(db, current_user, "edit_others_blocks"):
                raise HTTPException(status_code=403, detail="Cannot edit others' blocks")

        # Update block fields
        update_data = block_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(block, field, value)

        await db.commit()
        await db.refresh(block)

        # Publish event
        await bus.publish(BlockUpdated(block_id=block.id, slug=block.slug, title=block.title, updated_by_id=current_user.id))
        return BlockResponse.from_content_node(block)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid block ID format")


@router.delete("/blocks/{block_id}")
async def delete_block(
    block_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a block"""
    try:
        block_uuid = uuid.UUID(block_id)
        result = await db.execute(
            select(ContentNode).where(ContentNode.id == block_uuid, ContentNode.level == NodeLevel.BLOCK)
        )
        block = result.scalar_one_or_none()

        if not block:
            raise HTTPException(status_code=404, detail="Block not found")

        # Check permissions
        if current_user.role.value == "admin":
            pass  # Admin can delete any block
        elif block.created_by_id == current_user.id:
            # Check if user has permission to delete own blocks
            from ..rbac import rbac_manager
            if not rbac_manager.check_permission(db, current_user, "delete_own_blocks"):
                raise HTTPException(status_code=403, detail="Cannot delete own blocks")
        else:
            # Check if user has permission to delete others' blocks
            from ..rbac import rbac_manager
            if not rbac_manager.check_permission(db, current_user, "delete_any_blocks"):
                raise HTTPException(status_code=403, detail="Cannot delete others' blocks")

        await db.delete(block)
        await db.commit()

        # Publish event
        await bus.publish(BlockDeleted(block_id=block.id, slug=block.slug, deleted_by_id=current_user.id))
        return {"message": "Block deleted successfully"}
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid block ID format")


@router.get("/blocks/{block_id}/revisions", response_model=List[RevisionResponse])
async def get_block_revisions(
    block_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Get revision history for a block"""
    try:
        block_uuid = uuid.UUID(block_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid block ID format")

    # Verify block exists
    result = await db.execute(
        select(ContentNode).where(ContentNode.id == block_uuid)
    )
    block = result.scalar_one_or_none()
    if not block:
        raise HTTPException(status_code=404, detail="Block not found")

    # Get revisions ordered by date (newest first)
    result = await db.execute(
        select(Revision)
        .where(Revision.content_node_id == block_uuid)
        .order_by(Revision.created_at.desc())
    )
    revisions = result.scalars().all()

    return [
        RevisionResponse(
            id=str(rev.id),
            title=rev.title,
            content=rev.content,
            change_summary=rev.change_summary,
            created_at=rev.created_at.isoformat(),
            created_by_id=str(rev.created_by_id) if rev.created_by_id else None
        )
        for rev in revisions
    ]


@router.post("/blocks/{block_id}/suggestions", response_model=SuggestionResponse, status_code=201)
async def create_suggestion(
    block_id: str,
    suggestion_data: SuggestionCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a suggestion for a block"""
    try:
        # Validate user
        if not current_user or not current_user.id:
            raise HTTPException(status_code=401, detail="User not authenticated")
        
        block_uuid = uuid.UUID(block_id)
        # Check if block exists
        result = await db.execute(
            select(ContentNode).where(ContentNode.id == block_uuid, ContentNode.level == NodeLevel.BLOCK)
        )
        block = result.scalar_one_or_none()

        if not block:
            raise HTTPException(status_code=404, detail="Block not found")

        # Check permissions
        from ..rbac import rbac_manager
        if not rbac_manager.check_permission(db, current_user, "create_suggestions"):
            raise HTTPException(status_code=403, detail="Cannot create suggestions")

        # Create suggestion
        suggestion = EditSuggestion(
            content_node_id=block_uuid,
            title=suggestion_data.title,
            content=suggestion_data.content,
            change_summary=suggestion_data.change_summary,
            created_by_id=current_user.id
        )

        db.add(suggestion)
        await db.commit()
        await db.refresh(suggestion)

        return suggestion
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail="Invalid block ID format")
    except Exception as e:
        import traceback
        print(f"Error creating suggestion: {e}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Failed to create suggestion: {str(e)}")


@router.get("/blocks/{block_id}/suggestions", response_model=List[SuggestionResponse])
async def get_block_suggestions(
    block_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all suggestions for a block"""
    try:
        block_uuid = uuid.UUID(block_id)
        # Check if block exists
        result = await db.execute(
            select(ContentNode).where(ContentNode.id == block_uuid, ContentNode.level == NodeLevel.BLOCK)
        )
        block = result.scalar_one_or_none()

        if not block:
            raise HTTPException(status_code=404, detail="Block not found")

        result = await db.execute(
            select(EditSuggestion).where(EditSuggestion.content_node_id == block_uuid)
        )
        suggestions = result.scalars().all()

        return suggestions
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid block ID format")
