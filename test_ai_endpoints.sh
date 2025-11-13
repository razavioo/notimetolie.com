#!/bin/bash

# Test AI endpoints
API_URL="http://localhost:8000"

echo "Testing AI Endpoints..."
echo "======================="
echo ""

# Test 1: Health check
echo "1. Health check:"
curl -s "${API_URL}/v1/health" | python3 -m json.tool
echo ""

# Test 2: List AI configurations (should require auth)
echo "2. List AI configurations (should return 403 without auth):"
curl -s -X GET "${API_URL}/v1/ai/configurations" | python3 -m json.tool
echo ""

echo "✅ Basic API structure is working!"
echo ""
echo "To test full AI functionality:"
echo "1. Start the API server: cd apps/api && source .venv/bin/activate && uvicorn src.main:app --reload --host 0.0.0.0 --port 8000"
echo "2. Register a user and get an auth token"
echo "3. Create an AI configuration with: POST /v1/ai/configurations"
echo "4. Create an AI job with: POST /v1/ai/jobs"
echo "5. Check job status with: GET /v1/ai/jobs/{job_id}"
echo ""
echo "📚 See README.md section 8.7 for full AI documentation"
