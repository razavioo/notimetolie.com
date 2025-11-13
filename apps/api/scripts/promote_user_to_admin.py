"""
Script to promote a user to admin role.
Usage: python scripts/promote_user_to_admin.py <username_or_email>
"""
import asyncio
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select
from src.models import User, UserRole
from src.config import settings


async def promote_user_to_admin(identifier: str):
    """Promote a user to admin role by username or email."""
    
    # Create engine
    engine = create_async_engine(settings.database_url, echo=True)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        # Try to find user by username
        result = await session.execute(
            select(User).where(User.username == identifier)
        )
        user = result.scalar_one_or_none()
        
        # If not found, try by email
        if not user:
            result = await session.execute(
                select(User).where(User.email == identifier)
            )
            user = result.scalar_one_or_none()
        
        if not user:
            print(f"❌ User not found: {identifier}")
            print("Please provide a valid username or email.")
            return False
        
        # Check if already admin
        if user.role == UserRole.ADMIN:
            print(f"✓ User '{user.username}' is already an admin!")
            return True
        
        # Promote to admin
        old_role = user.role.value
        user.role = UserRole.ADMIN
        await session.commit()
        
        print(f"✅ Successfully promoted user '{user.username}' ({user.email})")
        print(f"   Role: {old_role} → admin")
        print(f"\n🎉 {user.username} now has full admin access!")
        return True


async def list_all_users():
    """List all users and their roles."""
    engine = create_async_engine(settings.database_url, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        result = await session.execute(select(User))
        users = result.scalars().all()
        
        if not users:
            print("No users found in database.")
            return
        
        print("\n📋 All Users:")
        print("-" * 80)
        print(f"{'Username':<20} {'Email':<30} {'Role':<15} {'Active':<10}")
        print("-" * 80)
        
        for user in users:
            is_active = "✓" if user.is_active else "✗"
            print(f"{user.username:<20} {user.email:<30} {user.role.value:<15} {is_active:<10}")
        
        print("-" * 80)
        print(f"Total: {len(users)} users\n")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python scripts/promote_user_to_admin.py <username_or_email>")
        print("   or: python scripts/promote_user_to_admin.py --list")
        print("\nExample:")
        print("  python scripts/promote_user_to_admin.py testuser")
        print("  python scripts/promote_user_to_admin.py admin@example.com")
        print("  python scripts/promote_user_to_admin.py --list")
        sys.exit(1)
    
    identifier = sys.argv[1]
    
    if identifier == "--list":
        asyncio.run(list_all_users())
    else:
        asyncio.run(promote_user_to_admin(identifier))
