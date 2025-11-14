import pytest
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from unittest.mock import AsyncMock

from src.models import User, UserRole
from src.auth import auth_manager
from src.rbac import rbac_manager


@pytest.mark.asyncio
async def test_create_user(db_session: AsyncSession):
    """Test user creation"""
    user_data = {
        "username": "testuser",
        "email": "test@example.com",
        "password": "TestPassword123",  # Updated to meet password requirements
        "full_name": "Test User"
    }

    user = await auth_manager.create_user(db_session, **user_data)

    assert user.username == user_data["username"]
    assert user.email == user_data["email"]
    assert user.full_name == user_data["full_name"]
    assert user.role == UserRole.BUILDER
    assert user.is_active is True
    assert user.is_verified is False
    assert user.xp == 0
    assert user.level == 1


@pytest.mark.asyncio
async def test_authenticate_user(db_session: AsyncSession):
    """Test user authentication"""
    # Create a user first
    user = await auth_manager.create_user(
        db_session,
        username="authuser",
        email="auth@example.com",
        password="AuthPassword123"  # Updated to meet password requirements
    )

    # Test successful authentication
    authenticated_user = await auth_manager.authenticate_user(
        db_session, "authuser", "AuthPassword123"
    )
    assert authenticated_user is not None
    assert authenticated_user.id == user.id

    # Test wrong password
    wrong_auth_user = await auth_manager.authenticate_user(
        db_session, "authuser", "wrongpassword"
    )
    assert wrong_auth_user is None

    # Test non-existent user
    no_user = await auth_manager.authenticate_user(
        db_session, "nonexistent", "password"
    )
    assert no_user is None


@pytest.mark.asyncio
async def test_get_user_by_username(db_session: AsyncSession):
    """Test getting user by username"""
    # Create a user
    created_user = await auth_manager.create_user(
        db_session,
        username="getuser",
        email="get@example.com",
        password="getPassword123"
    )

    # Get user by username
    retrieved_user = await auth_manager.get_user_by_username(db_session, "getuser")
    assert retrieved_user is not None
    assert retrieved_user.id == created_user.id

    # Test non-existent user
    no_user = await auth_manager.get_user_by_username(db_session, "nonexistent")
    assert no_user is None


@pytest.mark.asyncio
async def test_get_user_by_email(db_session: AsyncSession):
    """Test getting user by email"""
    # Create a user
    created_user = await auth_manager.create_user(
        db_session,
        username="emailuser",
        email="email@example.com",
        password="emailPassword123"
    )

    # Get user by email
    retrieved_user = await auth_manager.get_user_by_email(db_session, "email@example.com")
    assert retrieved_user is not None
    assert retrieved_user.id == created_user.id

    # Test non-existent user
    no_user = await auth_manager.get_user_by_email(db_session, "nonexistent@example.com")
    assert no_user is None


@pytest.mark.asyncio
async def test_rbac_permissions(db_session: AsyncSession):
    """Test RBAC permission checking"""
    # Create users with different roles
    admin_user = await auth_manager.create_user(
        db_session,
        username="admin",
        email="admin@example.com",
        password="adminPassword123"
    )
    admin_user.role = UserRole.ADMIN
    await db_session.commit()

    builder_user = await auth_manager.create_user(
        db_session,
        username="builder",
        email="builder@example.com",
        password="builderPassword123"
    )
    builder_user.role = UserRole.BUILDER
    await db_session.commit()

    # Test admin permissions
    assert rbac_manager.check_permission(db_session, admin_user, "any_permission") is True

    # Test builder permissions
    assert rbac_manager.check_permission(db_session, builder_user, "create_blocks") is True
    assert rbac_manager.check_permission(db_session, builder_user, "edit_own_blocks") is True
    assert rbac_manager.check_permission(db_session, builder_user, "edit_others_blocks") is False
    assert rbac_manager.check_permission(db_session, builder_user, "nonexistent_permission") is False


@pytest.mark.asyncio
async def test_rbac_role_assignment(db_session: AsyncSession):
    """Test role assignment"""
    user = await auth_manager.create_user(
        db_session,
        username="roleuser",
        email="role@example.com",
        password="rolePassword123"
    )

    # Test role assignment
    success = await rbac_manager.assign_role(db_session, user, "trusted_builder")
    assert success is True

    # Refresh user from database
    await db_session.refresh(user)
    assert user.role == UserRole.TRUSTED_BUILDER

    # Test invalid role
    invalid_success = await rbac_manager.assign_role(db_session, user, "invalid_role")
    assert invalid_success is False


@pytest.mark.asyncio
async def test_password_hashing():
    """Test password hashing and verification"""
    password = "testPassword123"
    hashed_password = auth_manager.get_password_hash(password)

    # Verify the hash is different from the original password
    assert hashed_password != password

    # Verify the password matches the hash
    assert auth_manager.verify_password(password, hashed_password) is True

    # Verify wrong password doesn't match
    assert auth_manager.verify_password("wrongpassword", hashed_password) is False