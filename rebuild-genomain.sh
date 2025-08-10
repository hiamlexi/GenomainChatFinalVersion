#!/bin/bash

# Rebuild Genomain Chat Interface Script
# This script rebuilds the frontend, copies it to server, and restarts the server

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get the directory where the script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo -e "${YELLOW}Starting Genomain rebuild process...${NC}"

# Step 1: Stop the server if it's running
echo -e "\n${YELLOW}Step 1: Stopping Genomain server...${NC}"
PID=$(lsof -ti:3001 2>/dev/null || true)
if [ ! -z "$PID" ]; then
    kill -9 $PID 2>/dev/null || true
    echo -e "${GREEN}✓ Server stopped${NC}"
else
    echo -e "${GREEN}✓ Server was not running${NC}"
fi

# Step 2: Rebuild the frontend
echo -e "\n${YELLOW}Step 2: Rebuilding frontend...${NC}"
cd frontend
npm run build
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Frontend build successful${NC}"
else
    echo -e "${RED}✗ Frontend build failed${NC}"
    exit 1
fi

# Step 3: Copy the new build to server/public
echo -e "\n${YELLOW}Step 3: Copying new build to server...${NC}"
cd ..
rm -rf server/public/*
cp -r frontend/dist/* server/public/
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Frontend copied to server/public${NC}"
else
    echo -e "${RED}✗ Failed to copy frontend${NC}"
    exit 1
fi

# Step 4: Restart the server
echo -e "\n${YELLOW}Step 4: Starting Genomain server...${NC}"
cd "$SCRIPT_DIR"
NODE_ENV=production npm run prod:server > server.log 2>&1 &
SERVER_PID=$!

# Wait a bit for server to start
sleep 5

# Check if server started successfully
if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${GREEN}✓ Server started successfully on port 3001 (PID: $SERVER_PID)${NC}"
else
    echo -e "${RED}✗ Server failed to start. Check server.log for details${NC}"
    exit 1
fi

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}Genomain rebuild complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "Frontend: ${GREEN}Rebuilt and deployed${NC}"
echo -e "Server: ${GREEN}Running on http://localhost:3001${NC}"
echo -e "Logs: ${SCRIPT_DIR}/server.log"
echo -e "\nTo stop the server, run: ${YELLOW}kill $SERVER_PID${NC}"