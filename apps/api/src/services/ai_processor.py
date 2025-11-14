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
from src.utils.encryption import decrypt_api_key


class AIJobProcessor:
    """Process AI jobs in the background."""
    
    def __init__(self, db: AsyncSession):
        self.db = db
        self.mcp_client = None
        self.storage = None
        self.ws_manager = None
    
    def _get_mcp_client(self):
        """Lazy load MCP client."""
        if self.mcp_client is None:
            from src.services.mcp_client import get_mcp_client
            return get_mcp_client()
        return self.mcp_client
    
    def _get_storage(self):
        """Lazy load storage service."""
        if self.storage is None:
            try:
                from src.services.storage import get_storage_service
                self.storage = get_storage_service()
            except ImportError:
                print("Warning: Storage service not available (minio not installed)")
                self.storage = None
        return self.storage
    
    def _get_ws_manager(self):
        """Lazy load WebSocket manager."""
        if self.ws_manager is None:
            from src.websocket.connection_manager import get_connection_manager
            self.ws_manager = get_connection_manager()
        return self.ws_manager
    
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
            ws_manager = self._get_ws_manager()
            if ws_manager:
                await ws_manager.send_ai_job_update(
                    str(job.user_id),  # Convert UUID to string
                    str(job.id),       # Convert UUID to string
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
            ws_manager = self._get_ws_manager()
            if ws_manager:
                await ws_manager.send_ai_job_update(
                    str(job.user_id),  # Convert UUID to string
                    str(job.id),       # Convert UUID to string
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
            import traceback
            traceback.print_exc()
            
            # Send failure update
            ws_manager = self._get_ws_manager()
            if ws_manager:
                await ws_manager.send_ai_job_update(
                    str(job.user_id),  # Convert UUID to string
                    str(job.id),       # Convert UUID to string
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
        self.mcp_client = await self._get_mcp_client()
        ws_manager = self._get_ws_manager()
        
        # Send progress update
        if ws_manager:
            await ws_manager.send_ai_job_progress(
                str(job.user_id),  # Convert UUID to string
                str(job.id),       # Convert UUID to string
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
        if ws_manager:
            await ws_manager.send_ai_job_progress(
                str(job.user_id),  # Convert UUID to string
                str(job.id),       # Convert UUID to string
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
        if ws_manager:
            await ws_manager.send_ai_job_progress(
                str(job.user_id),  # Convert UUID to string
                str(job.id),       # Convert UUID to string
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
        
        # Check if AI provider returned an error
        if result.get("error"):
            raise Exception(f"AI provider error: {result['error']}")
        
        if not result.get("content"):
            raise Exception("AI provider returned no content")
        
        # Send progress update
        if ws_manager:
            await ws_manager.send_ai_job_progress(
                str(job.user_id),  # Convert UUID to string
                str(job.id),       # Convert UUID to string
                80.0,
                "Creating suggestion..."
            )
        
        # Update job with results (UUIDs already converted to strings by MCP client)
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
        self.mcp_client = await self._get_mcp_client()
        
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
        
        # Check if AI provider returned an error
        if result.get("error"):
            raise Exception(f"AI provider error: {result['error']}")
        
        if not result.get("content"):
            raise Exception("AI provider returned no content")
        
        # UUIDs already converted to strings by MCP client
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
        """Process content editor job - improves existing content"""
        from src.models import ContentNode
        
        # Extract block ID from input metadata
        block_id = job.input_metadata.get("block_id") if job.input_metadata else None
        if not block_id:
            raise ValueError("block_id required in input_metadata for content editor")
        
        # Load the block
        result = await self.db.execute(
            select(ContentNode).filter(ContentNode.id == block_id)
        )
        block = result.scalar_one_or_none()
        if not block:
            raise ValueError(f"Block {block_id} not found")
        
        # Create provider
        api_key = decrypt_api_key(config.api_key_encrypted) if config.api_key_encrypted else None
        provider = create_ai_provider(
            config.provider.value,
            api_key or os.getenv(f"{config.provider.value.upper()}_API_KEY", ""),
            config.model_name,
            config.api_endpoint
        )
        
        # Build editing prompt
        prompt = f"""Edit and improve the following content block:

Title: {block.title}
Content:
{block.content}

Editing instructions: {job.input_prompt}

Provide improved version that:
- Fixes any errors or unclear language
- Improves readability and structure
- Maintains the original meaning
- Follows the specific instructions given"""
        
        result = await provider.generate(
            prompt,
            system_prompt="You are a content editor. Improve clarity, correctness, and readability while preserving the original intent.",
            temperature=config.temperature.get("value", 0.5),  # Lower temperature for editing
            max_tokens=config.max_tokens.get("value", 2000)
        )
        
        if result.get("error"):
            raise Exception(f"AI provider error: {result['error']}")
        
        if not result.get("content"):
            raise Exception("AI provider returned no content")
        
        # Store the edited version as suggestion
        job.output_data = {
            "original_block_id": str(block_id),
            "edited_content": result.get("content"),
            "editing_notes": f"Applied edits based on: {job.input_prompt}"
        }
        job.tokens_used = result.get("tokens_used", {})
        
        # Create edit suggestion
        await self._create_edit_suggestion(job, block, result.get("content"))
    
    async def _create_edit_suggestion(
        self,
        job: AIJob,
        original_block,
        edited_content: str
    ) -> None:
        """Create edit suggestion for existing block"""
        suggestion = AIBlockSuggestion(
            id=str(uuid.uuid4()),
            ai_job_id=job.id,
            user_id=job.user_id,
            title=f"[EDIT] {original_block.title}",
            slug=original_block.slug,
            content=edited_content,
            block_type=original_block.block_type,
            language=original_block.language or "en",
            tags=original_block.tags or [],
            source_urls=[],
            confidence_score={"value": 0.85},  # Higher confidence for edits
            ai_rationale=f"Edited based on: {job.input_prompt}",
            status="pending",
            created_at={"iso": datetime.utcnow().isoformat()},
            updated_at={"iso": datetime.utcnow().isoformat()},
        )
        
        self.db.add(suggestion)
        await self.db.commit()
    
    async def _process_course_designer(
        self,
        job: AIJob,
        config: AIConfiguration
    ) -> None:
        """Process course designer job."""
        self.mcp_client = await self._get_mcp_client()
        
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
        
        # Check if AI provider returned an error
        if result.get("error"):
            raise Exception(f"AI provider error: {result['error']}")
        
        if not result.get("content"):
            raise Exception("AI provider returned no content")
        
        # UUIDs already converted to strings by MCP client
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
        
        # Extract source URLs from content
        import re
        url_pattern = r'https?://(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&/=]*)'
        source_urls = list(set(re.findall(url_pattern, content)))[:5]  # Limit to 5 URLs
        
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
            confidence_score=self._calculate_confidence_score(content, existing_blocks),
            ai_rationale=f"Created based on user request: {job.input_prompt}",
            status="pending",
            created_at={"iso": datetime.utcnow().isoformat()},
            updated_at={"iso": datetime.utcnow().isoformat()},
        )
        
        self.db.add(suggestion)
        await self.db.commit()
    
    def _calculate_confidence_score(self, content: str, existing_blocks: List[Dict]) -> Dict[str, float]:
        """Calculate confidence score based on content quality indicators"""
        score = 0.7  # Base score
        
        # Increase score if content has good structure
        if len(content.split("\n")) > 3:  # Multiple paragraphs
            score += 0.05
        
        if "```" in content:  # Contains code blocks
            score += 0.05
        
        # Increase score if references existing blocks
        if len(existing_blocks) > 0:
            score += 0.05
        
        # Increase score if has URLs/sources
        import re
        urls = re.findall(r'https?://[^\s]+', content)
        if len(urls) > 0:
            score += 0.05
        
        # Penalize if content is very short (might be incomplete)
        if len(content) < 100:
            score -= 0.15
        
        # Cap at 0.95 (never fully confident for AI-generated content)
        score = min(0.95, max(0.3, score))
        
        return {"value": score}


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


def start_ai_job_background(job_id: str, config_id: str) -> None:
    """
    Synchronous wrapper to start an async AI job processing task.
    Creates its own database session for background processing.
    
    Args:
        job_id: AI job ID
        config_id: AI configuration ID
    """
    import asyncio
    from src.database import AsyncSessionLocal
    
    print(f"[AI JOB] Starting background processing for job {job_id} with config {config_id}")
    
    async def _process():
        try:
            print(f"[AI JOB] Creating database session for job {job_id}")
            async with AsyncSessionLocal() as session:
                print(f"[AI JOB] Calling process_ai_job_background for job {job_id}")
                await process_ai_job_background(job_id, config_id, session)
                print(f"[AI JOB] Successfully completed processing for job {job_id}")
        except Exception as e:
            print(f"[AI JOB] ERROR in _process for job {job_id}: {e}")
            import traceback
            traceback.print_exc()
    
    # Run in the current event loop or create a new one
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            # If loop is already running (FastAPI context), create a task
            print(f"[AI JOB] Creating async task for job {job_id} in running event loop")
            asyncio.create_task(_process())
        else:
            # If no loop is running, run until complete
            print(f"[AI JOB] Running job {job_id} in existing non-running loop")
            loop.run_until_complete(_process())
    except RuntimeError as e:
        # No event loop, create new one
        print(f"[AI JOB] No event loop, creating new one for job {job_id}: {e}")
        asyncio.run(_process())
