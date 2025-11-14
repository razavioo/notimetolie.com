from datetime import datetime, timedelta, timezone
from typing import Optional, Union
import secrets
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from .models import User
from .config import settings
import logging

logger = logging.getLogger(__name__)

# Use bcrypt for production, pbkdf2 only for legacy support
pwd_context = CryptContext(
    schemes=["bcrypt", "pbkdf2_sha256"],
    deprecated="auto",
    bcrypt__rounds=12  # Strong hashing
)


class JWTManager:
    def __init__(self):
        self.secret_key = settings.secret_key
        self.algorithm = settings.algorithm
        self.access_token_expire_minutes = settings.access_token_expire_minutes

    def create_access_token(self, data: dict, expires_delta: Optional[timedelta] = None) -> str:
        """Create JWT access token with proper expiration and security claims"""
        to_encode = data.copy()
        now = datetime.now(timezone.utc)
        expire = now + (expires_delta or timedelta(minutes=self.access_token_expire_minutes))
        
        # Add standard JWT claims
        to_encode.update({
            "exp": expire,
            "iat": now,  # Issued at
            "jti": secrets.token_urlsafe(16),  # JWT ID for tracking/revocation
        })
        
        encoded_jwt = jwt.encode(to_encode, self.secret_key, algorithm=self.algorithm)
        return encoded_jwt

    def verify_token(self, token: str, verify_exp: bool = True) -> Optional[dict]:
        """Verify JWT token with proper expiration checking
        
        Args:
            token: JWT token string
            verify_exp: Whether to verify expiration (disable only in tests)
        """
        try:
            # In production, always verify expiration
            # Only skip in test environment to avoid clock sync issues
            should_verify_exp = verify_exp and settings.environment != "test"
            
            payload = jwt.decode(
                token,
                self.secret_key,
                algorithms=[self.algorithm],
                options={"verify_exp": should_verify_exp},
            )
            return payload
        except JWTError as e:
            logger.warning(f"JWT verification failed: {type(e).__name__}")
            return None


class AuthManager:
    def __init__(self):
        self.pwd_context = pwd_context
        self.jwt_manager = JWTManager()
        
        # Password requirements
        self.min_password_length = 8
        self.require_uppercase = True
        self.require_lowercase = True
        self.require_digit = True

    def validate_password_strength(self, password: str) -> tuple[bool, str]:
        """Validate password meets security requirements"""
        if len(password) < self.min_password_length:
            return False, f"Password must be at least {self.min_password_length} characters"
        
        if self.require_uppercase and not any(c.isupper() for c in password):
            return False, "Password must contain at least one uppercase letter"
        
        if self.require_lowercase and not any(c.islower() for c in password):
            return False, "Password must contain at least one lowercase letter"
        
        if self.require_digit and not any(c.isdigit() for c in password):
            return False, "Password must contain at least one digit"
        
        # Check for common weak passwords
        common_passwords = {"password", "12345678", "password123", "admin123"}
        if password.lower() in common_passwords:
            return False, "Password is too common, please choose a stronger password"
        
        return True, ""

    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """Verify password against hash with timing attack protection"""
        return self.pwd_context.verify(plain_password, hashed_password)

    def get_password_hash(self, password: str) -> str:
        """Hash password with bcrypt"""
        return self.pwd_context.hash(password)

    async def authenticate_user(self, db: AsyncSession, username: str, password: str) -> Optional[User]:
        result = await db.execute(select(User).where(User.username == username))
        user = result.scalar_one_or_none()

        if not user:
            return None
        if not self.verify_password(password, user.hashed_password):
            return None
        return user

    async def get_user_by_username(self, db: AsyncSession, username: str) -> Optional[User]:
        result = await db.execute(select(User).where(User.username == username))
        return result.scalar_one_or_none()

    async def get_user_by_email(self, db: AsyncSession, email: str) -> Optional[User]:
        result = await db.execute(select(User).where(User.email == email))
        return result.scalar_one_or_none()

    async def create_user(self, db: AsyncSession, username: str, email: str, password: str, full_name: str = None) -> User:
        """Create new user with validation and secure password hashing"""
        
        # Validate password strength
        is_valid, error_msg = self.validate_password_strength(password)
        if not is_valid:
            raise ValueError(error_msg)
        
        # Validate username (alphanumeric, underscore, hyphen only)
        if not username or len(username) < 3:
            raise ValueError("Username must be at least 3 characters")
        if not all(c.isalnum() or c in ('_', '-') for c in username):
            raise ValueError("Username can only contain letters, numbers, underscore and hyphen")
        
        # Validate email format (basic check, more thorough check in Pydantic schema)
        if not email or '@' not in email:
            raise ValueError("Invalid email format")
        
        # Guard unique constraints at app-level
        existing_username = await self.get_user_by_username(db, username)
        if existing_username:
            raise ValueError("username_taken")
        existing_email = await self.get_user_by_email(db, email)
        if existing_email:
            raise ValueError("email_taken")

        hashed_password = self.get_password_hash(password)
        user = User(
            username=username,
            email=email,
            hashed_password=hashed_password,
            full_name=full_name
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
        
        logger.info(f"User created: {username} (email: {email})")
        return user


# Global instances
auth_manager = AuthManager()
jwt_manager = JWTManager()
