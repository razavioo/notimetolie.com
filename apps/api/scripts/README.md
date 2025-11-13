# Admin Scripts

Utility scripts for managing the No Time To Lie platform.

## Promote User to Admin

Elevate a user's role to admin, granting them full permissions across the platform.

### Usage

```bash
# From the project root
python apps/api/scripts/promote_user_to_admin.py <username_or_email>

# Or list all users
python apps/api/scripts/promote_user_to_admin.py --list
```

### Examples

```bash
# Promote by username
python apps/api/scripts/promote_user_to_admin.py testuser

# Promote by email
python apps/api/scripts/promote_user_to_admin.py user@example.com

# List all users and their roles
python apps/api/scripts/promote_user_to_admin.py --list
```

### User Roles

The platform has 5 roles with increasing permissions:

1. **guest** - Read-only access
2. **builder** - Can create and edit own content
3. **trusted_builder** - Can edit others' content
4. **moderator** - Can moderate and manage content
5. **admin** - Full system access (all permissions)

### Permissions by Role

#### Guest
- Read blocks and paths
- Create suggestions
- Edit own suggestions

#### Builder (Default)
- All guest permissions, plus:
- Create blocks and paths
- Edit own blocks and paths
- Delete own blocks and paths

#### Trusted Builder
- All builder permissions, plus:
- Edit others' blocks
- Edit others' suggestions
- Publish content

#### Moderator
- All trusted builder permissions, plus:
- Edit any blocks and paths
- Review suggestions
- Delete any blocks and paths
- Lock content
- Manage flags

#### Admin
- All permissions
- User management
- System configuration
- AI agent configuration

### After Promotion

Once promoted to admin, the user can:
- Access the moderation dashboard at `/moderation`
- Configure AI agents at `/ai-config`
- Manage all users and content
- Review and approve/reject suggestions
- Lock and unlock content

### Troubleshooting

**Error: User not found**
- Check the username/email spelling
- Use `--list` to see all users
- Make sure the user has registered

**Error: Database connection**
- Check that the database file exists
- Ensure DATABASE_URL is set correctly in .env
- Make sure you're running from the project root

### Security Note

Admin privileges should be granted carefully as they provide full system access. Only promote trusted users to admin role.
