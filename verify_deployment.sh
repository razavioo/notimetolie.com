#!/bin/bash

# Deployment Verification Script
# Tests all critical features

echo "🔍 DEPLOYMENT VERIFICATION"
echo "=========================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

PASS=0
FAIL=0

test_endpoint() {
    local name="$1"
    local url="$2"
    local expected="$3"
    
    echo -n "Testing $name... "
    response=$(curl -s "$url" 2>&1)
    
    if echo "$response" | grep -q "$expected"; then
        echo -e "${GREEN}✓ PASS${NC}"
        ((PASS++))
    else
        echo -e "${RED}✗ FAIL${NC}"
        echo "  Expected: $expected"
        echo "  Got: $response"
        ((FAIL++))
    fi
}

# Test 1: API Health
test_endpoint "API Health" "http://localhost:8000/v1/health" '"status":"ok"'

# Test 2: Blocks List
test_endpoint "Blocks API" "http://localhost:8000/v1/blocks" '"slug"'

# Test 3: Search
test_endpoint "Search API" "http://localhost:8000/v1/search?q=started" '"hits"'

# Test 4: Web App
echo -n "Testing Web App... "
status_code=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000)
if [ "$status_code" = "200" ]; then
    echo -e "${GREEN}✓ PASS${NC}"
    ((PASS++))
else
    echo -e "${RED}✗ FAIL (HTTP $status_code)${NC}"
    ((FAIL++))
fi

# Test 5: Create Block
echo -n "Testing Block Creation... "
create_response=$(curl -s -X POST http://localhost:8000/v1/blocks \
  -H "Content-Type: application/json" \
  -d '{"title": "Verify Test", "slug": "verify-test-'$RANDOM'", "content": "Test"}')
  
if echo "$create_response" | grep -q '"id"'; then
    echo -e "${GREEN}✓ PASS${NC}"
    ((PASS++))
else
    echo -e "${RED}✗ FAIL${NC}"
    echo "  Response: $create_response"
    ((FAIL++))
fi

# Summary
echo ""
echo "=========================="
echo "RESULTS: $PASS passed, $FAIL failed"
echo "=========================="

if [ $FAIL -eq 0 ]; then
    echo -e "${GREEN}🎉 ALL TESTS PASSED!${NC}"
    exit 0
else
    echo -e "${RED}⚠️  SOME TESTS FAILED${NC}"
    exit 1
fi
