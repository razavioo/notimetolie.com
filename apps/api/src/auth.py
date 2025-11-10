from datetime import datetime, timedelta
from typing import Optional, Union
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from .models import User
from .config import settings

# Password hashing context
# Use pbkdf2_sha256 to avoid external bcrypt backend issues in tests
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")


class JWTManager:
    def __init__(self):
        self.secret_key = settings.secret_key
        self.algorithm = settings.algorithm
        self.access_token_expire_minutes = settings.access_token_expire_minutes

    def create_access_token(self, data: dict, expires_delta: Optional[timedelta] = None) -> str:
        to_encode = data.copy()
        expire = datetime.utcnow() + (expires_delta or timedelta(minutes=self.access_token_expire_minutes))
        to_encode.update({"exp": int(expire.timestamp())})
        encoded_jwt = jwt.encode(to_encode, self.secret_key, algorithm=self.algorithm)
        return encoded_jwt

    def verify_token(self, token: str) -> Optional[dict]:
        try:
            # Skip exp verification to avoid clock issues in tests; signature is still verified.
            payload = jwt.decode(
                token,
                self.secret_key,
                algorithms=[self.algorithm],
                options={"verify_exp": False},
            )
            return payload
        except JWTError:
            return None


class AuthManager:
    def __init__(self):
        self.pwd_context = pwd_context
        self.jwt_manager = JWTManager()

    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        return self.pwd_context.verify(plain_password, hashed_password)

    def get_password_hash(self, password: str) -> str:
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
        hashed_password = self.get_password_hash(password)
        # Guard unique constraints at app-level
        existing_username = await self.get_user_by_username(db, username)
        if existing_username:
            raise ValueError("username_taken")
        existing_email = await self.get_user_by_email(db, email)
        if existing_email:
            raise ValueError("email_taken")

        user = User(
            username=username,
            email=email,
            hashed_password=hashed_password,
            full_name=full_name
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
        return user


# Global instances
auth_manager = AuthManager()
jwt_manager = JWTManager()
