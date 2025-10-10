#!/bin/bash

# Fix Missing oms-landing Directory Issue
# This script handles the case where unified setup is missing oms-landing

echo "🔧 Fixing missing oms-landing directory issue..."

# Check current directory
echo "📁 Current directory: $(pwd)"
echo "📁 Contents:"
ls -la

# Check if we're in the right place
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ Not in the right directory. Looking for docker-compose.yml..."
    exit 1
fi

# Stop any running containers
echo "🛑 Stopping all containers..."
docker-compose down --remove-orphans --volumes --timeout 10 || true
docker-compose -f docker-compose-unified.yml down --remove-orphans --volumes --timeout 10 || true

# Kill any processes using ports
echo "🔫 Killing processes on ports..."
for port in 3000 80 443 8080 3306 6379; do
    sudo lsof -ti:$port | xargs -r sudo kill -9 || true
done

# Wait for ports to be released
sleep 5

# Check if we have oms-landing directory
if [ ! -d "oms-landing" ]; then
    echo "⚠️ oms-landing directory not found. Using single-app setup..."
    
    # Remove unified docker-compose if it exists
    if [ -f "docker-compose-unified.yml" ]; then
        echo "🗑️ Removing unified docker-compose.yml (missing oms-landing)..."
        rm -f docker-compose-unified.yml
    fi
    
    # Use single-app setup
    echo "🚀 Starting single-app setup (OMS only)..."
    docker-compose build --no-cache
    docker-compose up -d
    
else
    echo "✅ oms-landing directory found. Using unified setup..."
    
    # Use unified setup
    echo "🚀 Starting unified setup (WordPress + OMS)..."
    docker-compose -f docker-compose-unified.yml build --no-cache
    docker-compose -f docker-compose-unified.yml up -d
fi

# Wait for application to start
echo "⏳ Waiting for application to start..."
sleep 30

# Health check
echo "🏥 Performing health check..."
for i in {1..10}; do
    if curl -f http://localhost:3000/api/hello > /dev/null 2>&1; then
        echo "✅ Application is healthy!"
        break
    else
        echo "⏳ Attempt $i/10: Application not ready yet..."
        sleep 10
    fi
done

# Show status
echo "📊 Final Status:"
if [ -d "oms-landing" ] && [ -f "docker-compose-unified.yml" ]; then
    docker-compose -f docker-compose-unified.yml ps
else
    docker-compose ps
fi

echo "✅ Fix completed!"

