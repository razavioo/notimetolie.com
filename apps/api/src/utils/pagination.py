"""Pagination utilities for API responses"""

from typing import Generic, TypeVar, List, Optional
from pydantic import BaseModel
from fastapi import Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.sql import Select

T = TypeVar("T")


class PaginationParams:
    """Common pagination parameters for endpoints"""
    
    def __init__(
        self,
        page: int = Query(1, ge=1, description="Page number (starts at 1)"),
        page_size: int = Query(20, ge=1, le=100, description="Items per page (max 100)"),
        sort_by: Optional[str] = Query(None, description="Field to sort by"),
        sort_order: str = Query("desc", regex="^(asc|desc)$", description="Sort order (asc/desc)"),
    ):
        self.page = page
        self.page_size = page_size
        self.sort_by = sort_by
        self.sort_order = sort_order
        self.skip = (page - 1) * page_size


class PaginatedResponse(BaseModel, Generic[T]):
    """Generic paginated response structure"""
    
    items: List[T]
    total: int
    page: int
    page_size: int
    total_pages: int
    has_next: bool
    has_previous: bool
    
    @classmethod
    def create(cls, items: List[T], total: int, page: int, page_size: int):
        """Create paginated response"""
        total_pages = (total + page_size - 1) // page_size  # Ceiling division
        
        return cls(
            items=items,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
            has_next=page < total_pages,
            has_previous=page > 1,
        )


async def paginate_query(
    db: AsyncSession,
    query: Select,
    params: PaginationParams,
    count_query: Optional[Select] = None,
) -> tuple[List, int]:
    """Apply pagination to SQLAlchemy query and return results with count
    
    Args:
        db: Database session
        query: SQLAlchemy select query
        params: Pagination parameters
        count_query: Optional separate count query (for complex queries)
    
    Returns:
        Tuple of (items, total_count)
    """
    # Get total count
    if count_query is None:
        count_result = await db.execute(
            select(func.count()).select_from(query.subquery())
        )
        total = count_result.scalar() or 0
    else:
        count_result = await db.execute(count_query)
        total = count_result.scalar() or 0
    
    # Apply pagination
    paginated_query = query.limit(params.page_size).offset(params.skip)
    
    # Execute query
    result = await db.execute(paginated_query)
    items = result.scalars().all()
    
    return items, total
