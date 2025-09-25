#!/bin/bash

# Test Docker build script
# This script tests the Docker build locally before deployment

set -e

echo "🐳 Testing Docker build locally..."

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
else
    echo "❌ Docker build failed!"
    exit 1
fi

# Test docker-compose build
echo "🔧 Testing docker-compose build..."
if docker-compose build; then
    echo "✅ Docker-compose build successful!"
else
    echo "❌ Docker-compose build failed!"
    exit 1
fi

echo "🎉 All tests passed! Ready for deployment."
echo "📋 Next steps:"
echo "   1. Commit and push your changes: git add . && git commit -m 'Fix Docker build' && git push"
echo "   2. Pull on your VM: git pull origin main"
echo "   3. Run on VM: docker-compose up -d"

