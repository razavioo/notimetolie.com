"""Create admin-creator AI configuration."""
import asyncio
import sys
import uuid
sys.path.insert(0, '/Users/emad/IdeaProjects/notimetolie.com/apps/api')

from sqlalchemy import select
from src.database import AsyncSessionLocal
from src.models import User, UserRole
from src.ai_config_models import AIConfiguration
from src.utils.encryption import encrypt_api_key


async def create_admin_ai():
    """Create or update admin-creator AI configuration."""
    
    async with AsyncSessionLocal() as session:
        # Get admin user or create one
        result = await session.execute(
            select(User).where(User.email == "admin@example.com")
        )
        admin_user = result.scalar_one_or_none()
        
        if not admin_user:
            print("Creating admin user...")
            admin_user = User(
                id=str(uuid.uuid4()),
                email="admin@example.com",
                username="admin",
                hashed_password="not-set",
                role=UserRole.ADMIN,
                is_verified=True
            )
            session.add(admin_user)
            await session.commit()
            print(f"✅ Created admin user: {admin_user.email} (ID: {admin_user.id})")
        
        # Check for existing admin-creator
        result = await session.execute(
            select(AIConfiguration).where(
                AIConfiguration.user_id == admin_user.id,
                AIConfiguration.name == "admin-creator"
            )
        )
        existing_config = result.scalar_one_or_none()
        
        if existing_config:
            print(f"✅ admin-creator already exists (ID: {existing_config.id})")
            print(f"   Provider: {existing_config.provider}")
            print(f"   Model: {existing_config.model_name}")
            print(f"   Has API Key: {bool(existing_config.api_key_encrypted)}")
            return existing_config
        
        # Create admin-creator AI configuration
        print("\nCreating admin-creator AI configuration...")
        
        # Use your OpenRouter API key
        api_key = "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"
        encrypted_key = encrypt_api_key(api_key)
        
        ai_config = AIConfiguration(
            id=str(uuid.uuid4()),
            user_id=admin_user.id,
            name="admin-creator",
            description="Admin's content creator using OpenRouter",
            provider="openrouter",
            agent_type="content_creator",
            model_name="kat-ai/kat-coder-pro-v1:free",
            api_key_encrypted=encrypted_key,
            system_prompt="""You are a knowledge block creator for a living knowledge infrastructure.
Your task is to create concise, accurate, and well-structured knowledge blocks.

When creating content:
1. Make it clear and easy to understand
2. Use practical examples
3. Organize information logically
4. Be accurate and cite sources when needed
5. Make it actionable - help learners apply the knowledge

Format your response as JSON with this structure:
{
    "title": "Clear, descriptive title",
    "content": "Well-structured markdown content with examples",
    "tags": ["tag1", "tag2", "tag3"],
    "difficulty": "beginner|intermediate|advanced",
    "summary": "Brief 1-2 sentence summary"
}""",
            temperature={"value": 0.7},
            max_tokens={"value": 2000},
            can_use_mcp=False,
            can_create_blocks=True,
            can_create_paths=True,
            can_edit_blocks=False,
            can_search_web=False,
            daily_request_limit=100
        )
        
        session.add(ai_config)
        await session.commit()
        await session.refresh(ai_config)
        
        print(f"✅ Created admin-creator AI configuration!")
        print(f"   ID: {ai_config.id}")
        print(f"   Name: {ai_config.name}")
        print(f"   Provider: {ai_config.provider}")
        print(f"   Model: {ai_config.model_name}")
        print(f"   User: {admin_user.email}")
        
        return ai_config


if __name__ == "__main__":
    config = asyncio.run(create_admin_ai())
