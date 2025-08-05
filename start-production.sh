#!/bin/bash

# AnythingLLM Production Startup Script

echo "Starting AnythingLLM in production mode..."

# Kill any existing node processes
pkill node

# Start the server in production mode
echo "Starting server..."
cd /Users/linhpham/Desktop/test/anything-llm/server
NODE_ENV=production node index.js > /Users/linhpham/Desktop/test/anything-llm/server.log 2>&1 &
SERVER_PID=$!
echo "Server started with PID: $SERVER_PID"

# Give server time to start
sleep 3

# Start the collector in production mode
echo "Starting collector..."
cd /Users/linhpham/Desktop/test/anything-llm/collector
NODE_ENV=production node index.js > /Users/linhpham/Desktop/test/anything-llm/collector.log 2>&1 &
COLLECTOR_PID=$!
echo "Collector started with PID: $COLLECTOR_PID"

echo ""
echo "AnythingLLM is now running in production mode!"
echo "Access the application at: http://localhost:3001"
echo ""
echo "To stop the services, run: pkill node"
echo "Server logs: /Users/linhpham/Desktop/test/anything-llm/server.log"
echo "Collector logs: /Users/linhpham/Desktop/test/anything-llm/collector.log"