import pytest
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import uuid

from src.models import User, UserRole, ContentNode, NodeLevel
from src.auth import auth_manager
from src.rbac import rbac_manager


@pytest.mark.asyncio
async def test_create_block(db_session: AsyncSession):
    """Test block creation"""
    # Create a user first
    user = await auth_manager.create_user(
        db_session,
        username="blockcreator",
        email="creator@example.com",
        password="creatorPassword123"
    )

    block_data = {
        "title": "Test Block",
        "content": "This is test content",
        "slug": "test-block",
        "level": NodeLevel.BLOCK,
        "created_by_id": user.id
    }

    block = ContentNode(**block_data)
    db_session.add(block)
    await db_session.commit()
    await db_session.refresh(block)

    assert block.title == block_data["title"]
    assert block.content == block_data["content"]
    assert block.slug == block_data["slug"]
    assert block.level == NodeLevel.BLOCK
    assert block.created_by_id == user.id
    assert block.is_published is False
    assert block.is_locked is False


@pytest.mark.asyncio
async def test_create_path(db_session: AsyncSession):
    """Test path creation"""
    # Create a user first
    user = await auth_manager.create_user(
        db_session,
        username="pathcreator",
        email="pathcreator@example.com",
        password="pathcreatorPassword123"
    )

    path_data = {
        "title": "Test Path",
        "content": "This is test path description",
        "slug": "test-path",
        "level": NodeLevel.PATH,
        "created_by_id": user.id
    }

    path = ContentNode(**path_data)
    db_session.add(path)
    await db_session.commit()
    await db_session.refresh(path)

    assert path.title == path_data["title"]
    assert path.content == path_data["content"]
    assert path.slug == path_data["slug"]
    assert path.level == NodeLevel.PATH
    assert path.created_by_id == user.id


@pytest.mark.asyncio
async def test_block_path_relationship(db_session: AsyncSession):
    """Test parent-child relationship between paths and blocks"""
    # Create a user
    user = await auth_manager.create_user(
        db_session,
        username="relationshipuser",
        email="relationship@example.com",
        password="relationshipPassword123"
    )

    # Create a path
    path = ContentNode(
        title="Parent Path",
        content="Parent path description",
        slug="parent-path",
        level=NodeLevel.PATH,
        created_by_id=user.id
    )
    db_session.add(path)
    await db_session.commit()
    await db_session.refresh(path)

    # Create a block with the path as parent
    block = ContentNode(
        title="Child Block",
        content="Child block content",
        slug="child-block",
        level=NodeLevel.BLOCK,
        parent_id=path.id,
        created_by_id=user.id
    )
    db_session.add(block)
    await db_session.commit()
    await db_session.refresh(block)

    assert block.parent_id == path.id

    # Verify relationship by querying
    result = await db_session.execute(
        select(ContentNode).where(ContentNode.parent_id == path.id)
    )
    children = result.scalars().all()
    assert len(children) == 1
    assert children[0].id == block.id


@pytest.mark.asyncio
async def test_block_uniqueness_constraints(db_session: AsyncSession):
    """Test that slug uniqueness is enforced"""
    # Create a user
    user = await auth_manager.create_user(
        db_session,
        username="constraintuser",
        email="constraint@example.com",
        password="constraintPassword123"
    )

    # Create first block
    block1 = ContentNode(
        title="First Block",
        content="First content",
        slug="unique-slug",
        level=NodeLevel.BLOCK,
        created_by_id=user.id
    )
    db_session.add(block1)
    await db_session.commit()

    # Try to create second block with same slug
    block2 = ContentNode(
        title="Second Block",
        content="Second content",
        slug="unique-slug",  # Same slug
        level=NodeLevel.BLOCK,
        created_by_id=user.id
    )
    db_session.add(block2)

    # This should raise an integrity error
    with pytest.raises(Exception):  # SQLAlchemy will raise an integrity error
        await db_session.commit()


@pytest.mark.asyncio
async def test_user_content_relationship(db_session: AsyncSession):
    """Test that user-content relationships work"""
    # Create a user
    user = await auth_manager.create_user(
        db_session,
        username="contentuser",
        email="content@example.com",
        password="contentPassword123"
    )

    # Create multiple content nodes
    block1 = ContentNode(
        title="User Block 1",
        content="Content 1",
        slug="user-block-1",
        level=NodeLevel.BLOCK,
        created_by_id=user.id
    )
    block2 = ContentNode(
        title="User Block 2",
        content="Content 2",
        slug="user-block-2",
        level=NodeLevel.BLOCK,
        created_by_id=user.id
    )
    path1 = ContentNode(
        title="User Path 1",
        content="Path 1",
        slug="user-path-1",
        level=NodeLevel.PATH,
        created_by_id=user.id
    )

    db_session.add_all([block1, block2, path1])
    await db_session.commit()

    # Query user's created content
    result = await db_session.execute(
        select(ContentNode).where(ContentNode.created_by_id == user.id)
    )
    user_content = result.scalars().all()

    assert len(user_content) == 3
    titles = [item.title for item in user_content]
    assert "User Block 1" in titles
    assert "User Block 2" in titles
    assert "User Path 1" in titles


@pytest.mark.asyncio
async def test_content_metadata(db_session: AsyncSession):
    """Test that metadata JSON field works correctly"""
    # Create a user
    user = await auth_manager.create_user(
        db_session,
        username="metadatauser",
        email="metadata@example.com",
        password="metadataPassword123"
    )

    # Create block with metadata
    test_metadata = {
        "tags": ["python", "fastapi", "testing"],
        "difficulty": "intermediate",
        "estimated_time": 30
    }

    block = ContentNode(
        title="Block with Metadata",
        content="Content with metadata",
        slug="metadata-block",
        level=NodeLevel.BLOCK,
        created_by_id=user.id,
        metadata=test_metadata
    )
    db_session.add(block)
    await db_session.commit()
    await db_session.refresh(block)

    assert block.metadata is not None
    assert block.metadata["tags"] == ["python", "fastapi", "testing"]
    assert block.metadata["difficulty"] == "intermediate"
    assert block.metadata["estimated_time"] == 30