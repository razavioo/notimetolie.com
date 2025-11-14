#!/bin/bash

# Stop Development Servers

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}   Stopping notimetolie.com Development Servers${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

# Get the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Function to kill process by PID file
kill_by_pid_file() {
    PID_FILE=$1
    SERVICE_NAME=$2
    
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if ps -p $PID > /dev/null 2>&1; then
            echo -e "${BLUE}Stopping $SERVICE_NAME (PID: $PID)...${NC}"
            kill $PID 2>/dev/null
            sleep 1
            
            # Force kill if still running
            if ps -p $PID > /dev/null 2>&1; then
                echo -e "${RED}Force killing $SERVICE_NAME...${NC}"
                kill -9 $PID 2>/dev/null
            fi
            
            echo -e "${GREEN}✓ $SERVICE_NAME stopped${NC}"
        else
            echo -e "${BLUE}$SERVICE_NAME is not running${NC}"
        fi
        rm "$PID_FILE"
    else
        echo -e "${BLUE}No PID file found for $SERVICE_NAME${NC}"
    fi
}

# Function to kill by port
kill_by_port() {
    PORT=$1
    SERVICE_NAME=$2
    
    if lsof -ti:$PORT > /dev/null 2>&1; then
        echo -e "${BLUE}Stopping $SERVICE_NAME on port $PORT...${NC}"
        lsof -ti:$PORT | xargs kill -9 2>/dev/null
        echo -e "${GREEN}✓ $SERVICE_NAME stopped${NC}"
    else
        echo -e "${BLUE}$SERVICE_NAME is not running on port $PORT${NC}"
    fi
}

# Stop by PID files first
kill_by_pid_file "$SCRIPT_DIR/.backend.pid" "Backend API"
kill_by_pid_file "$SCRIPT_DIR/.frontend.pid" "Frontend Web"

# Also kill by ports as backup
echo ""
echo -e "${BLUE}Checking ports...${NC}"
kill_by_port 8000 "Backend API"
kill_by_port 3000 "Frontend Web"

echo ""
echo -e "${GREEN}✨ All development servers stopped${NC}"
echo ""
