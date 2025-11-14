#!/usr/bin/env python3
"""
Test script for AI agent creation to debug the failure.
"""

import requests
import json
import os
import sys

# Test configuration
BASE_URL = "http://localhost:8000/api"
TEST_CONFIG = {
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

def test_agent_creation():
    """Test the AI agent creation endpoint."""
    
    # You would need a valid auth token for this test
    # For now, just print the payload that would be sent
    print("Test payload that would be sent:")
    print(json.dumps(TEST_CONFIG, indent=2))
    
    print("\nExpected API endpoint:")
    print(f"{BASE_URL}/v1/ai/configurations")
    
    print("\nTo test manually:")
    print("1. Start the API server")
    print("2. Get an auth token from the frontend")
    print("3. Make a POST request with the payload above")
    
    # If you have a token, uncomment below:
    """
    headers = {
        "Authorization": f"Bearer {AUTH_TOKEN}",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/v1/ai/configurations",
            json=TEST_CONFIG,
            headers=headers
        )
        
        print(f"Response status: {response.status_code}")
        print(f"Response body: {response.text}")
        
        if response.status_code == 201:
            print("✅ Agent created successfully!")
            return response.json()
        else:
            print("❌ Agent creation failed")
            return None
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return None
    """

if __name__ == "__main__":
    test_agent_creation()
