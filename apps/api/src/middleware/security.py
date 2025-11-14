"""Security middleware for production-grade API protection"""

import logging
import uuid
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger(__name__)


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Add security headers to all responses"""
    
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        
        # Security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
        
        # Content Security Policy (adjust based on your needs)
        csp_directives = [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'",  # Adjust for production
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: https:",
            "font-src 'self' data:",
            "connect-src 'self'",
            "frame-ancestors 'none'",
        ]
        response.headers["Content-Security-Policy"] = "; ".join(csp_directives)
        
        return response


class RequestIDMiddleware(BaseHTTPMiddleware):
    """Add unique request ID for tracing"""
    
    async def dispatch(self, request: Request, call_next):
        request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
        
        # Add to request state for logging
        request.state.request_id = request_id
        
        # Process request
        response = await call_next(request)
        
        # Add to response
        response.headers["X-Request-ID"] = request_id
        
        return response


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Log all API requests with performance metrics"""
    
    async def dispatch(self, request: Request, call_next):
        import time
        
        start_time = time.time()
        request_id = getattr(request.state, "request_id", "unknown")
        
        # Log request
        logger.info(
            f"Request started",
            extra={
                "request_id": request_id,
                "method": request.method,
                "path": request.url.path,
                "client": request.client.host if request.client else "unknown",
            }
        )
        
        # Process request
        try:
            response = await call_next(request)
            
            # Calculate duration
            duration = time.time() - start_time
            
            # Log response
            logger.info(
                f"Request completed",
                extra={
                    "request_id": request_id,
                    "method": request.method,
                    "path": request.url.path,
                    "status_code": response.status_code,
                    "duration_ms": f"{duration * 1000:.2f}",
                }
            )
            
            # Add performance header
            response.headers["X-Response-Time"] = f"{duration * 1000:.2f}ms"
            
            return response
            
        except Exception as e:
            duration = time.time() - start_time
            logger.error(
                f"Request failed",
                extra={
                    "request_id": request_id,
                    "method": request.method,
                    "path": request.url.path,
                    "duration_ms": f"{duration * 1000:.2f}",
                    "error": str(e),
                },
                exc_info=True
            )
            raise


class InputSanitizationMiddleware(BaseHTTPMiddleware):
    """Sanitize and validate input data"""
    
    SUSPICIOUS_PATTERNS = [
        "<script",
        "javascript:",
        "onerror=",
        "onload=",
        "../",
        "..\\",
        "DROP TABLE",
        "UNION SELECT",
        "'; DELETE FROM",
    ]
    
    async def dispatch(self, request: Request, call_next):
        # Check query parameters
        for key, value in request.query_params.items():
            if any(pattern.lower() in str(value).lower() for pattern in self.SUSPICIOUS_PATTERNS):
                logger.warning(
                    f"Suspicious input detected in query param '{key}': {value}",
                    extra={"request_id": getattr(request.state, "request_id", "unknown")}
                )
                return Response(
                    content='{"error": "Invalid input detected"}',
                    status_code=400,
                    media_type="application/json"
                )
        
        # Check path parameters for path traversal
        path = request.url.path
        if "../" in path or "..\\" in path:
            logger.warning(
                f"Path traversal attempt detected: {path}",
                extra={"request_id": getattr(request.state, "request_id", "unknown")}
            )
            return Response(
                content='{"error": "Invalid path"}',
                status_code=400,
                media_type="application/json"
            )
        
        return await call_next(request)
