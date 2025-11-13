"""
Model Context Protocol (MCP) client for AI agent integration.
"""
import asyncio
import json
from typing import List, Dict, Any, Optional
import httpx
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from src.models.content import ContentNode


class MCPClient:
    """
    Client for interacting with MCP servers to provide context to AI agents.
    """
    
    def __init__(self, server_url: str = "http://localhost:8000"):
        self.server_url = server_url
        self.client = httpx.AsyncClient(timeout=30.0)
    
    async def search_existing_blocks(
        self, 
        query: str, 
        db: AsyncSession,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Search for existing blocks that match the query using MCP.
        This provides context to AI about what content already exists.
        """
        try:
            # Search in database
            search_pattern = f"%{query}%"
            result = await db.execute(
                select(ContentNode)
                .filter(ContentNode.title.ilike(search_pattern))
                .filter(ContentNode.is_published == True)
                .limit(limit)
            )
            blocks = result.scalars().all()
            
            # Format for MCP response
            return [
                {
                    "id": block.id,
                    "title": block.title,
                    "slug": block.slug,
                    "content_preview": block.content[:200] if block.content else None,
                    "block_type": block.block_type,
                    "language": block.language,
                    "tags": block.tags,
                    "url": f"/blocks/{block.slug}",
                }
                for block in blocks
            ]
        except Exception as e:
            print(f"Error searching blocks via MCP: {e}")
            return []
    
    async def get_block_context(
        self,
        block_id: str,
        db: AsyncSession
    ) -> Optional[Dict[str, Any]]:
        """
        Get full context of a specific block for AI to reference.
        """
        try:
            result = await db.execute(
                select(ContentNode).filter(ContentNode.id == block_id)
            )
            block = result.scalar_one_or_none()
            
            if not block:
                return None
            
            return {
                "id": block.id,
                "title": block.title,
                "slug": block.slug,
                "content": block.content,
                "block_type": block.block_type,
                "language": block.language,
                "tags": block.tags,
                "metadata": block.metadata,
                "created_at": block.created_at.get("iso"),
            }
        except Exception as e:
            print(f"Error getting block context via MCP: {e}")
            return None
    
    async def discover_related_content(
        self,
        topic: str,
        db: AsyncSession,
        max_results: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Discover related content that AI can suggest for a learning path.
        """
        # This would use MCP to provide context about existing content
        # that could be relevant to the user's requested topic
        return await self.search_existing_blocks(topic, db, max_results)
    
    async def get_mcp_tools(self) -> List[Dict[str, Any]]:
        """
        Get list of available MCP tools for AI agents.
        """
        return [
            {
                "name": "search_blocks",
                "description": "Search for existing knowledge blocks by query",
                "parameters": {
                    "query": "string",
                    "limit": "integer (optional, default 10)"
                }
            },
            {
                "name": "get_block_content",
                "description": "Get full content of a specific block",
                "parameters": {
                    "block_id": "string (UUID)"
                }
            },
            {
                "name": "discover_related",
                "description": "Discover related content for a topic",
                "parameters": {
                    "topic": "string",
                    "max_results": "integer (optional, default 5)"
                }
            }
        ]
    
    async def execute_tool(
        self,
        tool_name: str,
        parameters: Dict[str, Any],
        db: AsyncSession
    ) -> Any:
        """
        Execute an MCP tool with given parameters.
        """
        if tool_name == "search_blocks":
            return await self.search_existing_blocks(
                parameters.get("query", ""),
                db,
                parameters.get("limit", 10)
            )
        elif tool_name == "get_block_content":
            return await self.get_block_context(
                parameters.get("block_id"),
                db
            )
        elif tool_name == "discover_related":
            return await self.discover_related_content(
                parameters.get("topic"),
                db,
                parameters.get("max_results", 5)
            )
        else:
            raise ValueError(f"Unknown tool: {tool_name}")
    
    async def close(self):
        """Close the HTTP client."""
        await self.client.aclose()


# Global MCP client instance
_mcp_client: Optional[MCPClient] = None


async def get_mcp_client() -> MCPClient:
    """Get or create MCP client instance."""
    global _mcp_client
    if _mcp_client is None:
        _mcp_client = MCPClient()
    return _mcp_client
