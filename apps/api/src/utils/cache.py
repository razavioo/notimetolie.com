"""Caching utilities for API responses"""

import json
import hashlib
from typing import Optional, Any, Callable
from functools import wraps
import logging

logger = logging.getLogger(__name__)


class CacheManager:
    """Simple in-memory cache manager (use Redis in production)"""
    
    def __init__(self, default_ttl: int = 300):
        """
        Args:
            default_ttl: Default time-to-live in seconds
        """
        self.cache: dict = {}
        self.default_ttl = default_ttl
        self.enabled = True
    
    def _make_key(self, prefix: str, *args, **kwargs) -> str:
        """Generate cache key from function arguments"""
        key_data = f"{prefix}:{args}:{sorted(kwargs.items())}"
        return hashlib.md5(key_data.encode()).hexdigest()
    
    def get(self, key: str) -> Optional[Any]:
        """Get value from cache"""
        if not self.enabled:
            return None
        
        try:
            import time
            entry = self.cache.get(key)
            if entry:
                value, expiry = entry
                if time.time() < expiry:
                    logger.debug(f"Cache hit: {key}")
                    return value
                else:
                    # Expired
                    del self.cache[key]
                    logger.debug(f"Cache expired: {key}")
        except Exception as e:
            logger.warning(f"Cache get error: {e}")
        
        return None
    
    def set(self, key: str, value: Any, ttl: Optional[int] = None):
        """Set value in cache"""
        if not self.enabled:
            return
        
        try:
            import time
            ttl = ttl or self.default_ttl
            expiry = time.time() + ttl
            self.cache[key] = (value, expiry)
            logger.debug(f"Cache set: {key} (TTL: {ttl}s)")
        except Exception as e:
            logger.warning(f"Cache set error: {e}")
    
    def delete(self, key: str):
        """Delete key from cache"""
        try:
            if key in self.cache:
                del self.cache[key]
                logger.debug(f"Cache deleted: {key}")
        except Exception as e:
            logger.warning(f"Cache delete error: {e}")
    
    def clear(self):
        """Clear all cache"""
        self.cache.clear()
        logger.info("Cache cleared")
    
    def invalidate_pattern(self, pattern: str):
        """Invalidate all keys matching pattern"""
        keys_to_delete = [k for k in self.cache.keys() if pattern in k]
        for key in keys_to_delete:
            self.delete(key)
        logger.info(f"Invalidated {len(keys_to_delete)} keys matching '{pattern}'")


# Global cache instance
cache = CacheManager(default_ttl=300)  # 5 minutes default


def cached(ttl: Optional[int] = None, key_prefix: Optional[str] = None):
    """Decorator to cache function results
    
    Args:
        ttl: Time-to-live in seconds (None = use default)
        key_prefix: Prefix for cache key (None = use function name)
    
    Example:
        @cached(ttl=60, key_prefix="user")
        async def get_user(user_id: str):
            return await db.get(User, user_id)
    """
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Generate cache key
            prefix = key_prefix or func.__name__
            key = cache._make_key(prefix, *args, **kwargs)
            
            # Try to get from cache
            cached_value = cache.get(key)
            if cached_value is not None:
                return cached_value
            
            # Execute function
            result = await func(*args, **kwargs)
            
            # Store in cache
            cache.set(key, result, ttl)
            
            return result
        
        return wrapper
    return decorator


def cache_invalidate(patterns: list[str]):
    """Decorator to invalidate cache patterns after function execution
    
    Args:
        patterns: List of cache key patterns to invalidate
    
    Example:
        @cache_invalidate(["user:", "profile:"])
        async def update_user(user_id: str, data: dict):
            return await db.update(User, user_id, data)
    """
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Execute function
            result = await func(*args, **kwargs)
            
            # Invalidate cache patterns
            for pattern in patterns:
                cache.invalidate_pattern(pattern)
            
            return result
        
        return wrapper
    return decorator
