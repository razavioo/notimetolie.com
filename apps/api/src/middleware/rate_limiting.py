"""Rate limiting middleware for API protection"""

import time
import logging
from typing import Dict, Optional
from collections import defaultdict
from datetime import datetime, timedelta
from fastapi import Request, Response, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.status import HTTP_429_TOO_MANY_REQUESTS

logger = logging.getLogger(__name__)


class RateLimitStore:
    """In-memory rate limit store (use Redis in production for distributed systems)"""
    
    def __init__(self):
        self.requests: Dict[str, list] = defaultdict(list)
        self.blocked: Dict[str, datetime] = {}
    
    def add_request(self, key: str, window_seconds: int) -> int:
        """Add a request and return current count in window"""
        now = time.time()
        cutoff = now - window_seconds
        
        # Clean old requests
        self.requests[key] = [req_time for req_time in self.requests[key] if req_time > cutoff]
        
        # Add new request
        self.requests[key].append(now)
        
        return len(self.requests[key])
    
    def is_blocked(self, key: str) -> bool:
        """Check if key is temporarily blocked"""
        if key in self.blocked:
            if datetime.now() < self.blocked[key]:
                return True
            else:
                del self.blocked[key]
        return False
    
    def block(self, key: str, duration_seconds: int):
        """Temporarily block a key"""
        self.blocked[key] = datetime.now() + timedelta(seconds=duration_seconds)
        logger.warning(f"Rate limit exceeded, blocking {key} for {duration_seconds}s")


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Rate limiting middleware with configurable limits per endpoint type"""
    
    def __init__(self, app, store: Optional[RateLimitStore] = None):
        super().__init__(app)
        self.store = store or RateLimitStore()
        
        # Rate limits: (requests, window_seconds, block_duration_seconds)
        self.limits = {
            "auth": (5, 60, 300),      # 5 login attempts per minute, block 5 min
            "api": (100, 60, 60),       # 100 requests per minute, block 1 min
            "ai": (10, 60, 300),        # 10 AI requests per minute, block 5 min
            "default": (60, 60, 60),    # 60 requests per minute, block 1 min
        }
    
    def get_client_identifier(self, request: Request) -> str:
        """Get unique client identifier"""
        # Try to get user ID from request state (set by auth middleware)
        if hasattr(request.state, "user_id"):
            return f"user:{request.state.user_id}"
        
        # Fall back to IP address
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            return f"ip:{forwarded.split(',')[0].strip()}"
        
        client_host = request.client.host if request.client else "unknown"
        return f"ip:{client_host}"
    
    def get_limit_type(self, path: str) -> str:
        """Determine rate limit type based on endpoint"""
        if "/auth" in path or "/login" in path or "/register" in path:
            return "auth"
        elif "/ai" in path or "/create-with-ai" in path:
            return "ai"
        elif path.startswith("/v1/"):
            return "api"
        return "default"
    
    async def dispatch(self, request: Request, call_next):
        # Skip rate limiting for health checks and docs
        if request.url.path in ["/v1/health", "/docs", "/redoc", "/openapi.json"]:
            return await call_next(request)
        
        client_id = self.get_client_identifier(request)
        limit_type = self.get_limit_type(request.url.path)
        key = f"{client_id}:{limit_type}"
        
        # Check if blocked
        if self.store.is_blocked(key):
            logger.warning(f"Blocked request from {client_id} to {request.url.path}")
            return Response(
                content='{"error": "Too many requests. Please try again later."}',
                status_code=HTTP_429_TOO_MANY_REQUESTS,
                media_type="application/json",
                headers={"Retry-After": "60"}
            )
        
        # Check rate limit
        max_requests, window_seconds, block_duration = self.limits[limit_type]
        request_count = self.store.add_request(key, window_seconds)
        
        # Add rate limit headers
        remaining = max(0, max_requests - request_count)
        
        if request_count > max_requests:
            self.store.block(key, block_duration)
            logger.warning(
                f"Rate limit exceeded for {client_id} on {request.url.path} "
                f"({request_count}/{max_requests} in {window_seconds}s)"
            )
            return Response(
                content='{"error": "Rate limit exceeded. Please try again later."}',
                status_code=HTTP_429_TOO_MANY_REQUESTS,
                media_type="application/json",
                headers={
                    "Retry-After": str(block_duration),
                    "X-RateLimit-Limit": str(max_requests),
                    "X-RateLimit-Remaining": "0",
                    "X-RateLimit-Reset": str(int(time.time()) + block_duration)
                }
            )
        
        # Process request
        response = await call_next(request)
        
        # Add rate limit headers to response
        response.headers["X-RateLimit-Limit"] = str(max_requests)
        response.headers["X-RateLimit-Remaining"] = str(remaining)
        response.headers["X-RateLimit-Reset"] = str(int(time.time()) + window_seconds)
        
        return response


class IPWhitelistMiddleware(BaseHTTPMiddleware):
    """Middleware to whitelist specific IPs (useful for admin endpoints)"""
    
    def __init__(self, app, whitelist: list[str] = None):
        super().__init__(app)
        self.whitelist = set(whitelist or [])
    
    def get_client_ip(self, request: Request) -> str:
        """Get client IP address"""
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            return forwarded.split(',')[0].strip()
        return request.client.host if request.client else "unknown"
    
    async def dispatch(self, request: Request, call_next):
        # Skip for non-admin endpoints
        if not request.url.path.startswith("/admin"):
            return await call_next(request)
        
        # Check whitelist
        if self.whitelist and self.get_client_ip(request) not in self.whitelist:
            logger.warning(f"Unauthorized IP access attempt to admin endpoint: {self.get_client_ip(request)}")
            return Response(
                content='{"error": "Access denied"}',
                status_code=403,
                media_type="application/json"
            )
        
        return await call_next(request)
