#!/bin/bash

# Start Development Servers
# This script starts both the backend API and frontend web servers

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}   Starting notimetolie.com Development Servers${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

# Get the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Check if ports are already in use
check_port() {
    lsof -ti:$1 > /dev/null 2>&1
    return $?
}

# Kill process on port
kill_port() {
    if check_port $1; then
        echo -e "${YELLOW}⚠️  Port $1 is in use. Killing existing process...${NC}"
        lsof -ti:$1 | xargs kill -9 2>/dev/null
        sleep 1
    fi
}

# Check and kill if needed
kill_port 8000
kill_port 3000

# Start Backend API
echo -e "${GREEN}🚀 Starting Backend API...${NC}"
cd "$SCRIPT_DIR/apps/api"

# Check if virtual environment exists
if [ ! -d ".venv" ]; then
    echo -e "${RED}❌ Virtual environment not found. Creating...${NC}"
    python3 -m venv .venv
    .venv/bin/pip install -r requirements.txt
fi

# Start backend in background
.venv/bin/python -m uvicorn src.main:app --reload --host 0.0.0.0 --port 8000 > "$SCRIPT_DIR/backend.log" 2>&1 &
BACKEND_PID=$!
echo -e "${GREEN}✓ Backend API started (PID: $BACKEND_PID)${NC}"
echo -e "${BLUE}  - API URL: http://localhost:8000${NC}"
echo -e "${BLUE}  - API Docs: http://localhost:8000/docs${NC}"
echo -e "${BLUE}  - Logs: backend.log${NC}"
echo ""

# Wait a moment for backend to start
sleep 2

# Start Frontend Web
echo -e "${GREEN}🚀 Starting Frontend Web...${NC}"
cd "$SCRIPT_DIR/apps/web"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⚠️  node_modules not found. Installing dependencies...${NC}"
    npm install
fi

# Start frontend in background
npm run dev > "$SCRIPT_DIR/frontend.log" 2>&1 &
FRONTEND_PID=$!
echo -e "${GREEN}✓ Frontend Web started (PID: $FRONTEND_PID)${NC}"
echo -e "${BLUE}  - Web URL: http://localhost:3000${NC}"
echo -e "${BLUE}  - Logs: frontend.log${NC}"
echo ""

# Save PIDs to file for stop script
echo "$BACKEND_PID" > "$SCRIPT_DIR/.backend.pid"
echo "$FRONTEND_PID" > "$SCRIPT_DIR/.frontend.pid"

# Wait for services to be ready
echo -e "${YELLOW}⏳ Waiting for services to be ready...${NC}"
sleep 5

# Check if services are running
if check_port 8000; then
    echo -e "${GREEN}✓ Backend API is running on port 8000${NC}"
else
    echo -e "${RED}❌ Backend API failed to start. Check backend.log${NC}"
fi

if check_port 3000; then
    echo -e "${GREEN}✓ Frontend Web is running on port 3000${NC}"
else
    echo -e "${RED}❌ Frontend Web failed to start. Check frontend.log${NC}"
fi

echo ""
echo -e "${BLUE}================================================${NC}"
echo -e "${GREEN}✨ Development servers are running!${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""
echo -e "${BLUE}Access your application:${NC}"
echo -e "  Frontend: ${GREEN}http://localhost:3000${NC}"
echo -e "  Backend:  ${GREEN}http://localhost:8000${NC}"
echo -e "  API Docs: ${GREEN}http://localhost:8000/docs${NC}"
echo ""
echo -e "${YELLOW}To stop servers, run: ./stop-dev.sh${NC}"
echo -e "${YELLOW}To view logs:${NC}"
echo -e "  Backend:  tail -f backend.log"
echo -e "  Frontend: tail -f frontend.log"
echo ""
echo -e "${BLUE}Press Ctrl+C to view this message again${NC}"
echo ""

# Keep script running and show logs
echo -e "${BLUE}📋 Following logs (Ctrl+C to stop viewing, servers will keep running)...${NC}"
echo ""
tail -f backend.log frontend.log
