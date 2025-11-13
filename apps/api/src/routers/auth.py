"""OAuth authentication endpoints"""
from datetime import timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
import uuid
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

from ..database import get_db
from ..auth import auth_manager, jwt_manager
from ..models import User, UserRole
from ..config import settings

router = APIRouter(prefix="/auth")


class GoogleAuthRequest(BaseModel):
    token: str


class GoogleAuthResponse(BaseModel):
    access_token: str
    token_type: str
    is_new_user: bool


@router.post("/google", response_model=GoogleAuthResponse)
async def google_auth(
    auth_data: GoogleAuthRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Authenticate with Google OAuth.
    
    Frontend should use Google Sign-In to get an ID token,
    then send it here to get our application access token.
    """
    if not settings.google_client_id:
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Google authentication is not configured"
        )
    
    try:
        # Verify the Google ID token
        idinfo = id_token.verify_oauth2_token(
            auth_data.token,
            google_requests.Request(),
            settings.google_client_id
        )
        
        # Extract user information
        google_id = idinfo['sub']
        email = idinfo.get('email')
        email_verified = idinfo.get('email_verified', False)
        name = idinfo.get('name', '')
        
        if not email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email not provided by Google"
            )
        
        # Check if user exists
        user = await auth_manager.get_user_by_email(db, email)
        is_new_user = False
        
        if not user:
            # Create new user with Google OAuth
            is_new_user = True
            # Generate username from email
            username = email.split('@')[0]
            # Ensure username is unique
            base_username = username
            counter = 1
            while await auth_manager.get_user_by_username(db, username):
                username = f"{base_username}{counter}"
                counter += 1
            
            # Create user without password (OAuth only)
            user = User(
                id=uuid.uuid4(),
                username=username,
                email=email,
                full_name=name,
                hashed_password="",  # No password for OAuth users
                role=UserRole.USER,
                is_verified=email_verified,  # Trust Google's verification
                is_active=True,
                xp=0,
                level=1,
            )
            db.add(user)
            await db.commit()
            await db.refresh(user)
        else:
            # Update user verification status if Google says it's verified
            if email_verified and not user.is_verified:
                user.is_verified = True
                await db.commit()
        
        # Create access token
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
        
        return GoogleAuthResponse(
            access_token=access_token,
            token_type="bearer",
            is_new_user=is_new_user
        )
    
    except ValueError as e:
        # Invalid token
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid Google token: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Authentication failed: {str(e)}"
        )
