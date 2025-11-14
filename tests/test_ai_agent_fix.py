#!/usr/bin/env python3
"""
Test script to verify AI agent implementation fixes.
"""
import sys
import os

# Add the API directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'apps', 'api'))

def test_model_imports():
    """Test that all models can be imported."""
    print("Testing model imports...")
    try:
        from src.models import User
        from src.ai_config_models import AIConfiguration, AIJob, AIBlockSuggestion
        from src.ai_config_models import AIProvider, AIAgentType, AIJobStatus
        print("✓ All models imported successfully")
        return True
    except Exception as e:
        print(f"✗ Model import failed: {e}")
        return False


def test_user_relationships():
    """Test that User model has AI relationships."""
    print("\nTesting User model relationships...")
    try:
        from src.models import User
        import inspect
        
        # Check if User has the ai_configurations and ai_jobs attributes
        user_attrs = dir(User)
        
        if 'ai_configurations' not in user_attrs:
            print("✗ User model missing 'ai_configurations' relationship")
            return False
        
        if 'ai_jobs' not in user_attrs:
            print("✗ User model missing 'ai_jobs' relationship")
            return False
        
        # Check that User doesn't have content-related methods
        content_methods = ['set_blocknote_content', 'get_blocknote_content', 
                          'get_blocknote_blocks', 'get_plain_text']
        has_content_methods = [m for m in content_methods if m in user_attrs]
        
        if has_content_methods:
            print(f"✗ User model has incorrect content methods: {has_content_methods}")
            return False
        
        print("✓ User model has correct relationships")
        print("  - ai_configurations relationship exists")
        print("  - ai_jobs relationship exists")
        print("  - No incorrect content methods")
        return True
    except Exception as e:
        print(f"✗ User relationship test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_router_imports():
    """Test that AI router can be imported."""
    print("\nTesting AI router imports...")
    try:
        from src.routers.ai_config import router
        print("✓ AI config router imported successfully")
        return True
    except Exception as e:
        print(f"✗ Router import failed: {e}")
        return False


def test_ai_provider_factory():
    """Test AI provider factory function."""
    print("\nTesting AI provider factory...")
    try:
        from src.services.ai_providers import create_ai_provider, OpenAIProvider, AnthropicProvider, CustomProvider
        
        # Test that factory function exists
        print("✓ AI provider factory function exists")
        print("  - OpenAIProvider available")
        print("  - AnthropicProvider available")
        print("  - CustomProvider (OpenAI compatible) available")
        return True
    except Exception as e:
        print(f"✗ AI provider test failed: {e}")
        return False


def test_database_schema():
    """Test that database has AI tables."""
    print("\nTesting database schema...")
    try:
        import sqlite3
        db_path = os.path.join(os.path.dirname(__file__), 'apps', 'api', 'notimetolie.db')
        
        if not os.path.exists(db_path):
            print(f"✗ Database not found at {db_path}")
            return False
        
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check for AI tables
        cursor.execute("""
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name IN ('ai_configurations', 'ai_jobs', 'ai_block_suggestions')
            ORDER BY name
        """)
        tables = cursor.fetchall()
        
        expected_tables = ['ai_block_suggestions', 'ai_configurations', 'ai_jobs']
        found_tables = [t[0] for t in tables]
        
        if set(found_tables) != set(expected_tables):
            print(f"✗ Missing AI tables. Expected: {expected_tables}, Found: {found_tables}")
            conn.close()
            return False
        
        # Check ai_configurations has mcp_capable column
        cursor.execute("PRAGMA table_info(ai_configurations)")
        columns = cursor.fetchall()
        column_names = [col[1] for col in columns]
        
        required_columns = ['id', 'user_id', 'name', 'provider', 'agent_type', 
                           'model_name', 'mcp_enabled', 'mcp_capable']
        
        missing_columns = [col for col in required_columns if col not in column_names]
        if missing_columns:
            print(f"✗ Missing columns in ai_configurations: {missing_columns}")
            conn.close()
            return False
        
        conn.close()
        
        print("✓ Database schema is correct")
        print(f"  - All AI tables exist: {', '.join(found_tables)}")
        print(f"  - ai_configurations has all required columns including mcp_capable")
        return True
    except Exception as e:
        print(f"✗ Database schema test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_pydantic_schemas():
    """Test that Pydantic schemas are valid."""
    print("\nTesting Pydantic schemas...")
    try:
        from src.routers.ai_config import (
            AIConfigCreate, AIConfigPublic, AIJobCreate, 
            AIJobPublic, AIBlockSuggestionPublic
        )
        
        # Test creating a sample config
        sample_config = {
            "name": "Test Agent",
            "provider": "openai",
            "agent_type": "content_creator",
            "model_name": "gpt-4",
            "temperature": 0.7,
            "max_tokens": 2000,
            "mcp_enabled": True,
            "mcp_capable": False
        }
        
        config = AIConfigCreate(**sample_config)
        
        print("✓ Pydantic schemas are valid")
        print(f"  - Successfully created AIConfigCreate with sample data")
        return True
    except Exception as e:
        print(f"✗ Pydantic schema test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def main():
    """Run all tests."""
    print("=" * 60)
    print("AI Agent Implementation Verification")
    print("=" * 60)
    
    tests = [
        test_model_imports,
        test_user_relationships,
        test_router_imports,
        test_ai_provider_factory,
        test_database_schema,
        test_pydantic_schemas,
    ]
    
    results = []
    for test in tests:
        result = test()
        results.append(result)
    
    print("\n" + "=" * 60)
    print("Summary")
    print("=" * 60)
    
    passed = sum(results)
    total = len(results)
    
    if passed == total:
        print(f"✅ All {total} tests passed!")
        print("\nThe AI agent implementation is working correctly:")
        print("  • User model has correct relationships")
        print("  • Database schema is correct")
        print("  • All imports work properly")
        print("  • Pydantic schemas are valid")
        return 0
    else:
        print(f"❌ {total - passed} out of {total} tests failed")
        print("\nPlease review the errors above.")
        return 1


if __name__ == "__main__":
    sys.exit(main())
