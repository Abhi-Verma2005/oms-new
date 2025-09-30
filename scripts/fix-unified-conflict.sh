#!/bin/bash

# Fix Unified Deployment Port Conflicts
# This script resolves conflicts between single-app and unified deployments

echo "🔧 Fixing unified deployment conflicts..."

# 1. Stop ALL containers (both setups)
echo "🛑 Stopping all containers..."
docker-compose down --remove-orphans --volumes --timeout 10 || true
docker-compose -f docker-compose-unified.yml down --remove-orphans --volumes --timeout 10 || true

# 2. Kill any processes using ports 3000, 80, 443, 8080, 3306, 6379
echo "🔫 Killing processes on all ports..."
for port in 3000 80 443 8080 3306 6379; do
    sudo lsof -ti:$port | xargs -r sudo kill -9 || true
done

# 3. Wait for ports to be released
echo "⏳ Waiting for ports to be released..."
sleep 10

# 4. Clean up Docker resources
echo "🧹 Cleaning up Docker resources..."
docker system prune -f || true
docker volume prune -f || true
docker network prune -f || true
docker container prune -f || true

# 5. Check if ports are free
echo "🔍 Checking port status..."
for port in 3000 80 443 8080 3306 6379; do
    if lsof -i:$port > /dev/null 2>&1; then
        echo "❌ Port $port still in use:"
        lsof -i:$port
    else
        echo "✅ Port $port is free"
    fi
done

# 6. If still in use, force kill everything
if lsof -i:3000 > /dev/null 2>&1 || lsof -i:80 > /dev/null 2>&1 || lsof -i:443 > /dev/null 2>&1; then
    echo "⚠️ Some ports still in use. Force killing all processes..."
    sudo pkill -f docker || true
    sudo pkill -f node || true
    sudo pkill -f nginx || true
    sudo pkill -f mysql || true
    sudo pkill -f redis || true
    sleep 5
fi

# 7. Final check
echo "🔍 Final port check..."
if lsof -i:3000 > /dev/null 2>&1; then
    echo "❌ Port 3000 still in use:"
    lsof -i:3000
    echo "Please restart the VM: sudo reboot"
    exit 1
fi

echo "✅ All ports are now free!"
echo "🚀 You can now run: docker-compose -f docker-compose-unified.yml up -d"
