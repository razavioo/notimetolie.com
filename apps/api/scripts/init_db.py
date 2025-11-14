"""Initialize database with all tables."""
import asyncio
import sys
sys.path.insert(0, '/Users/emad/IdeaProjects/notimetolie.com/apps/api')

from src.database import engine, Base
from src import models
from src import ai_config_models


async def init_database():
    """Create all tables."""
    print("Creating all database tables...")
    
    async with engine.begin() as conn:
        # Drop all tables (optional - comment out to keep existing data)
        # await conn.run_sync(Base.metadata.drop_all)
        
        # Create all tables
        await conn.run_sync(Base.metadata.create_all)
    
    print("✅ Database initialized successfully!")
    
    # List all tables
    from sqlalchemy import inspect
    
    def get_tables(conn):
        inspector = inspect(conn)
        return inspector.get_table_names()
    
    async with engine.connect() as conn:
        tables = await conn.run_sync(get_tables)
        print(f"\nCreated {len(tables)} tables:")
        for table in sorted(tables):
            print(f"  - {table}")


if __name__ == "__main__":
    asyncio.run(init_database())
