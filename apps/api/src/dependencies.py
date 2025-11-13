from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from .database import get_db
from .auth import jwt_manager, auth_manager
from .rbac import rbac_manager
from .models import User, UserRole
from sqlalchemy import select

# Allow query tokens during tests to simplify auth on AsyncClient
security = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    # Verify token
    if not credentials or not credentials.credentials:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN)

    token_data = jwt_manager.verify_token(credentials.credentials)
    if token_data is None:
        raise credentials_exception

    # Extract username from token
    username: str = token_data.get("sub")
    if username is None:
        raise credentials_exception

    # Get user from database
    user = await auth_manager.get_user_by_username(db, username=username)
    if user is None:
        raise credentials_exception

    return user


async def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    return current_user


async def get_current_verified_user(current_user: User = Depends(get_current_user)) -> User:
    if not current_user.is_verified:
        raise HTTPException(status_code=400, detail="Email not verified")
    return current_user


async def get_current_user_optional(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> User | None:
    """Get current user if authenticated, otherwise return None."""
    if not credentials or not credentials.credentials:
        return None
    
    token_data = jwt_manager.verify_token(credentials.credentials)
    if token_data is None:
        return None
    
    username: str = token_data.get("sub")
    if username is None:
        return None
    
    user = await auth_manager.get_user_by_username(db, username=username)
    return user


def require_role(required_role: str):
    def role_checker(current_user: User = Depends(get_current_active_user)):
        try:
            role_enum = UserRole(required_role)
            if current_user.role != role_enum:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Insufficient permissions"
                )
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid role specified"
            )
        return current_user
    return role_checker


def require_min_level(min_level: int):
    def level_checker(current_user: User = Depends(get_current_active_user)):
        if current_user.level < min_level:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient level"
            )
        return current_user
    return level_checker


def require_permission(permission: str):
    async def permission_checker(
        current_user: User = Depends(get_current_active_user),
        db: AsyncSession = Depends(get_db)
    ):
        # Check if user has the required permission
        has_permission = rbac_manager.check_permission(db, current_user, permission)
        if not has_permission:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions"
            )
        return current_user
    return permission_checker
