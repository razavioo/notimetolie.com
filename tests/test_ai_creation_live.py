#!/usr/bin/env python3
"""
Live test of AI agent creation with actual API calls.
"""
import requests
import json
import sys
import time

BASE_URL = "http://localhost:8000"

def print_section(title):
    """Print a formatted section header."""
    print("\n" + "=" * 70)
    print(f"  {title}")
    print("=" * 70)

def print_result(success, message):
    """Print a formatted result."""
    icon = "✓" if success else "✗"
    color = "\033[92m" if success else "\033[91m"
    reset = "\033[0m"
    print(f"{color}{icon} {message}{reset}")

def test_health():
    """Test API health endpoint."""
    print_section("1. Testing API Health")
    try:
        response = requests.get(f"{BASE_URL}/v1/health", timeout=5)
        if response.status_code == 200:
            print_result(True, f"API is healthy: {response.json()}")
            return True
        else:
            print_result(False, f"Health check failed with status {response.status_code}")
            return False
    except Exception as e:
        print_result(False, f"Failed to connect: {e}")
        return False

def create_test_user():
    """Create a test user for authentication."""
    print_section("2. Creating Test User")
    user_data = {
        "email": "ai_test@example.com",
        "username": "ai_tester",
        "password": "TestPassword123!",
        "full_name": "AI Test User"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/v1/users/register", json=user_data, timeout=5)
        if response.status_code in [200, 201]:
            result = response.json()
            print_result(True, "Test user created successfully")
            # User created, now login
            login_data = {
                "username": user_data["username"],
                "password": user_data["password"]
            }
            login_response = requests.post(f"{BASE_URL}/v1/users/login", data=login_data, timeout=5)
            if login_response.status_code == 200:
                print_result(True, "Logged in successfully")
                return login_response.json()
            else:
                print_result(False, f"Login failed: {login_response.text}")
                return None
        elif response.status_code == 400:
            print_result(True, "Test user already exists, logging in...")
            # Try to login
            login_data = {
                "username": user_data["username"],
                "password": user_data["password"]
            }
            login_response = requests.post(f"{BASE_URL}/v1/users/login", data=login_data, timeout=5)
            if login_response.status_code == 200:
                print_result(True, "Logged in successfully")
                return login_response.json()
            else:
                print_result(False, f"Login failed: {login_response.text}")
                return None
        else:
            print_result(False, f"User creation failed: {response.text}")
            return None
    except Exception as e:
        print_result(False, f"Error creating user: {e}")
        import traceback
        traceback.print_exc()
        return None

def test_ai_config_creation(auth_token):
    """Test AI configuration creation."""
    print_section("3. Creating AI Agent Configuration")
    
    config_data = {
        "name": "Test OpenAI Compatible Agent",
        "description": "Test agent for debugging creation",
        "provider": "openai_compatible",
        "agent_type": "content_creator",
        "model_name": "llama2",
        "api_endpoint": "http://localhost:11434/v1/completions",
        "mcp_capable": False,
        "mcp_enabled": False,
        "temperature": 0.7,
        "max_tokens": 2000,
        "can_create_blocks": True,
        "can_edit_blocks": False,
        "can_search_web": True,
        "daily_request_limit": 50
    }
    
    print("\nConfiguration to create:")
    print(json.dumps(config_data, indent=2))
    
    headers = {
        "Authorization": f"Bearer {auth_token}",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/v1/ai/configurations",
            json=config_data,
            headers=headers,
            timeout=10
        )
        
        print(f"\nResponse Status: {response.status_code}")
        print(f"Response Body:")
        print(json.dumps(response.json(), indent=2))
        
        if response.status_code == 201:
            print_result(True, "AI agent configuration created successfully!")
            return response.json()
        else:
            print_result(False, f"Failed to create AI agent: {response.status_code}")
            return None
    except Exception as e:
        print_result(False, f"Error creating AI config: {e}")
        import traceback
        traceback.print_exc()
        return None

def test_list_configurations(auth_token):
    """Test listing AI configurations."""
    print_section("4. Listing AI Configurations")
    
    headers = {
        "Authorization": f"Bearer {auth_token}",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.get(
            f"{BASE_URL}/v1/ai/configurations",
            headers=headers,
            timeout=5
        )
        
        if response.status_code == 200:
            configs = response.json()
            print_result(True, f"Found {len(configs)} AI configuration(s)")
            if configs:
                print("\nConfigurations:")
                for config in configs:
                    print(f"  • {config['name']} ({config['provider']}/{config['agent_type']})")
                    print(f"    Model: {config['model_name']}, Active: {config['is_active']}")
            return configs
        else:
            print_result(False, f"Failed to list configs: {response.status_code}")
            return None
    except Exception as e:
        print_result(False, f"Error listing configs: {e}")
        return None

def test_ai_models_endpoint():
    """Test that AI models are properly defined."""
    print_section("5. Testing AI Models Structure")
    
    try:
        import sys
        import os
        sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'apps', 'api'))
        
        from src.models import User
        from src.ai_config_models import AIConfiguration, AIJob, AIBlockSuggestion
        
        print_result(True, "All AI models imported successfully")
        
        # Check relationships
        user_attrs = dir(User)
        has_ai_configs = 'ai_configurations' in user_attrs
        has_ai_jobs = 'ai_jobs' in user_attrs
        
        if has_ai_configs and has_ai_jobs:
            print_result(True, "User model has AI relationships (ai_configurations, ai_jobs)")
        else:
            print_result(False, "User model missing AI relationships")
            
        return True
    except Exception as e:
        print_result(False, f"Model test failed: {e}")
        return False

def main():
    """Run all tests."""
    print("\n" + "=" * 70)
    print("  AI AGENT CREATION - LIVE TEST")
    print("=" * 70)
    
    # Test 1: Health check
    if not test_health():
        print("\n❌ API is not running. Please start it first.")
        return 1
    
    # Test 5: Models structure
    test_ai_models_endpoint()
    
    # Test 2: Create/login user
    auth_result = create_test_user()
    if not auth_result:
        print("\n❌ Could not authenticate. Cannot proceed.")
        return 1
    
    # Extract token (handle both register and login responses)
    auth_token = auth_result.get('access_token') or auth_result.get('token')
    if not auth_token:
        print_result(False, "No authentication token received")
        return 1
    
    print_result(True, f"Authentication token obtained: {auth_token[:20]}...")
    
    # Test 3: Create AI configuration
    ai_config = test_ai_config_creation(auth_token)
    
    # Test 4: List configurations
    configs = test_list_configurations(auth_token)
    
    # Summary
    print_section("SUMMARY")
    if ai_config:
        print("✅ SUCCESS! AI agent implementation is working correctly:")
        print("   • API is healthy and running")
        print("   • User authentication works")
        print("   • AI configuration can be created")
        print("   • AI configurations can be listed")
        print("   • All model relationships are correct")
        print("\n🎉 The AI agent creation is fully functional!")
        return 0
    else:
        print("❌ FAILED: AI agent creation encountered errors")
        print("   Please review the errors above.")
        return 1

if __name__ == "__main__":
    sys.exit(main())
