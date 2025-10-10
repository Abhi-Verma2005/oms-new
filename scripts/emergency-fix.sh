#!/bin/bash

# Emergency Fix Script for Port Conflicts
# Run this on the VM to fix "port is already allocated" errors

echo "🚨 Emergency Fix: Resolving port conflicts..."

# 1. Stop all Docker containers
echo "🛑 Stopping all Docker containers..."
docker-compose down --remove-orphans --volumes --timeout 10 || true

# 2. Kill any processes using port 3000
echo "🔫 Killing processes on port 3000..."
sudo lsof -ti:3000 | xargs -r sudo kill -9 || true

# 3. Kill any processes using port 80 and 443 (nginx)
echo "🔫 Killing processes on ports 80 and 443..."
sudo lsof -ti:80 | xargs -r sudo kill -9 || true
sudo lsof -ti:443 | xargs -r sudo kill -9 || true

# 4. Wait for ports to be released
echo "⏳ Waiting for ports to be released..."
sleep 10

# 5. Clean up Docker resources
echo "🧹 Cleaning up Docker resources..."
docker system prune -f || true
docker volume prune -f || true
docker network prune -f || true

# 6. Remove any dangling containers
echo "🗑️ Removing dangling containers..."
docker container prune -f || true

# 7. Check if ports are free
echo "🔍 Checking port status..."
echo "Port 3000:"
lsof -i:3000 || echo "✅ Port 3000 is free"
echo "Port 80:"
lsof -i:80 || echo "✅ Port 80 is free"
echo "Port 443:"
lsof -i:443 || echo "✅ Port 443 is free"

# 8. If still in use, force kill everything
if lsof -i:3000 > /dev/null 2>&1 || lsof -i:80 > /dev/null 2>&1 || lsof -i:443 > /dev/null 2>&1; then
    echo "⚠️ Some ports still in use. Force killing all processes..."
    sudo pkill -f docker || true
    sudo pkill -f node || true
    sudo pkill -f nginx || true
    sleep 5
fi

# 9. Final check
echo "🔍 Final port check..."
if lsof -i:3000 > /dev/null 2>&1; then
    echo "❌ Port 3000 still in use:"
    lsof -i:3000
    echo "Please restart the VM: sudo reboot"
    exit 1
fi

echo "✅ All ports are now free!"
echo "🚀 You can now run: docker-compose up -d"

