#!/bin/bash

echo "🚀 Testing All Features - No Time To Lie"
echo "========================================"
echo ""

GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

PASS=0
FAIL=0

test_feature() {
    echo -e "${BLUE}Testing:${NC} $1"
    shift
    if eval "$@" > /dev/null 2>&1; then
        echo -e "  ${GREEN}✓ PASS${NC}"
        ((PASS++))
    else
        echo -e "  ${RED}✗ FAIL${NC}"
        ((FAIL++))
    fi
    echo ""
}

# Test API
test_feature "API Health" "curl -sf http://localhost:8000/v1/health | grep -q status"
test_feature "List Blocks" "curl -sf http://localhost:8000/v1/blocks | grep -q '^\['"
test_feature "Search API" "curl -sf 'http://localhost:8000/v1/search?q=test' | grep -q hits"
test_feature "List Paths" "curl -sf http://localhost:8000/v1/paths | grep -q '^\['"

# Test Create Operations
echo -e "${BLUE}Testing:${NC} Create Block (with hyphen in slug)"
response=$(curl -s -X POST http://localhost:8000/v1/blocks \
  -H "Content-Type: application/json" \
  -d '{"title": "Test Feature", "slug": "test-feature-123", "content": "Testing"}')
if echo "$response" | grep -q '"id"'; then
    echo -e "  ${GREEN}✓ PASS${NC} - Hyphen allowed in slug"
    ((PASS++))
else
    echo -e "  ${RED}✗ FAIL${NC}"
    ((FAIL++))
fi
echo ""

echo -e "${BLUE}Testing:${NC} Create Path"
response=$(curl -s -X POST http://localhost:8000/v1/paths \
  -H "Content-Type: application/json" \
  -d '{"title": "Testing Path", "slug": "testing-path", "description": "Test", "block_ids": []}')
if echo "$response" | grep -q '"id"'; then
    echo -e "  ${GREEN}✓ PASS${NC} - Path creation works"
    ((PASS++))
else
    echo -e "  ${RED}✗ FAIL${NC}"
    ((FAIL++))
fi
echo ""

# Test Web App
test_feature "Web App Home" "curl -sf http://localhost:3000 -o /dev/null"
test_feature "Auth Sign In Page" "curl -sf http://localhost:3000/auth/signin | grep -q 'Sign in'"
test_feature "Auth Sign Up Page" "curl -sf http://localhost:3000/auth/signup | grep -q 'Create Account'"

# Summary
echo "========================================"
echo -e "Results: ${GREEN}$PASS passed${NC}, ${RED}$FAIL failed${NC}"
echo "========================================"

if [ $FAIL -eq 0 ]; then
    echo -e "${GREEN}🎉 ALL TESTS PASSED!${NC}"
    exit 0
else
    echo -e "${RED}⚠️  SOME TESTS FAILED${NC}"
    exit 1
fi
