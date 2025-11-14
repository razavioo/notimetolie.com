"""
AI Configuration router for managing AI agents and jobs.
"""
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel, Field
from datetime import datetime, timedelta
import uuid
import httpx

from src.dependencies import get_db, get_current_user, require_permission
from src.ai_config_models import (
    AIConfiguration,
    AIJob,
    AIBlockSuggestion,
    AIProvider,
    AIAgentType,
    AIJobStatus,
)
from src.models import User
from src.utils.encryption import encrypt_api_key, decrypt_api_key
from src.services.ai_processor import start_ai_job_background

router = APIRouter(prefix="/v1/ai", tags=["AI Configuration"])


# Cache for OpenRouter models (simple in-memory cache)
_openrouter_models_cache: Optional[Dict[str, Any]] = None
_openrouter_cache_timestamp: Optional[datetime] = None
CACHE_DURATION = timedelta(hours=1)  # Cache for 1 hour


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
    mcp_capable: bool = False  # Does the model support MCP?
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
        mcp_capable=config_data.mcp_capable,
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
        id=str(config.id),
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
            id=str(c.id),
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


@router.get("/configurations/{config_id}", response_model=AIConfigPublic)
async def get_ai_configuration(
    config_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("use_ai_agents")),
):
    """Get a specific AI configuration."""
    result = await db.execute(
        select(AIConfiguration)
        .filter(AIConfiguration.id == config_id)
        .filter(AIConfiguration.user_id == current_user.id)
    )
    config = result.scalar_one_or_none()
    
    if not config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="AI configuration not found"
        )
    
    return AIConfigPublic(
        id=str(config.id),
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


@router.put("/configurations/{config_id}", response_model=AIConfigPublic)
async def update_ai_configuration(
    config_id: str,
    config_data: AIConfigCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("use_ai_agents")),
):
    """Update an AI configuration."""
    result = await db.execute(
        select(AIConfiguration)
        .filter(AIConfiguration.id == config_id)
        .filter(AIConfiguration.user_id == current_user.id)
    )
    config = result.scalar_one_or_none()
    
    if not config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="AI configuration not found"
        )
    
    now = datetime.utcnow().isoformat()
    
    # Update fields
    config.name = config_data.name
    config.description = config_data.description
    config.provider = config_data.provider
    config.agent_type = config_data.agent_type
    config.model_name = config_data.model_name
    config.api_endpoint = config_data.api_endpoint
    config.temperature = {"value": config_data.temperature}
    config.max_tokens = {"value": config_data.max_tokens}
    config.system_prompt = config_data.system_prompt
    config.mcp_enabled = config_data.mcp_enabled
    config.mcp_server_url = config_data.mcp_server_url
    config.mcp_capable = config_data.mcp_capable
    config.can_create_blocks = config_data.can_create_blocks
    config.can_edit_blocks = config_data.can_edit_blocks
    config.can_search_web = config_data.can_search_web
    config.daily_request_limit = {"value": config_data.daily_request_limit}
    config.updated_at = {"iso": now}
    
    # Encrypt API key if provided
    if config_data.api_key:
        config.api_key_encrypted = encrypt_api_key(config_data.api_key)
    
    await db.commit()
    await db.refresh(config)
    
    return AIConfigPublic(
        id=str(config.id),
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


@router.delete("/configurations/{config_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_ai_configuration(
    config_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("use_ai_agents")),
):
    """Delete an AI configuration."""
    result = await db.execute(
        select(AIConfiguration)
        .filter(AIConfiguration.id == config_id)
        .filter(AIConfiguration.user_id == current_user.id)
    )
    config = result.scalar_one_or_none()
    
    if not config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="AI configuration not found"
        )
    
    # Soft delete by setting is_active to False
    config.is_active = False
    config.updated_at = {"iso": datetime.utcnow().isoformat()}
    
    await db.commit()
    
    return None


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
    
    # Start background processing
    background_tasks.add_task(start_ai_job_background, str(job.id), str(config.id))
    
    return AIJobPublic(
        id=str(job.id),
        configuration_id=str(job.configuration_id),
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


@router.get("/jobs", response_model=List[AIJobPublic])
async def list_ai_jobs(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("use_ai_agents")),
):
    """List all AI jobs for the current user."""
    result = await db.execute(
        select(AIJob)
        .filter(AIJob.user_id == current_user.id)
    )
    jobs = result.scalars().all()
    
    # Sort in Python since JSON field ordering is complex in SQLAlchemy
    jobs = sorted(jobs, key=lambda j: j.created_at.get("iso", ""), reverse=True)
    
    return [
        AIJobPublic(
            id=str(job.id),
            configuration_id=str(job.configuration_id),
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
        for job in jobs
    ]


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
        id=str(job.id),
        configuration_id=str(job.configuration_id),
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
    job.error_message = "Cancelled by user"
    job.completed_at = {"iso": datetime.utcnow().isoformat()}
    job.updated_at = {"iso": datetime.utcnow().isoformat()}
    
    await db.commit()
    
    # Send WebSocket notification
    try:
        from src.websocket.connection_manager import get_connection_manager
        ws_manager = get_connection_manager()
        await ws_manager.send_ai_job_update(
            str(current_user.id),  # Convert UUID to string
            str(job_id),           # Convert UUID to string
            AIJobStatus.CANCELLED.value,
            {"message": "Job cancelled by user"}
        )
    except Exception:
        pass  # Don't fail if WebSocket unavailable
    
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
            id=str(s.id),
            ai_job_id=str(s.ai_job_id),
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


@router.get("/providers/{provider}/models")
async def get_provider_models(
    provider: str,
    search: Optional[str] = None,
    free_only: Optional[bool] = False,
):
    """
    Get available models for a specific provider.
    Supports dynamic fetching from OpenRouter with caching.
    This endpoint is public to allow model discovery before authentication.
    """
    global _openrouter_models_cache, _openrouter_cache_timestamp
    
    if provider == "openrouter":
        # Check cache first
        now = datetime.utcnow()
        if (_openrouter_models_cache is not None and 
            _openrouter_cache_timestamp is not None and 
            now - _openrouter_cache_timestamp < CACHE_DURATION):
            models = _openrouter_models_cache
        else:
            # Fetch from OpenRouter API
            try:
                async with httpx.AsyncClient(timeout=10.0) as client:
                    response = await client.get("https://openrouter.ai/api/v1/models")
                    response.raise_for_status()
                    data = response.json()
                    models = data.get("data", [])
                    
                    # Update cache
                    _openrouter_models_cache = models
                    _openrouter_cache_timestamp = now
            except Exception as e:
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail=f"Failed to fetch models from OpenRouter: {str(e)}"
                )
        
        # Filter models
        filtered_models = models
        
        if free_only:
            filtered_models = [m for m in filtered_models if m.get("pricing", {}).get("prompt", "0") == "0"]
        
        if search:
            search_lower = search.lower()
            filtered_models = [
                m for m in filtered_models 
                if (search_lower in m.get("id", "").lower() or 
                    search_lower in m.get("name", "").lower())
            ]
        
        # Format response with relevant fields
        formatted_models = [
            {
                "id": m.get("id"),
                "name": m.get("name", m.get("id")),
                "description": m.get("description", ""),
                "context_length": m.get("context_length", 0),
                "pricing": {
                    "prompt": m.get("pricing", {}).get("prompt", "0"),
                    "completion": m.get("pricing", {}).get("completion", "0"),
                },
                "top_provider": m.get("top_provider", {}),
                "architecture": m.get("architecture", {}),
            }
            for m in filtered_models
        ]
        
        return {
            "provider": "openrouter",
            "models": formatted_models,
            "total": len(formatted_models),
            "cached": _openrouter_cache_timestamp is not None,
        }
    
    elif provider == "openai":
        return {
            "provider": "openai",
            "models": [
                {"id": "gpt-4", "name": "GPT-4", "description": "Most capable GPT-4 model"},
                {"id": "gpt-4-turbo", "name": "GPT-4 Turbo", "description": "Faster and cheaper GPT-4"},
                {"id": "gpt-3.5-turbo", "name": "GPT-3.5 Turbo", "description": "Fast and affordable"},
            ],
            "total": 3,
            "cached": True,
        }
    
    elif provider == "anthropic":
        return {
            "provider": "anthropic",
            "models": [
                {"id": "claude-3-opus-20240229", "name": "Claude 3 Opus", "description": "Most capable Claude model"},
                {"id": "claude-3-sonnet-20240229", "name": "Claude 3 Sonnet", "description": "Balanced performance"},
                {"id": "claude-3-haiku-20240307", "name": "Claude 3 Haiku", "description": "Fast and compact"},
                {"id": "claude-3-5-sonnet-20241022", "name": "Claude 3.5 Sonnet", "description": "Most intelligent model"},
            ],
            "total": 4,
            "cached": True,
        }
    
    elif provider == "groq":
        return {
            "provider": "groq",
            "models": [
                {"id": "llama-3.3-70b-versatile", "name": "Llama 3.3 70B Versatile", "description": "Fast and versatile"},
                {"id": "llama-3.1-8b-instant", "name": "Llama 3.1 8B Instant", "description": "Ultra-fast responses"},
                {"id": "mixtral-8x7b-32768", "name": "Mixtral 8x7B", "description": "Mixture of experts"},
                {"id": "gemma2-9b-it", "name": "Gemma 2 9B", "description": "Google's Gemma model"},
            ],
            "total": 4,
            "cached": True,
        }
    
    elif provider == "together_ai":
        # Together AI has model list API at https://api.together.xyz/v1/models
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(
                    "https://api.together.xyz/v1/models",
                    headers={"Authorization": f"Bearer {current_user.id}"}  # Would need actual API key
                )
                if response.status_code == 200:
                    data = response.json()
                    models = data if isinstance(data, list) else []
                    formatted = [
                        {
                            "id": m.get("id"),
                            "name": m.get("display_name", m.get("id")),
                            "description": m.get("description", ""),
                            "context_length": m.get("context_length", 0),
                        }
                        for m in models[:50]  # Limit to first 50
                    ]
                    return {"provider": "together_ai", "models": formatted, "total": len(formatted), "cached": False}
        except:
            pass
        
        # Fallback to popular models
        return {
            "provider": "together_ai",
            "models": [
                {"id": "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo", "name": "Llama 3.1 8B Instruct Turbo", "description": "Fast inference"},
                {"id": "meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo", "name": "Llama 3.1 70B Instruct Turbo", "description": "Balanced performance"},
                {"id": "mistralai/Mixtral-8x7B-Instruct-v0.1", "name": "Mixtral 8x7B Instruct", "description": "Mixture of experts"},
                {"id": "deepseek-ai/deepseek-coder-33b-instruct", "name": "DeepSeek Coder 33B", "description": "Code generation"},
            ],
            "total": 4,
            "cached": True,
        }
    
    elif provider == "cohere":
        # Cohere has model list API at https://api.cohere.ai/v1/models
        return {
            "provider": "cohere",
            "models": [
                {"id": "command-r-plus", "name": "Command R+", "description": "Most capable model for RAG"},
                {"id": "command-r", "name": "Command R", "description": "Balanced performance"},
                {"id": "command", "name": "Command", "description": "Versatile model"},
                {"id": "command-light", "name": "Command Light", "description": "Fast and efficient"},
            ],
            "total": 4,
            "cached": True,
        }
    
    elif provider == "huggingface":
        return {
            "provider": "huggingface",
            "models": [
                {"id": "meta-llama/Llama-3.3-70B-Instruct", "name": "Llama 3.3 70B Instruct", "description": "Latest Llama model"},
                {"id": "mistralai/Mixtral-8x7B-Instruct-v0.1", "name": "Mixtral 8x7B Instruct", "description": "Mixture of experts"},
                {"id": "google/gemma-2-9b-it", "name": "Gemma 2 9B IT", "description": "Google's Gemma"},
                {"id": "microsoft/Phi-3.5-mini-instruct", "name": "Phi 3.5 Mini Instruct", "description": "Small but powerful"},
            ],
            "total": 4,
            "cached": True,
        }
    
    elif provider == "replicate":
        return {
            "provider": "replicate",
            "models": [
                {"id": "meta/meta-llama-3.1-405b-instruct", "name": "Llama 3.1 405B Instruct", "description": "Largest Llama model"},
                {"id": "mistralai/mixtral-8x7b-instruct-v0.1", "name": "Mixtral 8x7B Instruct", "description": "Mixture of experts"},
                {"id": "stability-ai/sdxl", "name": "Stable Diffusion XL", "description": "Image generation"},
            ],
            "total": 3,
            "cached": True,
        }
    
    elif provider == "fireworks_ai":
        return {
            "provider": "fireworks_ai",
            "models": [
                {"id": "accounts/fireworks/models/llama-v3p3-70b-instruct", "name": "Llama 3.3 70B Instruct", "description": "Fast Llama inference"},
                {"id": "accounts/fireworks/models/mixtral-8x7b-instruct", "name": "Mixtral 8x7B Instruct", "description": "Fast mixtral"},
                {"id": "accounts/fireworks/models/qwen2p5-72b-instruct", "name": "Qwen 2.5 72B Instruct", "description": "Multilingual model"},
            ],
            "total": 3,
            "cached": True,
        }
    
    elif provider == "google_ai":
        return {
            "provider": "google_ai",
            "models": [
                {"id": "gemini-2.0-flash", "name": "Gemini 2.0 Flash", "description": "Latest and fastest"},
                {"id": "gemini-1.5-pro", "name": "Gemini 1.5 Pro", "description": "Most capable"},
                {"id": "gemini-1.5-flash", "name": "Gemini 1.5 Flash", "description": "Fast and efficient"},
            ],
            "total": 3,
            "cached": True,
        }
    
    elif provider == "mistral_ai":
        return {
            "provider": "mistral_ai",
            "models": [
                {"id": "mistral-large-latest", "name": "Mistral Large", "description": "Most capable Mistral model"},
                {"id": "mistral-medium-latest", "name": "Mistral Medium", "description": "Balanced performance"},
                {"id": "mistral-small-latest", "name": "Mistral Small", "description": "Fast and efficient"},
                {"id": "codestral-latest", "name": "Codestral", "description": "Code generation specialist"},
            ],
            "total": 4,
            "cached": True,
        }
    
    elif provider == "deepseek":
        return {
            "provider": "deepseek",
            "models": [
                {"id": "deepseek-chat", "name": "DeepSeek Chat", "description": "General purpose chat"},
                {"id": "deepseek-coder", "name": "DeepSeek Coder", "description": "Code generation and understanding"},
            ],
            "total": 2,
            "cached": True,
        }
    
    elif provider == "perplexity":
        return {
            "provider": "perplexity",
            "models": [
                {"id": "llama-3.1-sonar-large-128k-online", "name": "Sonar Large 128K Online", "description": "With web search"},
                {"id": "llama-3.1-sonar-small-128k-online", "name": "Sonar Small 128K Online", "description": "Fast with web search"},
                {"id": "llama-3.1-sonar-large-128k-chat", "name": "Sonar Large 128K Chat", "description": "Offline chat"},
            ],
            "total": 3,
            "cached": True,
        }
    
    elif provider == "ai21_labs":
        return {
            "provider": "ai21_labs",
            "models": [
                {"id": "jamba-1.5-large", "name": "Jamba 1.5 Large", "description": "Most capable Jamba model"},
                {"id": "jamba-1.5-mini", "name": "Jamba 1.5 Mini", "description": "Fast and efficient"},
            ],
            "total": 2,
            "cached": True,
        }
    
    elif provider in ["azure_openai", "amazon_bedrock", "cloudflare_ai", "anyscale", "baseten", "modal", "lepton_ai", "aleph_alpha"]:
        return {
            "provider": provider,
            "models": [
                {"id": "custom-model", "name": "Configure in settings", "description": f"{provider} requires account-specific configuration"},
            ],
            "total": 1,
            "cached": True,
        }
    
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Provider '{provider}' does not support dynamic model listing"
        )
