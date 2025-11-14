import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from src.models import User, UserRole, ContentNode, NodeLevel
from src.auth import auth_manager


@pytest.mark.asyncio
async def test_register_user(client: AsyncClient, db_session: AsyncSession):
    """Test user registration endpoint"""
    user_data = {
        "username": "newuser",
        "email": "newuser@example.com",
        "password": "newPassword123",
        "full_name": "New User"
    }

    response = await client.post("/v1/users/register", json=user_data)

    assert response.status_code == 201
    data = response.json()
    assert data["username"] == user_data["username"]
    assert data["email"] == user_data["email"]
    assert data["full_name"] == user_data["full_name"]
    assert data["is_active"] is True
    assert data["is_verified"] is False
    assert "id" in data

    # Verify user exists in database
    result = await db_session.execute(
        select(User).where(User.username == user_data["username"])
    )
    user = result.scalar_one_or_none()
    assert user is not None
    assert user.email == user_data["email"]


@pytest.mark.asyncio
async def test_register_duplicate_username(client: AsyncClient, db_session: AsyncSession):
    """Test registration with duplicate username"""
    # Create a user first
    await auth_manager.create_user(
        db_session,
        username="existinguser",
        email="existing@example.com",
        password="Password123"
    )

    # Try to register with same username
    user_data = {
        "username": "existinguser",  # Same username
        "email": "different@example.com",
        "password": "Password123",
        "full_name": "Different User"
    }

    response = await client.post("/v1/users/register", json=user_data)

    assert response.status_code == 400
    data = response.json()
    assert "Username already registered" in data["detail"]


@pytest.mark.asyncio
async def test_register_duplicate_email(client: AsyncClient, db_session: AsyncSession):
    """Test registration with duplicate email"""
    # Create a user first
    await auth_manager.create_user(
        db_session,
        username="emailuser",
        email="emailuser@example.com",
        password="Password123"
    )

    # Try to register with same email
    user_data = {
        "username": "differentuser",
        "email": "emailuser@example.com",  # Same email
        "password": "Password123",
        "full_name": "Different User"
    }

    response = await client.post("/v1/users/register", json=user_data)

    assert response.status_code == 400
    data = response.json()
    assert "Email already registered" in data["detail"]


@pytest.mark.asyncio
async def test_login_success(client: AsyncClient, db_session: AsyncSession):
    """Test successful login"""
    # Create a user first
    await auth_manager.create_user(
        db_session,
        username="loginuser",
        email="login@example.com",
        password="loginPassword123"
    )

    login_data = {
        "username": "loginuser",
        "password": "loginPassword123"
    }

    response = await client.post("/v1/users/login", data=login_data)

    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


@pytest.mark.asyncio
async def test_login_wrong_password(client: AsyncClient, db_session: AsyncSession):
    """Test login with wrong password"""
    # Create a user first
    await auth_manager.create_user(
        db_session,
        username="wrongpassuser",
        email="wrongpass@example.com",
        password="correctPassword123"
    )

    login_data = {
        "username": "wrongpassuser",
        "password": "wrongPassword123"  # Wrong password
    }

    response = await client.post("/v1/users/login", data=login_data)

    assert response.status_code == 401
    data = response.json()
    assert "Incorrect username or password" in data["detail"]


@pytest.mark.asyncio
async def test_login_nonexistent_user(client: AsyncClient):
    """Test login with non-existent user"""
    login_data = {
        "username": "nonexistent",
        "password": "Password123"
    }

    response = await client.post("/v1/users/login", data=login_data)

    assert response.status_code == 401
    data = response.json()
    assert "Incorrect username or password" in data["detail"]


@pytest.mark.asyncio
async def test_get_current_user(client: AsyncClient, db_session: AsyncSession):
    """Test getting current user info"""
    # Create and login a user
    user = await auth_manager.create_user(
        db_session,
        username="currentuser",
        email="current@example.com",
        password="currentPassword123"
    )

    login_data = {
        "username": "currentuser",
        "password": "currentPassword123"
    }

    login_response = await client.post("/v1/users/login", data=login_data)
    token = login_response.json()["access_token"]

    # Get current user info
    response = await client.get(
        "/v1/users/me",
        headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 200
    data = response.json()
    assert data["username"] == user.username
    assert data["email"] == user.email
    assert data["id"] == str(user.id)


@pytest.mark.asyncio
async def test_get_current_user_invalid_token(client: AsyncClient):
    """Test getting current user with invalid token"""
    response = await client.get(
        "/v1/users/me",
        headers={"Authorization": "Bearer invalid_token"}
    )

    assert response.status_code == 401
    data = response.json()
    assert "Could not validate credentials" in data["detail"]


@pytest.mark.asyncio
async def test_get_current_user_no_token(client: AsyncClient):
    """Test getting current user without token"""
    response = await client.get("/v1/users/me")

    assert response.status_code == 403


@pytest.mark.asyncio
async def test_get_users_admin_only(client: AsyncClient, db_session: AsyncSession):
    """Test that only admins can get all users"""
    # Create regular user
    regular_user = await auth_manager.create_user(
        db_session,
        username="regular",
        email="regular@example.com",
        password="regularPassword123"
    )

    # Create admin user
    admin_user = await auth_manager.create_user(
        db_session,
        username="admin",
        email="admin@example.com",
        password="adminPassword123"
    )
    admin_user.role = UserRole.ADMIN
    await db_session.commit()

    # Login as regular user
    regular_login_data = {
        "username": "regular",
        "password": "regularPassword123"
    }
    regular_login_response = await client.post("/v1/users/login", data=regular_login_data)
    regular_token = regular_login_response.json()["access_token"]

    # Try to get users as regular user (should fail)
    response = await client.get(
        "/v1/users",
        headers={"Authorization": f"Bearer {regular_token}"}
    )
    assert response.status_code == 403

    # Login as admin user
    admin_login_data = {
        "username": "admin",
        "password": "adminPassword123"
    }
    admin_login_response = await client.post("/v1/users/login", data=admin_login_data)
    admin_token = admin_login_response.json()["access_token"]

    # Try to get users as admin user (should succeed)
    response = await client.get(
        "/v1/users",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 2  # Should have at least the two users we created