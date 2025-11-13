"""
WebSocket connection manager for real-time updates.
"""
from typing import Dict, Set, List
from fastapi import WebSocket
import json
import asyncio
import logging

logger = logging.getLogger(__name__)


class ConnectionManager:
    """Manages WebSocket connections for real-time updates."""
    
    def __init__(self):
        # user_id -> set of websocket connections
        self.active_connections: Dict[str, Set[WebSocket]] = {}
        # websocket -> user_id mapping
        self.connection_users: Dict[WebSocket, str] = {}
        self._lock = asyncio.Lock()
    
    async def connect(self, websocket: WebSocket, user_id: str):
        """
        Connect a new WebSocket for a user.
        
        Args:
            websocket: WebSocket connection
            user_id: User ID
        """
        await websocket.accept()
        
        async with self._lock:
            if user_id not in self.active_connections:
                self.active_connections[user_id] = set()
            
            self.active_connections[user_id].add(websocket)
            self.connection_users[websocket] = user_id
        
        logger.info(f"WebSocket connected for user {user_id}")
    
    async def disconnect(self, websocket: WebSocket):
        """
        Disconnect a WebSocket.
        
        Args:
            websocket: WebSocket connection to disconnect
        """
        async with self._lock:
            if websocket in self.connection_users:
                user_id = self.connection_users[websocket]
                
                if user_id in self.active_connections:
                    self.active_connections[user_id].discard(websocket)
                    
                    # Clean up empty sets
                    if not self.active_connections[user_id]:
                        del self.active_connections[user_id]
                
                del self.connection_users[websocket]
                logger.info(f"WebSocket disconnected for user {user_id}")
    
    async def send_personal_message(self, message: dict, user_id: str):
        """
        Send message to all connections of a specific user.
        
        Args:
            message: Message data (will be JSON serialized)
            user_id: Target user ID
        """
        if user_id not in self.active_connections:
            return
        
        message_text = json.dumps(message)
        
        # Create a copy of connections to avoid modification during iteration
        connections = list(self.active_connections[user_id])
        
        for connection in connections:
            try:
                await connection.send_text(message_text)
            except Exception as e:
                logger.error(f"Error sending message to user {user_id}: {e}")
                await self.disconnect(connection)
    
    async def broadcast(self, message: dict):
        """
        Broadcast message to all connected clients.
        
        Args:
            message: Message data (will be JSON serialized)
        """
        message_text = json.dumps(message)
        
        # Get all websockets
        all_connections = []
        for connections in self.active_connections.values():
            all_connections.extend(connections)
        
        for connection in all_connections:
            try:
                await connection.send_text(message_text)
            except Exception as e:
                logger.error(f"Error broadcasting message: {e}")
                await self.disconnect(connection)
    
    async def send_ai_job_update(
        self,
        user_id: str,
        job_id: str,
        status: str,
        data: dict = None
    ):
        """
        Send AI job status update to user.
        
        Args:
            user_id: User ID
            job_id: AI job ID
            status: Job status (pending, running, completed, failed, cancelled)
            data: Additional data
        """
        message = {
            "type": "ai_job_update",
            "job_id": job_id,
            "status": status,
            "data": data or {},
            "timestamp": asyncio.get_event_loop().time()
        }
        
        await self.send_personal_message(message, user_id)
    
    async def send_ai_job_progress(
        self,
        user_id: str,
        job_id: str,
        progress: float,
        message: str = None
    ):
        """
        Send AI job progress update.
        
        Args:
            user_id: User ID
            job_id: AI job ID
            progress: Progress percentage (0-100)
            message: Progress message
        """
        data = {
            "type": "ai_job_progress",
            "job_id": job_id,
            "progress": progress,
            "message": message,
            "timestamp": asyncio.get_event_loop().time()
        }
        
        await self.send_personal_message(data, user_id)
    
    async def send_notification(
        self,
        user_id: str,
        notification_type: str,
        title: str,
        message: str,
        data: dict = None
    ):
        """
        Send notification to user.
        
        Args:
            user_id: User ID
            notification_type: Type (info, success, warning, error)
            title: Notification title
            message: Notification message
            data: Additional data
        """
        notification = {
            "type": "notification",
            "notification_type": notification_type,
            "title": title,
            "message": message,
            "data": data or {},
            "timestamp": asyncio.get_event_loop().time()
        }
        
        await self.send_personal_message(notification, user_id)
    
    def get_connection_count(self, user_id: str = None) -> int:
        """
        Get number of active connections.
        
        Args:
            user_id: Optional user ID to get connections for specific user
        
        Returns:
            Number of active connections
        """
        if user_id:
            return len(self.active_connections.get(user_id, set()))
        
        return sum(len(conns) for conns in self.active_connections.values())


# Global connection manager instance
_connection_manager: ConnectionManager = None


def get_connection_manager() -> ConnectionManager:
    """Get or create connection manager instance."""
    global _connection_manager
    if _connection_manager is None:
        _connection_manager = ConnectionManager()
    return _connection_manager
