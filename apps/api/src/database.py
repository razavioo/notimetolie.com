from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import sessionmaker

from .config import settings

# Async engine
engine = create_async_engine(
    settings.database_url,
    echo=settings.debug,
    future=True
)

# Test engine for testing
test_engine = create_async_engine(
    settings.database_test_url,
    echo=settings.debug,
    future=True
)

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