#!/bin/bash

# Genomain Production Stop Script

echo "Stopping Genomain services..."

# Kill all node processes
pkill node

echo "All Genomain services have been stopped."