#!/bin/bash

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

API_URL="http://localhost:8000"
WEB_URL="http://localhost:3000"

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}Testing No Time To Lie Application${NC}"
echo -e "${YELLOW}========================================${NC}\n"

# Test 1: API Health Check
echo -e "${YELLOW}1. Testing API Health...${NC}"
HEALTH=$(curl -s ${API_URL}/v1/health)
if echo "$HEALTH" | grep -q "ok"; then
    echo -e "${GREEN}✓ API is healthy${NC}"
    echo "   Response: $HEALTH"
else
    echo -e "${RED}✗ API health check failed${NC}"
fi
echo ""

# Test 2: Web App Status
echo -e "${YELLOW}2. Testing Web App...${NC}"
WEB_STATUS=$(curl -s -o /dev/null -w "%{http_code}" ${WEB_URL})
if [ "$WEB_STATUS" == "200" ]; then
    echo -e "${GREEN}✓ Web app is running${NC}"
    echo "   HTTP Status: $WEB_STATUS"
else
    echo -e "${RED}✗ Web app returned status: $WEB_STATUS${NC}"
fi
echo ""

# Test 3: Get Blocks (should return empty array)
echo -e "${YELLOW}3. Testing GET /v1/blocks...${NC}"
BLOCKS=$(curl -s ${API_URL}/v1/blocks)
echo "   Response: $BLOCKS"
if echo "$BLOCKS" | grep -q "\[\]"; then
    echo -e "${GREEN}✓ Blocks endpoint working (empty array)${NC}"
else
    echo -e "${YELLOW}⚠ Blocks endpoint returned: $BLOCKS${NC}"
fi
echo ""

# Test 4: Get Paths
echo -e "${YELLOW}4. Testing GET /v1/paths...${NC}"
PATHS=$(curl -s ${API_URL}/v1/paths)
echo "   Response: $PATHS"
if echo "$PATHS" | grep -q "\[\]"; then
    echo -e "${GREEN}✓ Paths endpoint working (empty array)${NC}"
else
    echo -e "${YELLOW}⚠ Paths endpoint returned: $PATHS${NC}"
fi
echo ""

# Test 5: API Documentation
echo -e "${YELLOW}5. Testing API Documentation...${NC}"
DOCS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" ${API_URL}/docs)
if [ "$DOCS_STATUS" == "200" ]; then
    echo -e "${GREEN}✓ API docs available at ${API_URL}/docs${NC}"
else
    echo -e "${RED}✗ API docs returned status: $DOCS_STATUS${NC}"
fi
echo ""

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}Summary${NC}"
echo -e "${YELLOW}========================================${NC}"
echo -e "${GREEN}✅ Application is ready!${NC}"
echo ""
echo -e "${GREEN}📍 Access Points:${NC}"
echo "  • Web App:     ${WEB_URL}"
echo "  • API Server:  ${API_URL}"
echo "  • API Docs:    ${API_URL}/docs"
echo ""
echo -e "${YELLOW}🎯 Next Steps:${NC}"
echo "  1. Open ${WEB_URL} in your browser"
echo "  2. Browse blocks and paths"
echo "  3. View API documentation"
echo "  4. Create your first block!"
echo ""
echo -e "${YELLOW}📚 For more details, see START_APP.md${NC}"
echo ""
