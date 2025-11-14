"""
WebSocket router for real-time updates.
"""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import logging
import json

from src.websocket.connection_manager import get_connection_manager
from src.dependencies import get_db
from src.models import User

router = APIRouter(tags=["WebSocket"])
logger = logging.getLogger(__name__)


async def get_current_user_ws(
    token: str = Query(...),
    db: AsyncSession = Depends(get_db)
) -> User:
    """
    Get current user from WebSocket token parameter with proper JWT validation.
    
    Args:
        token: JWT token from query parameter
        db: Database session
    
    Returns:
        User object
    
    Raises:
        HTTPException: If authentication fails
    """
    from src.auth import jwt_manager
    from fastapi import HTTPException, status
    
    try:
        # Verify JWT token
        payload = jwt_manager.verify_token(token)
        if not payload:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token"
            )
        
        # Extract user ID from payload
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload"
            )
        
        # Load user from database
        result = await db.execute(
            select(User).filter(User.id == user_id)
        )
        user = result.scalar_one_or_none()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found"
            )
        
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User account is inactive"
            )
        
        return user
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"WebSocket auth error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed"
        )


@router.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    token: str = Query(None),
    db: AsyncSession = Depends(get_db)
):
    """
    Main WebSocket endpoint for real-time updates.
    
    Query params:
        token: JWT authentication token
    """
    manager = get_connection_manager()
    user_id = None
    
    try:
        # For demo/development, accept without auth if no token
        # In production, always require authentication
        if token:
            # Decode JWT token to get user info
            from src.auth import jwt_manager
            try:
                payload = jwt_manager.decode_access_token(token)
                user_id = str(payload.get("id"))  # Get user ID from token and convert to string
                logger.info(f"WebSocket authenticated for user {user_id}")
            except Exception as e:
                logger.error(f"WebSocket auth error: {e}")
                user_id = "demo-user"  # Fallback for development
        else:
            # Demo mode - generate temporary user ID
            import uuid
            user_id = f"guest-{str(uuid.uuid4())[:8]}"
        
        await manager.connect(websocket, user_id)
        
        # Send welcome message
        await websocket.send_json({
            "type": "connection",
            "status": "connected",
            "user_id": user_id,
            "message": "WebSocket connection established"
        })
        
        # Listen for messages from client
        while True:
            try:
                data = await websocket.receive_text()
                message = json.loads(data)
                
                # Handle different message types
                if message.get("type") == "ping":
                    await websocket.send_json({
                        "type": "pong",
                        "timestamp": message.get("timestamp")
                    })
                
                elif message.get("type") == "subscribe":
                    # Subscribe to specific channels
                    channel = message.get("channel")
                    await websocket.send_json({
                        "type": "subscribed",
                        "channel": channel,
                        "message": f"Subscribed to {channel}"
                    })
                
                elif message.get("type") == "unsubscribe":
                    # Unsubscribe from channels
                    channel = message.get("channel")
                    await websocket.send_json({
                        "type": "unsubscribed",
                        "channel": channel,
                        "message": f"Unsubscribed from {channel}"
                    })
                
                else:
                    logger.warning(f"Unknown message type: {message.get('type')}")
            
            except json.JSONDecodeError:
                await websocket.send_json({
                    "type": "error",
                    "message": "Invalid JSON"
                })
            
            except Exception as e:
                logger.error(f"Error processing message: {e}")
                break
    
    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected for user {user_id}")
    
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
    
    finally:
        if user_id:
            await manager.disconnect(websocket)


@router.get("/ws/stats")
async def websocket_stats():
    """Get WebSocket connection statistics."""
    manager = get_connection_manager()
    
    return {
        "total_connections": manager.get_connection_count(),
        "users_connected": len(manager.active_connections),
        "status": "operational"
    }
