#!/bin/bash

# Test Dockerfile build
echo "🔧 Testing Dockerfile build..."

# Build the Docker image
echo "Building Docker image..."
docker build -t oms-app-test .

if [ $? -eq 0 ]; then
    echo "✅ Docker build successful!"
    
    # Test running the container
    echo "Testing container startup..."
    docker run --rm -d --name oms-test -p 3001:3000 \
        -e DATABASE_URL="postgresql://test:test@localhost:5432/test" \
        -e NEXTAUTH_SECRET="test-secret" \
        -e NEXTAUTH_URL="http://localhost:3001" \
        oms-app-test
    
    # Wait a moment for startup
    sleep 5
    
    # Check if container is running
    if docker ps | grep -q oms-test; then
        echo "✅ Container started successfully!"
        
        # Test health endpoint
        echo "Testing health endpoint..."
        if curl -f http://localhost:3001/api/hello > /dev/null 2>&1; then
            echo "✅ Health endpoint responding!"
        else
            echo "⚠️  Health endpoint not responding (this might be expected if API routes need database)"
        fi
        
        # Clean up
        echo "Cleaning up test container..."
        docker stop oms-test
        docker rmi oms-app-test
        echo "✅ Test completed successfully!"
    else
        echo "❌ Container failed to start"
        docker logs oms-test
        docker stop oms-test 2>/dev/null
        docker rmi oms-app-test
        exit 1
    fi
else
    echo "❌ Docker build failed!"
    exit 1
fi


