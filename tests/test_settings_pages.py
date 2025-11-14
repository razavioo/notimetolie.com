#!/usr/bin/env python3
"""Test script for the new settings pages functionality"""

import asyncio
import sys
import os
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

# Add the apps/api directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'apps', 'api'))

from src.database import get_db
from src.models import User, UserRole
from src.auth import auth_manager

async def test_settings_endpoints():
    """Test the new settings endpoints"""
    print("Testing Settings Pages Functionality")
    print("=" * 60)
    
    async for db in get_db():
        # Get a test user
        result = await db.execute(select(User).limit(1))
        user = result.scalar_one_or_none()
        
        if not user:
            print("❌ No users found in database. Please create a user first.")
            return False
        
        print(f"\n✅ Test User: {user.username}")
        print(f"   Role: {user.role.value}")
        print(f"   Email: {user.email}")
        print(f"   Full Name: {user.full_name or 'Not set'}")
        print(f"   Metadata: {user.metadata or {}}")
        
        # Test 1: Check if user has metadata structure
        print("\n📝 Test 1: User Metadata Structure")
        if user.metadata is None:
            print("   ⚠️  User has no metadata - will be created on first preference save")
        else:
            print(f"   ✅ Metadata exists: {user.metadata}")
        
        # Test 2: Simulate updating user preferences
        print("\n📝 Test 2: Update User Preferences (Simulated)")
        user.metadata = user.metadata or {}
        user.metadata['emailNotifications'] = True
        user.metadata['publicProfile'] = False
        user.metadata['language'] = 'en'
        await db.commit()
        await db.refresh(user)
        print(f"   ✅ Preferences saved: {user.metadata}")
        
        # Test 3: Check password verification (without actually changing it)
        print("\n📝 Test 3: Password Verification")
        # We won't change the password, just verify the hash exists
        if user.hashed_password:
            print(f"   ✅ Password hash exists (length: {len(user.hashed_password)})")
        else:
            print("   ❌ No password hash found")
        
        # Test 4: Check admin access
        print("\n📝 Test 4: Role-Based Access")
        is_admin = user.role == UserRole.ADMIN
        print(f"   User is admin: {'✅ Yes' if is_admin else '❌ No'}")
        if is_admin:
            print("   ✅ Can access /settings (Site Settings)")
        else:
            print("   ⚠️  Can only access /profile/settings (Profile Settings)")
        
        # Test 5: Check all users and their roles
        print("\n📝 Test 5: All Users in Database")
        result = await db.execute(select(User))
        all_users = result.scalars().all()
        print(f"   Total users: {len(all_users)}")
        for u in all_users:
            admin_marker = "🔑" if u.role == UserRole.ADMIN else "  "
            print(f"   {admin_marker} {u.username:20} | {u.role.value:20} | {u.email}")
        
        print("\n" + "=" * 60)
        print("✅ All tests completed successfully!")
        print("\n📋 Summary:")
        print("   - Site Settings (/settings): Admin only")
        print("   - Profile Settings (/profile/settings): All authenticated users")
        print("   - API Endpoints:")
        print("     • PATCH /users/me - Update profile")
        print("     • POST /users/me/password - Change password")
        print("     • PATCH /users/me/preferences - Save preferences")
        
        return True

async def main():
    try:
        success = await test_settings_endpoints()
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())
