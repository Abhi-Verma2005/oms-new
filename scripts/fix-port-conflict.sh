#!/bin/bash

# Fix Port 3000 Conflict Script
# Run this on the VM if you get "port is already allocated" errors

echo "🔧 Fixing port 3000 conflicts..."

# Stop all containers
echo "🛑 Stopping all containers..."
docker-compose down --remove-orphans --volumes || true

# Kill any processes using port 3000
echo "🔫 Killing processes on port 3000..."
sudo lsof -ti:3000 | xargs -r sudo kill -9 || true

# Wait for ports to be released
echo "⏳ Waiting for ports to be released..."
sleep 5

# Check if port is free
if lsof -i:3000 > /dev/null 2>&1; then
    echo "❌ Port 3000 still in use. Force killing..."
    sudo lsof -ti:3000 | xargs -r sudo kill -9
    sleep 3
fi

# Clean up Docker resources
echo "🧹 Cleaning up Docker resources..."
docker system prune -f || true
docker volume prune -f || true

# Verify port is free
if lsof -i:3000 > /dev/null 2>&1; then
    echo "❌ Port 3000 is still in use:"
    lsof -i:3000
    echo "Please manually kill these processes or restart the VM"
    exit 1
else
    echo "✅ Port 3000 is now free"
fi

echo "✅ Port conflict resolved. You can now run: docker-compose up -d"

