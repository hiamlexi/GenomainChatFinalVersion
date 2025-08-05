#!/bin/bash

# AnythingLLM Production Stop Script

echo "Stopping AnythingLLM services..."

# Kill all node processes
pkill node

echo "All AnythingLLM services have been stopped."