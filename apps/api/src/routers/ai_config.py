"""
AI Configuration router for managing AI agents and jobs.
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel, Field
from datetime import datetime
import uuid

from src.dependencies import get_db, get_current_user
from src.models.ai_config import (
    AIConfiguration,
    AIJob,
    AIBlockSuggestion,
    AIProvider,
    AIAgentType,
    AIJobStatus,
)
from src.models.users import User
from src.permissions import require_permission
from src.utils.encryption import encrypt_api_key, decrypt_api_key

router = APIRouter(prefix="/v1/ai", tags=["AI Configuration"])


# Pydantic schemas
class AIConfigCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    provider: AIProvider
    agent_type: AIAgentType
    model_name: str = "gpt-4"
    api_key: Optional[str] = None  # Will be encrypted
    api_endpoint: Optional[str] = None
    temperature: float = Field(default=0.7, ge=0.0, le=2.0)
    max_tokens: int = Field(default=2000, ge=1, le=100000)
    system_prompt: Optional[str] = None
    mcp_enabled: bool = True
    mcp_server_url: Optional[str] = None
    can_create_blocks: bool = True
    can_edit_blocks: bool = False
    can_search_web: bool = True
    daily_request_limit: int = 50


class AIConfigPublic(BaseModel):
    id: str
    name: str
    description: Optional[str]
    provider: AIProvider
    agent_type: AIAgentType
    model_name: str
    temperature: float
    max_tokens: int
    mcp_enabled: bool
    is_active: bool
    created_at: str
    
    class Config:
        from_attributes = True


class AIJobCreate(BaseModel):
    configuration_id: str
    job_type: AIAgentType
    input_prompt: str
    input_metadata: Optional[dict] = None


class AIJobPublic(BaseModel):
    id: str
    configuration_id: str
    job_type: AIAgentType
    status: AIJobStatus
    input_prompt: str
    output_data: Optional[dict]
    suggested_blocks: Optional[list]
    started_at: Optional[str]
    completed_at: Optional[str]
    error_message: Optional[str]
    created_at: str
    
    class Config:
        from_attributes = True


class AIBlockSuggestionPublic(BaseModel):
    id: str
    ai_job_id: str
    title: str
    slug: str
    content: str
    block_type: str
    language: Optional[str]
    tags: Optional[list]
    source_urls: Optional[list]
    confidence_score: float
    ai_rationale: Optional[str]
    status: str
    created_at: str
    
    class Config:
        from_attributes = True


@router.post("/configurations", response_model=AIConfigPublic, status_code=status.HTTP_201_CREATED)
async def create_ai_configuration(
    config_data: AIConfigCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("use_ai_agents")),
):
    """Create a new AI agent configuration."""
    now = datetime.utcnow().isoformat()
    
    # Encrypt API key if provided
    encrypted_key = None
    if config_data.api_key:
        encrypted_key = encrypt_api_key(config_data.api_key)
    
    config = AIConfiguration(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        name=config_data.name,
        description=config_data.description,
        provider=config_data.provider,
        agent_type=config_data.agent_type,
        api_key_encrypted=encrypted_key,
        model_name=config_data.model_name,
        api_endpoint=config_data.api_endpoint,
        temperature={"value": config_data.temperature},
        max_tokens={"value": config_data.max_tokens},
        system_prompt=config_data.system_prompt,
        mcp_enabled=config_data.mcp_enabled,
        mcp_server_url=config_data.mcp_server_url,
        can_create_blocks=config_data.can_create_blocks,
        can_edit_blocks=config_data.can_edit_blocks,
        can_search_web=config_data.can_search_web,
        daily_request_limit={"value": config_data.daily_request_limit},
        is_active=True,
        created_at={"iso": now},
        updated_at={"iso": now},
    )
    
    db.add(config)
    await db.commit()
    await db.refresh(config)
    
    return AIConfigPublic(
        id=config.id,
        name=config.name,
        description=config.description,
        provider=config.provider,
        agent_type=config.agent_type,
        model_name=config.model_name,
        temperature=config.temperature.get("value", 0.7),
        max_tokens=config.max_tokens.get("value", 2000),
        mcp_enabled=config.mcp_enabled,
        is_active=config.is_active,
        created_at=config.created_at.get("iso"),
    )


@router.get("/configurations", response_model=List[AIConfigPublic])
async def list_ai_configurations(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("use_ai_agents")),
):
    """List all AI configurations for the current user."""
    result = await db.execute(
        select(AIConfiguration)
        .filter(AIConfiguration.user_id == current_user.id)
        .filter(AIConfiguration.is_active == True)
    )
    configs = result.scalars().all()
    
    return [
        AIConfigPublic(
            id=c.id,
            name=c.name,
            description=c.description,
            provider=c.provider,
            agent_type=c.agent_type,
            model_name=c.model_name,
            temperature=c.temperature.get("value", 0.7),
            max_tokens=c.max_tokens.get("value", 2000),
            mcp_enabled=c.mcp_enabled,
            is_active=c.is_active,
            created_at=c.created_at.get("iso"),
        )
        for c in configs
    ]


@router.post("/jobs", response_model=AIJobPublic, status_code=status.HTTP_202_ACCEPTED)
async def create_ai_job(
    job_data: AIJobCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("use_ai_agents")),
):
    """Create a new AI job (starts async processing)."""
    # Verify configuration belongs to user
    config_result = await db.execute(
        select(AIConfiguration)
        .filter(AIConfiguration.id == job_data.configuration_id)
        .filter(AIConfiguration.user_id == current_user.id)
    )
    config = config_result.scalar_one_or_none()
    
    if not config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="AI configuration not found"
        )
    
    now = datetime.utcnow().isoformat()
    
    job = AIJob(
        id=str(uuid.uuid4()),
        configuration_id=config.id,
        user_id=current_user.id,
        job_type=job_data.job_type,
        status=AIJobStatus.PENDING,
        input_prompt=job_data.input_prompt,
        input_metadata=job_data.input_metadata or {},
        created_at={"iso": now},
        updated_at={"iso": now},
    )
    
    db.add(job)
    await db.commit()
    await db.refresh(job)
    
    # TODO: Start background processing
    # background_tasks.add_task(process_ai_job, job.id, config.id)
    
    return AIJobPublic(
        id=job.id,
        configuration_id=job.configuration_id,
        job_type=job.job_type,
        status=job.status,
        input_prompt=job.input_prompt,
        output_data=job.output_data,
        suggested_blocks=job.suggested_blocks,
        started_at=job.started_at.get("iso") if job.started_at else None,
        completed_at=job.completed_at.get("iso") if job.completed_at else None,
        error_message=job.error_message,
        created_at=job.created_at.get("iso"),
    )


@router.get("/jobs/{job_id}", response_model=AIJobPublic)
async def get_ai_job(
    job_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("use_ai_agents")),
):
    """Get AI job status and results."""
    result = await db.execute(
        select(AIJob)
        .filter(AIJob.id == job_id)
        .filter(AIJob.user_id == current_user.id)
    )
    job = result.scalar_one_or_none()
    
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="AI job not found"
        )
    
    return AIJobPublic(
        id=job.id,
        configuration_id=job.configuration_id,
        job_type=job.job_type,
        status=job.status,
        input_prompt=job.input_prompt,
        output_data=job.output_data,
        suggested_blocks=job.suggested_blocks,
        started_at=job.started_at.get("iso") if job.started_at else None,
        completed_at=job.completed_at.get("iso") if job.completed_at else None,
        error_message=job.error_message,
        created_at=job.created_at.get("iso"),
    )


@router.post("/jobs/{job_id}/cancel", status_code=status.HTTP_200_OK)
async def cancel_ai_job(
    job_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("use_ai_agents")),
):
    """Cancel a running AI job."""
    result = await db.execute(
        select(AIJob)
        .filter(AIJob.id == job_id)
        .filter(AIJob.user_id == current_user.id)
    )
    job = result.scalar_one_or_none()
    
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="AI job not found"
        )
    
    if job.status in [AIJobStatus.COMPLETED, AIJobStatus.FAILED, AIJobStatus.CANCELLED]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot cancel job in {job.status} status"
        )
    
    job.status = AIJobStatus.CANCELLED
    job.updated_at = {"iso": datetime.utcnow().isoformat()}
    
    await db.commit()
    
    return {"message": "Job cancelled successfully"}


@router.get("/jobs/{job_id}/suggestions", response_model=List[AIBlockSuggestionPublic])
async def list_job_suggestions(
    job_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("use_ai_agents")),
):
    """List all block suggestions for an AI job."""
    result = await db.execute(
        select(AIBlockSuggestion)
        .filter(AIBlockSuggestion.ai_job_id == job_id)
        .filter(AIBlockSuggestion.user_id == current_user.id)
    )
    suggestions = result.scalars().all()
    
    return [
        AIBlockSuggestionPublic(
            id=s.id,
            ai_job_id=s.ai_job_id,
            title=s.title,
            slug=s.slug,
            content=s.content,
            block_type=s.block_type,
            language=s.language,
            tags=s.tags,
            source_urls=s.source_urls,
            confidence_score=s.confidence_score.get("value", 0.0),
            ai_rationale=s.ai_rationale,
            status=s.status,
            created_at=s.created_at.get("iso"),
        )
        for s in suggestions
    ]


@router.post("/suggestions/{suggestion_id}/approve", status_code=status.HTTP_200_OK)
async def approve_ai_suggestion(
    suggestion_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("create_blocks")),
):
    """Approve an AI-generated block suggestion and create the block."""
    result = await db.execute(
        select(AIBlockSuggestion)
        .filter(AIBlockSuggestion.id == suggestion_id)
        .filter(AIBlockSuggestion.user_id == current_user.id)
    )
    suggestion = result.scalar_one_or_none()
    
    if not suggestion:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Suggestion not found"
        )
    
    if suggestion.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Suggestion already processed"
        )
    
    # TODO: Create actual block from suggestion
    # block = await create_block_from_suggestion(suggestion, db, current_user)
    
    suggestion.status = "approved"
    suggestion.approved_at = {"iso": datetime.utcnow().isoformat()}
    suggestion.updated_at = {"iso": datetime.utcnow().isoformat()}
    
    await db.commit()
    
    return {"message": "Suggestion approved successfully"}


@router.post("/suggestions/{suggestion_id}/reject", status_code=status.HTTP_200_OK)
async def reject_ai_suggestion(
    suggestion_id: str,
    feedback: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("use_ai_agents")),
):
    """Reject an AI-generated block suggestion."""
    result = await db.execute(
        select(AIBlockSuggestion)
        .filter(AIBlockSuggestion.id == suggestion_id)
        .filter(AIBlockSuggestion.user_id == current_user.id)
    )
    suggestion = result.scalar_one_or_none()
    
    if not suggestion:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Suggestion not found"
        )
    
    if suggestion.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Suggestion already processed"
        )
    
    suggestion.status = "rejected"
    suggestion.user_feedback = feedback
    suggestion.rejected_at = {"iso": datetime.utcnow().isoformat()}
    suggestion.updated_at = {"iso": datetime.utcnow().isoformat()}
    
    await db.commit()
    
    return {"message": "Suggestion rejected successfully"}
