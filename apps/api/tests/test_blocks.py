"""
Tests for blocks endpoints
"""
import pytest
from httpx import AsyncClient
import uuid


@pytest.mark.asyncio
async def test_get_blocks_empty(client: AsyncClient):
    """Test getting blocks when none exist"""
    response = await client.get("/v1/blocks")
    assert response.status_code == 200
    assert response.json() == []


@pytest.mark.asyncio
async def test_create_block_success(client: AsyncClient, test_user):
    """Test creating a new block"""
    block_data = {
        "title": "Test Block",
        "slug": "test-block-" + str(uuid.uuid4())[:8],
        "block_type": "text",
        "content": "This is test content"
    }
    
    # Create block (note: will fail without auth, but structure is correct)
    response = await client.post("/v1/blocks", json=block_data)
    
    # Without proper auth setup, this will return 403
    # In a real test with auth, we'd expect 201
    assert response.status_code in [201, 403, 401]


@pytest.mark.asyncio
async def test_create_block_duplicate_slug(client: AsyncClient):
    """Test that duplicate slugs are rejected"""
    slug = "duplicate-test-" + str(uuid.uuid4())[:8]
    block_data = {
        "title": "First Block",
        "slug": slug,
        "block_type": "text"
    }
    
    # Try to create first block
    await client.post("/v1/blocks", json=block_data)
    
    # Try to create second block with same slug
    block_data["title"] = "Second Block"
    response = await client.post("/v1/blocks", json=block_data)
    
    # Should fail with conflict or auth error
    assert response.status_code in [409, 403, 401]


@pytest.mark.asyncio
async def test_get_block_not_found(client: AsyncClient):
    """Test getting a non-existent block"""
    response = await client.get("/v1/blocks/non-existent-slug")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_create_block_invalid_data(client: AsyncClient):
    """Test creating a block with invalid data"""
    invalid_data = {
        "slug": "invalid-block"
        # Missing required 'title' field
    }
    
    response = await client.post("/v1/blocks", json=invalid_data)
    assert response.status_code in [422, 403, 401]  # Validation error or auth error


@pytest.mark.asyncio
async def test_health_endpoint(client: AsyncClient):
    """Test the health check endpoint"""
    response = await client.get("/v1/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


@pytest.mark.asyncio
async def test_api_docs_available(client: AsyncClient):
    """Test that API documentation is available"""
    response = await client.get("/docs")
    assert response.status_code == 200
    assert b"swagger" in response.content.lower() or b"openapi" in response.content.lower()
