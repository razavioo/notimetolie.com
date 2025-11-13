"""
Tests for paths endpoints
"""
import pytest
from httpx import AsyncClient
import uuid


@pytest.mark.asyncio
async def test_get_paths_empty(client: AsyncClient):
    """Test getting paths when none exist"""
    response = await client.get("/v1/paths")
    assert response.status_code == 200
    assert response.json() == []


@pytest.mark.asyncio
async def test_create_path_structure(client: AsyncClient):
    """Test path creation structure (without auth)"""
    path_data = {
        "title": "Test Path",
        "slug": "test-path-" + str(uuid.uuid4())[:8],
        "description": "A test learning path",
        "block_ids": []
    }
    
    response = await client.post("/v1/paths", json=path_data)
    
    # Without auth, expect 401/403, with auth expect 201
    assert response.status_code in [201, 403, 401]


@pytest.mark.asyncio
async def test_get_path_not_found(client: AsyncClient):
    """Test getting a non-existent path"""
    response = await client.get("/v1/paths/non-existent-path")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_create_path_invalid_data(client: AsyncClient):
    """Test creating a path with missing required fields"""
    invalid_data = {
        "slug": "invalid-path"
        # Missing required 'title' field
    }
    
    response = await client.post("/v1/paths", json=invalid_data)
    assert response.status_code in [422, 403, 401]
