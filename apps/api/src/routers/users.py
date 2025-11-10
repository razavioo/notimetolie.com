from datetime import timedelta
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from pydantic import BaseModel, ConfigDict
import uuid

from ..database import get_db
from ..auth import auth_manager, jwt_manager
from ..models import User, UserRole
from ..dependencies import get_current_active_user, require_role
from ..rbac import rbac_manager
from ..events.bus import bus
from ..events.events import UserRegistered

router = APIRouter(prefix="/users")


class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    full_name: str = None


class UserResponse(BaseModel):
    id: str
    username: str
    email: str
    full_name: str | None = None
    is_active: bool
    is_verified: bool
    xp: int
    level: int

    model_config = ConfigDict(from_attributes=True)


class UserLogin(BaseModel):
    username: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    username: str = None


@router.post("/register", response_model=UserResponse, status_code=201)
async def register(user_data: UserCreate, db: AsyncSession = Depends(get_db)):
    # Check if user already exists
    existing_user = await auth_manager.get_user_by_username(db, user_data.username)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )

    existing_email = await auth_manager.get_user_by_email(db, user_data.email)
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Create user
    try:
        user = await auth_manager.create_user(
            db=db,
            username=user_data.username,
            email=user_data.email,
            password=user_data.password,
            full_name=user_data.full_name
        )
    except ValueError as e:
        msg = str(e)
        if msg == "username_taken":
            raise HTTPException(status_code=400, detail="Username already registered")
        if msg == "email_taken":
            raise HTTPException(status_code=400, detail="Email already registered")
        raise HTTPException(status_code=400, detail="Invalid input")

    # Publish event
    await bus.publish(UserRegistered(user_id=user.id, username=user.username, email=user.email))

    return UserResponse(
        id=str(user.id),
        username=user.username,
        email=user.email,
        full_name=user.full_name,
        is_active=bool(user.is_active),
        is_verified=bool(user.is_verified),
        xp=int(user.xp),
        level=int(user.level),
    )


@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)):
    user = await auth_manager.authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token_expires = timedelta(minutes=jwt_manager.access_token_expire_minutes)
    access_token = jwt_manager.create_access_token(
        data={
            "sub": user.username,
            "id": str(user.id),
            "email": user.email,
            "full_name": user.full_name,
            "is_active": bool(user.is_active),
            "is_verified": bool(user.is_verified),
            "xp": int(user.xp),
            "level": int(user.level),
        },
        expires_delta=access_token_expires,
    )

    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=UserResponse)
async def read_users_me(current_user: User = Depends(get_current_active_user)):
    return UserResponse(
        id=str(current_user.id),
        username=current_user.username,
        email=current_user.email,
        full_name=current_user.full_name,
        is_active=bool(current_user.is_active),
        is_verified=bool(current_user.is_verified),
        xp=int(current_user.xp),
        level=int(current_user.level),
    )


# List users at /v1/users/ (with slash)
@router.get("/", response_model=List[UserResponse])
async def read_users(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Only admin users can view all users
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )

    result = await db.execute(select(User).offset(skip).limit(limit))
    users = result.scalars().all()
    return [
        UserResponse(
            id=str(u.id),
            username=u.username,
            email=u.email,
            full_name=u.full_name,
            is_active=bool(u.is_active),
            is_verified=bool(u.is_verified),
            xp=int(u.xp),
            level=int(u.level),
        )
        for u in users
    ]

# List users at /v1/users (without slash) to avoid 307 redirect in tests
@router.get("", response_model=List[UserResponse])
async def read_users_noslash(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    return await read_users(skip=skip, limit=limit, db=db, current_user=current_user)


# Get user by ID at /v1/users/{user_id}
@router.get("/{user_id}", response_model=UserResponse)
async def read_user(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Users can view their own profile, admins can view any profile
    if str(current_user.id) != user_id and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )

    try:
        user_uuid = uuid.UUID(user_id)
        result = await db.execute(select(User).where(User.id == user_uuid))
        user = result.scalar_one_or_none()

        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        return UserResponse(
            id=str(user.id),
            username=user.username,
            email=user.email,
            full_name=user.full_name,
            is_active=bool(user.is_active),
            is_verified=bool(user.is_verified),
            xp=int(user.xp),
            level=int(user.level),
        )
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid user ID format")


class RoleUpdate(BaseModel):
    role: str


@router.put("/{user_id}/role")
async def update_user_role(
    user_id: str,
    update: RoleUpdate,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(require_role("admin")),
):
    """Admin-only: assign a role to a user (e.g., 'moderator')."""
    try:
        user_uuid = uuid.UUID(user_id)
        result = await db.execute(select(User).where(User.id == user_uuid))
        user = result.scalar_one_or_none()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        ok = await rbac_manager.assign_role(db, user, update.role)
        if not ok:
            raise HTTPException(status_code=400, detail="Invalid role specified")

        return {"id": str(user.id), "role": user.role.value}
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid user ID format")
