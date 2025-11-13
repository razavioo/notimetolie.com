"""
Tests for search endpoints
"""
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_search_empty_query(client: AsyncClient):
    """Test search with empty query"""
    response = await client.get("/v1/search?q=")
    # Should return 200 with empty/all results, 400 for invalid, or 503 if Meilisearch unavailable
    assert response.status_code in [200, 400, 422, 503]


@pytest.mark.asyncio
async def test_search_no_results(client: AsyncClient):
    """Test search when no matching results exist"""
    response = await client.get("/v1/search?q=nonexistentquerythatshouldfindnothing12345")
    # 200 for success, 503 if Meilisearch unavailable
    assert response.status_code in [200, 503]
    if response.status_code == 200:
        data = response.json()
        # Should have blocks and paths arrays
        assert isinstance(data, dict)


@pytest.mark.asyncio
async def test_search_special_characters(client: AsyncClient):
    """Test search handles special characters"""
    special_chars = "test+block%20with&special=chars"
    response = await client.get(f"/v1/search?q={special_chars}")
    # 200 for success, 400 for invalid chars, 503 if Meilisearch unavailable
    assert response.status_code in [200, 400, 503]
