#!/bin/bash

# Simple test script for Docker build
# This script tests the Docker build with dummy environment variables

set -e

echo "🐳 Testing Docker build with dummy environment variables..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Check if required files exist
echo "📋 Checking required files..."
required_files=("Dockerfile" "docker-compose.yml" "package.json" "prisma/schema.prisma")

for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        echo "❌ Required file not found: $file"
        exit 1
    else
        echo "✅ Found: $file"
    fi
done

# Test Docker build
echo "🔨 Testing Docker build..."
if docker build -t oms-test .; then
    echo "✅ Docker build successful!"
    echo "🎉 Build completed successfully!"
    echo ""
    echo "📋 Next steps:"
    echo "   1. Commit and push your changes:"
    echo "      git add . && git commit -m 'Fix Docker build with dummy env vars' && git push"
    echo "   2. On your VM, pull the latest changes:"
    echo "      git pull origin main"
    echo "   3. Run on VM:"
    echo "      docker-compose up -d"
else
    echo "❌ Docker build failed!"
    echo "📋 Check the error messages above for details."
    exit 1
fi
