from typing import Dict, List, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete
from .models import User, UserRole
from .database import get_db


class RBACManager:
    def __init__(self):
        # Define default roles and their permissions
        self.default_roles = {
            "guest": {
                "description": "Read-only access",
                "permissions": {
                    "read_blocks": True,
                    "read_paths": True,
                    "create_suggestions": True,
                    "edit_own_suggestions": True
                }
            },
            "builder": {
                "description": "Can create and edit content",
                "permissions": {
                    "read_blocks": True,
                    "read_paths": True,
                    "create_blocks": True,
                    "edit_own_blocks": True,
                    "create_paths": True,
                    "edit_own_paths": True,
                    "create_suggestions": True,
                    "edit_own_suggestions": True,
                    "delete_own_blocks": True,
                    "delete_own_paths": True
                }
            },
            "trusted_builder": {
                "description": "Experienced builder with additional privileges",
                "permissions": {
                    "read_blocks": True,
                    "read_paths": True,
                    "create_blocks": True,
                    "edit_own_blocks": True,
                    "edit_others_blocks": True,
                    "create_paths": True,
                    "edit_own_paths": True,
                    "create_suggestions": True,
                    "edit_own_suggestions": True,
                    "edit_others_suggestions": True,
                    "delete_own_blocks": True,
                    "delete_own_paths": True,
                    "publish_content": True
                }
            },
            "moderator": {
                "description": "Can review and moderate content",
                "permissions": {
                    "read_blocks": True,
                    "read_paths": True,
                    "create_blocks": True,
                    "edit_any_blocks": True,
                    "create_paths": True,
                    "edit_any_paths": True,
                    "create_suggestions": True,
                    "edit_any_suggestions": True,
                    "review_suggestions": True,
                    "delete_any_blocks": True,
                    "delete_any_paths": True,
                    "publish_content": True,
                    "lock_content": True,
                    "manage_flags": True
                }
            },
            "admin": {
                "description": "Full system access",
                "permissions": {
                    "*": True  # All permissions
                }
            }
        }

    async def initialize_default_roles(self, db: AsyncSession) -> None:
        """No-op initializer kept for compatibility with startup hooks.
        In this codebase, roles are static and stored in memory.
        """
        return None

    async def get_user_permissions(self, db: AsyncSession, user: User) -> Dict[str, Any]:
        """Get all permissions for a user based on their role"""
        if user.role == UserRole.ADMIN:
            return {"*": True}

        # Get permissions for user's role
        role_permissions = self.default_roles.get(user.role.value, {}).get("permissions", {})
        return role_permissions.copy()

    def check_permission(self, db: AsyncSession, user: User, permission: str) -> bool:
        """Check if user has a specific permission"""
        if user.role == UserRole.ADMIN:
            return True

        permissions = self.default_roles.get(user.role.value, {}).get("permissions", {})
        return permissions.get(permission, False)

    async def assign_role(self, db: AsyncSession, user: User, role_name: str) -> bool:
        """Assign a role to a user"""
        try:
            # Convert string to UserRole enum
            new_role = UserRole(role_name)
            user.role = new_role
            await db.commit()
            return True
        except ValueError:
            return False

    async def remove_role(self, db: AsyncSession, user: User, role_name: str) -> bool:
        """Remove a role from a user - not applicable with single role model"""
        # In single role model, we don't remove roles, just change them
        return False

    async def get_user_roles(self, db: AsyncSession, user: User) -> List[str]:
        """Get all role names for a user"""
        return [user.role.value]


# Global RBAC manager instance
rbac_manager = RBACManager()
