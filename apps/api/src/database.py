import os
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.pool import StaticPool

from .config import settings

def _engine_for_url(url: str, echo: bool):
    if url.startswith("sqlite+"):
        kwargs = {"echo": echo, "future": True, "connect_args": {"check_same_thread": False}}
        # Use StaticPool for in-memory to keep the same connection
        if ":memory:" in url:
            kwargs["poolclass"] = StaticPool
        return create_async_engine(url, **kwargs)
    try:
        return create_async_engine(url, echo=echo, future=True)
    except ModuleNotFoundError as e:
        # Fallback to in-memory SQLite if asyncpg or other DBAPI is missing
        return create_async_engine(
            "sqlite+aiosqlite:///:memory:",
            echo=echo,
            future=True,
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )


# Async engine (fallbacks to SQLite memory if driver missing)
engine = _engine_for_url(settings.database_url, settings.debug)

# Test engine for testing
test_engine = _engine_for_url(settings.database_test_url, settings.debug)

# Session factory
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False
)

# Test session factory
AsyncTestSessionLocal = async_sessionmaker(
    test_engine,
    class_=AsyncSession,
    expire_on_commit=False
)

# Base class for models
Base = declarative_base()


# Dependency
async def get_db() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


# Test dependency
async def get_test_db() -> AsyncSession:
    async with AsyncTestSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
