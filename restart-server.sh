#!/bin/bash

# Kill any existing Genomain server processes
echo "Stopping existing Genomain server..."
pkill -f "node.*Genomain.*index" 2>/dev/null
pkill -f "cross-env NODE_ENV=production" 2>/dev/null
lsof -ti:3001 | xargs kill -9 2>/dev/null

# Wait for port to be freed
sleep 3

# Start the server with the updated configuration
echo "Starting Genomain server with updated configuration..."
cd /Users/linhpham/Desktop/test/Genomain
export ADMIN_SYSTEM_URL='http://localhost:5007'
export USE_ADMIN_SYSTEM_AUTH='true'
yarn prod:server