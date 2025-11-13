"""
Progress tracking router for user mastery/checkpoint features.
"""
from typing import List
from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from pydantic import BaseModel
import uuid

from ..database import get_db
from ..models import User, UserProgress, ContentNode, NodeLevel
from ..dependencies import get_current_active_user

router = APIRouter()


class ProgressResponse(BaseModel):
    id: str
    content_node_id: str
    mastered_at: str
    metadata: dict | None = None

    class Config:
        from_attributes = True


@router.post("/blocks/{block_id}/master", status_code=201)
async def mark_block_mastered(
    block_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Mark a block as mastered/understood by the current user"""
    try:
        block_uuid = uuid.UUID(block_id)
        
        # Check if block exists
        result = await db.execute(
            select(ContentNode).where(
                ContentNode.id == block_uuid,
                ContentNode.level == NodeLevel.BLOCK
            )
        )
        block = result.scalar_one_or_none()
        
        if not block:
            raise HTTPException(status_code=404, detail="Block not found")
        
        # Check if already mastered
        result = await db.execute(
            select(UserProgress).where(
                UserProgress.user_id == current_user.id,
                UserProgress.content_node_id == block_uuid
            )
        )
        existing = result.scalar_one_or_none()
        
        if existing:
            return {
                "message": "Block already mastered",
                "mastered_at": existing.mastered_at.isoformat()
            }
        
        # Create progress record
        progress = UserProgress(
            user_id=current_user.id,
            content_node_id=block_uuid
        )
        db.add(progress)
        await db.commit()
        await db.refresh(progress)
        
        return {
            "message": "Block marked as mastered",
            "mastered_at": progress.mastered_at.isoformat()
        }
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid block ID format")
    except Exception as e:
        print(f"Error marking block as mastered: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/blocks/{block_id}/master", status_code=200)
async def unmark_block_mastered(
    block_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Remove mastery status from a block"""
    try:
        block_uuid = uuid.UUID(block_id)
        
        # Delete progress record
        result = await db.execute(
            delete(UserProgress).where(
                UserProgress.user_id == current_user.id,
                UserProgress.content_node_id == block_uuid
            )
        )
        await db.commit()
        
        if result.rowcount == 0:
            raise HTTPException(status_code=404, detail="Block was not marked as mastered")
        
        return {"message": "Block mastery status removed"}
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid block ID format")
    except Exception as e:
        print(f"Error unmarking block: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/paths/{path_id}/master", status_code=201)
async def mark_path_mastered(
    path_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Mark a path and all its blocks as mastered"""
    try:
        path_uuid = uuid.UUID(path_id)
        
        # Check if path exists and get its blocks
        result = await db.execute(
            select(ContentNode).where(
                ContentNode.id == path_uuid,
                ContentNode.level == NodeLevel.PATH
            )
        )
        path = result.scalar_one_or_none()
        
        if not path:
            raise HTTPException(status_code=404, detail="Path not found")
        
        # Get all blocks in this path
        blocks_result = await db.execute(
            select(ContentNode).where(
                ContentNode.parent_id == path_uuid,
                ContentNode.level == NodeLevel.BLOCK
            )
        )
        blocks = blocks_result.scalars().all()
        
        # Mark the path itself
        path_progress = await db.execute(
            select(UserProgress).where(
                UserProgress.user_id == current_user.id,
                UserProgress.content_node_id == path_uuid
            )
        )
        if not path_progress.scalar_one_or_none():
            progress = UserProgress(
                user_id=current_user.id,
                content_node_id=path_uuid
            )
            db.add(progress)
        
        # Mark all blocks in the path
        mastered_count = 0
        for block in blocks:
            block_progress = await db.execute(
                select(UserProgress).where(
                    UserProgress.user_id == current_user.id,
                    UserProgress.content_node_id == block.id
                )
            )
            if not block_progress.scalar_one_or_none():
                progress = UserProgress(
                    user_id=current_user.id,
                    content_node_id=block.id
                )
                db.add(progress)
                mastered_count += 1
        
        await db.commit()
        
        return {
            "message": f"Path and {mastered_count} blocks marked as mastered",
            "total_blocks": len(blocks),
            "newly_mastered": mastered_count
        }
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid path ID format")
    except Exception as e:
        print(f"Error marking path as mastered: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/users/me/progress", response_model=List[ProgressResponse])
async def get_user_progress(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all mastered items for the current user"""
    result = await db.execute(
        select(UserProgress).where(UserProgress.user_id == current_user.id)
    )
    progress_items = result.scalars().all()
    
    return [
        ProgressResponse(
            id=str(p.id),
            content_node_id=str(p.content_node_id),
            mastered_at=p.mastered_at.isoformat(),
            metadata=p.metadata
        )
        for p in progress_items
    ]


@router.get("/blocks/{block_id}/progress", status_code=200)
async def check_block_progress(
    block_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Check if current user has mastered this block"""
    try:
        block_uuid = uuid.UUID(block_id)
        
        result = await db.execute(
            select(UserProgress).where(
                UserProgress.user_id == current_user.id,
                UserProgress.content_node_id == block_uuid
            )
        )
        progress = result.scalar_one_or_none()
        
        if progress:
            return {
                "mastered": True,
                "mastered_at": progress.mastered_at.isoformat()
            }
        else:
            return {"mastered": False}
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid block ID format")
