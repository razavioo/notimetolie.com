"""
AI job processor for background task execution.
"""
import asyncio
import json
import os
from datetime import datetime
from typing import Dict, Any, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import uuid

from src.ai_config_models import (
    AIConfiguration,
    AIJob,
    AIBlockSuggestion,
    AIJobStatus,
)
from src.services.ai_providers import create_ai_provider
from src.services.mcp_client import get_mcp_client
from src.services.storage import get_storage_service
from src.utils.encryption import decrypt_api_key
from src.websocket.connection_manager import get_connection_manager


class AIJobProcessor:
    """Process AI jobs in the background."""
    
    def __init__(self, db: AsyncSession):
        self.db = db
        self.mcp_client = None
        self.storage = get_storage_service()
        self.ws_manager = get_connection_manager()
    
    async def process_job(self, job_id: str, config_id: str) -> None:
        """
        Process an AI job.
        
        Args:
            job_id: AI job ID
            config_id: AI configuration ID
        """
        # Load job and configuration
        job_result = await self.db.execute(
            select(AIJob).filter(AIJob.id == job_id)
        )
        job = job_result.scalar_one_or_none()
        
        if not job:
            print(f"Job {job_id} not found")
            return
        
        config_result = await self.db.execute(
            select(AIConfiguration).filter(AIConfiguration.id == config_id)
        )
        config = config_result.scalar_one_or_none()
        
        if not config:
            job.status = AIJobStatus.FAILED
            job.error_message = "Configuration not found"
            await self.db.commit()
            return
        
        try:
            # Update job status
            job.status = AIJobStatus.RUNNING
            job.started_at = {"iso": datetime.utcnow().isoformat()}
            await self.db.commit()
            
            # Send WebSocket update
            await self.ws_manager.send_ai_job_update(
                job.user_id,
                job.id,
                AIJobStatus.RUNNING.value,
                {"message": "Job started"}
            )
            
            # Process based on job type
            if job.job_type == "content_creator":
                await self._process_content_creator(job, config)
            elif job.job_type == "content_researcher":
                await self._process_content_researcher(job, config)
            elif job.job_type == "content_editor":
                await self._process_content_editor(job, config)
            elif job.job_type == "course_designer":
                await self._process_course_designer(job, config)
            
            # Mark as completed
            job.status = AIJobStatus.COMPLETED
            job.completed_at = {"iso": datetime.utcnow().isoformat()}
            
            # Send completion update
            await self.ws_manager.send_ai_job_update(
                job.user_id,
                job.id,
                AIJobStatus.COMPLETED.value,
                {
                    "message": "Job completed successfully",
                    "output_data": job.output_data
                }
            )
            
        except Exception as e:
            job.status = AIJobStatus.FAILED
            job.error_message = str(e)
            print(f"Error processing job {job_id}: {e}")
            
            # Send failure update
            await self.ws_manager.send_ai_job_update(
                job.user_id,
                job.id,
                AIJobStatus.FAILED.value,
                {
                    "message": "Job failed",
                    "error": str(e)
                }
            )
        
        finally:
            job.updated_at = {"iso": datetime.utcnow().isoformat()}
            await self.db.commit()
    
    async def _process_content_creator(
        self,
        job: AIJob,
        config: AIConfiguration
    ) -> None:
        """Process content creator job."""
        # Initialize MCP client
        self.mcp_client = await get_mcp_client()
        
        # Send progress update
        await self.ws_manager.send_ai_job_progress(
            job.user_id,
            job.id,
            10.0,
            "Searching existing blocks via MCP..."
        )
        
        # Search existing blocks first via MCP
        existing_blocks = await self.mcp_client.search_existing_blocks(
            job.input_prompt,
            self.db,
            limit=5
        )
        
        # Send progress update
        await self.ws_manager.send_ai_job_progress(
            job.user_id,
            job.id,
            30.0,
            f"Found {len(existing_blocks)} related blocks"
        )
        
        # Create AI provider (decrypt API key)
        api_key = decrypt_api_key(config.api_key_encrypted) if config.api_key_encrypted else None
        provider = create_ai_provider(
            config.provider.value,
            api_key or os.getenv(f"{config.provider.value.upper()}_API_KEY", ""),
            config.model_name,
            config.api_endpoint
        )
        
        # Build system prompt
        system_prompt = config.system_prompt or """You are a knowledge block creator. 
Your task is to create concise, accurate, and well-structured knowledge blocks.
First, review existing blocks to avoid duplication.
Then create new content that fills gaps in the knowledge base."""
        
        # Add existing blocks to context
        context = f"""User request: {job.input_prompt}

Existing relevant blocks found:
{json.dumps(existing_blocks, indent=2)}

Based on these existing blocks, create new, non-duplicate content."""
        
        # Send progress update
        await self.ws_manager.send_ai_job_progress(
            job.user_id,
            job.id,
            50.0,
            "Generating content with AI..."
        )
        
        # Generate content
        result = await provider.generate(
            context,
            system_prompt=system_prompt,
            temperature=config.temperature.get("value", 0.7),
            max_tokens=config.max_tokens.get("value", 2000)
        )
        
        # Send progress update
        await self.ws_manager.send_ai_job_progress(
            job.user_id,
            job.id,
            80.0,
            "Creating suggestion..."
        )
        
        # Update job with results
        job.output_data = result
        job.tokens_used = result.get("tokens_used", {})
        job.suggested_blocks = [b["id"] for b in existing_blocks]
        
        # Create suggestion if content generated
        if result.get("content"):
            await self._create_block_suggestion(
                job,
                result["content"],
                existing_blocks
            )
    
    async def _process_content_researcher(
        self,
        job: AIJob,
        config: AIConfiguration
    ) -> None:
        """Process content researcher job."""
        self.mcp_client = await get_mcp_client()
        
        # Search for related content
        related_blocks = await self.mcp_client.discover_related_content(
            job.input_prompt,
            self.db,
            max_results=10
        )
        
        # Create provider
        provider = create_ai_provider(
            config.provider.value,
            config.api_key_encrypted,
            config.model_name,
            config.api_endpoint
        )
        
        # Generate research summary
        prompt = f"""Research topic: {job.input_prompt}

Found relevant blocks:
{json.dumps(related_blocks, indent=2)}

Summarize these findings and suggest what additional content is needed."""
        
        result = await provider.generate(
            prompt,
            system_prompt="You are a research assistant. Analyze existing content and suggest improvements.",
            temperature=config.temperature.get("value", 0.7),
            max_tokens=config.max_tokens.get("value", 2000)
        )
        
        job.output_data = {
            "summary": result.get("content"),
            "related_blocks": related_blocks
        }
        job.tokens_used = result.get("tokens_used", {})
        job.suggested_blocks = [b["id"] for b in related_blocks]
    
    async def _process_content_editor(
        self,
        job: AIJob,
        config: AIConfiguration
    ) -> None:
        """Process content editor job."""
        # TODO: Implement content editing logic
        job.output_data = {"message": "Content editor not yet implemented"}
    
    async def _process_course_designer(
        self,
        job: AIJob,
        config: AIConfiguration
    ) -> None:
        """Process course designer job."""
        self.mcp_client = await get_mcp_client()
        
        # Find relevant blocks for course
        related_blocks = await self.mcp_client.discover_related_content(
            job.input_prompt,
            self.db,
            max_results=20
        )
        
        # Create provider
        provider = create_ai_provider(
            config.provider.value,
            config.api_key_encrypted,
            config.model_name,
            config.api_endpoint
        )
        
        # Generate course structure
        prompt = f"""Design a learning path for: {job.input_prompt}

Available blocks:
{json.dumps(related_blocks, indent=2)}

Create a structured course outline using these blocks and suggest any missing blocks needed."""
        
        result = await provider.generate(
            prompt,
            system_prompt="You are a course designer. Create structured learning paths from existing content.",
            temperature=config.temperature.get("value", 0.7),
            max_tokens=config.max_tokens.get("value", 2000)
        )
        
        job.output_data = {
            "course_outline": result.get("content"),
            "suggested_blocks": related_blocks
        }
        job.tokens_used = result.get("tokens_used", {})
        job.suggested_blocks = [b["id"] for b in related_blocks]
    
    async def _create_block_suggestion(
        self,
        job: AIJob,
        content: str,
        existing_blocks: List[Dict]
    ) -> None:
        """Create a block suggestion from AI output."""
        # Parse content to extract title and body
        lines = content.strip().split("\n")
        title = lines[0].strip("# ").strip()
        body = "\n".join(lines[1:]).strip()
        
        # Generate slug
        slug = title.lower().replace(" ", "-")[:50]
        
        # Extract source URLs if mentioned in content
        source_urls = []
        # TODO: Extract URLs from content
        
        # Create suggestion
        suggestion = AIBlockSuggestion(
            id=str(uuid.uuid4()),
            ai_job_id=job.id,
            user_id=job.user_id,
            title=title,
            slug=slug,
            content=body,
            block_type="text",
            language=job.input_metadata.get("language", "en") if job.input_metadata else "en",
            tags=job.input_metadata.get("tags", []) if job.input_metadata else [],
            source_urls=source_urls,
            confidence_score={"value": 0.8},  # TODO: Calculate actual confidence
            ai_rationale=f"Created based on user request: {job.input_prompt}",
            status="pending",
            created_at={"iso": datetime.utcnow().isoformat()},
            updated_at={"iso": datetime.utcnow().isoformat()},
        )
        
        self.db.add(suggestion)
        await self.db.commit()


async def process_ai_job_background(
    job_id: str,
    config_id: str,
    db: AsyncSession
) -> None:
    """
    Background task wrapper for processing AI jobs.
    
    Args:
        job_id: AI job ID
        config_id: AI configuration ID
        db: Database session
    """
    processor = AIJobProcessor(db)
    await processor.process_job(job_id, config_id)
