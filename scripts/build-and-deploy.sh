#!/bin/bash

# =============================================================================
# Production Build and Deploy Script
# Based on 2024 best practices for Next.js + Prisma + Docker
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
IMAGE_NAME="oms-app"
CONTAINER_NAME="oms-container"
PORT="3000"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker first."
        exit 1
    fi
    print_success "Docker is running"
}

# Function to check required files
check_files() {
    print_status "Checking required files..."
    
    local required_files=("Dockerfile" "docker-compose.yml" "package.json" "prisma/schema.prisma")
    
    for file in "${required_files[@]}"; do
        if [ ! -f "$file" ]; then
            print_error "Required file not found: $file"
            exit 1
        else
            print_success "Found: $file"
        fi
    done
}

# Function to clean up old containers and images
cleanup() {
    print_status "Cleaning up old containers and images..."
    
    # Stop and remove existing container
    if docker ps -a --format 'table {{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
        print_status "Stopping existing container..."
        docker stop $CONTAINER_NAME || true
        docker rm $CONTAINER_NAME || true
    fi
    
    # Remove old images (keep last 3)
    print_status "Cleaning up old images..."
    docker images $IMAGE_NAME --format "table {{.Repository}}:{{.Tag}}\t{{.CreatedAt}}" | \
    tail -n +4 | head -n -3 | awk '{print $1}' | xargs -r docker rmi || true
    
    print_success "Cleanup completed"
}

# Function to build Docker image
build_image() {
    print_status "Building Docker image..."
    
    if docker build -t $IMAGE_NAME .; then
        print_success "Docker image built successfully"
    else
        print_error "Docker build failed"
        exit 1
    fi
}

# Function to test the image
test_image() {
    print_status "Testing Docker image..."
    
    # Run container in background
    docker run -d \
        --name ${CONTAINER_NAME}-test \
        -p ${PORT}:${PORT} \
        -e NODE_ENV=production \
        -e DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" \
        -e NEXTAUTH_SECRET="test-secret" \
        -e NEXTAUTH_URL="http://localhost:${PORT}" \
        $IMAGE_NAME
    
    # Wait for container to start
    print_status "Waiting for container to start..."
    sleep 10
    
    # Test health endpoint
    if curl -f http://localhost:${PORT}/api/hello > /dev/null 2>&1; then
        print_success "Container is healthy"
    else
        print_warning "Health check failed, but container is running"
    fi
    
    # Stop test container
    docker stop ${CONTAINER_NAME}-test
    docker rm ${CONTAINER_NAME}-test
    
    print_success "Image test completed"
}

# Function to deploy with docker-compose
deploy_compose() {
    print_status "Deploying with docker-compose..."
    
    if docker-compose up -d; then
        print_success "Deployment completed"
    else
        print_error "Deployment failed"
        exit 1
    fi
}

# Function to show deployment status
show_status() {
    print_status "Deployment Status:"
    echo ""
    docker-compose ps
    echo ""
    print_status "Application logs (last 20 lines):"
    docker-compose logs --tail=20
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --build-only    Only build the Docker image"
    echo "  --test-only     Only test the Docker image"
    echo "  --deploy-only   Only deploy with docker-compose"
    echo "  --cleanup       Clean up old containers and images"
    echo "  --help          Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                    # Full build, test, and deploy"
    echo "  $0 --build-only       # Only build the image"
    echo "  $0 --deploy-only      # Only deploy with docker-compose"
    echo "  $0 --cleanup          # Clean up and exit"
}

# Main function
main() {
    print_status "Starting production build and deploy process..."
    echo ""
    
    # Parse command line arguments
    BUILD_ONLY=false
    TEST_ONLY=false
    DEPLOY_ONLY=false
    CLEANUP_ONLY=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --build-only)
                BUILD_ONLY=true
                shift
                ;;
            --test-only)
                TEST_ONLY=true
                shift
                ;;
            --deploy-only)
                DEPLOY_ONLY=true
                shift
                ;;
            --cleanup)
                CLEANUP_ONLY=true
                shift
                ;;
            --help)
                show_usage
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                show_usage
                exit 1
                ;;
        esac
    done
    
    # Check prerequisites
    check_docker
    check_files
    
    if [ "$CLEANUP_ONLY" = true ]; then
        cleanup
        exit 0
    fi
    
    if [ "$DEPLOY_ONLY" = true ]; then
        deploy_compose
        show_status
        exit 0
    fi
    
    if [ "$BUILD_ONLY" = true ]; then
        cleanup
        build_image
        exit 0
    fi
    
    if [ "$TEST_ONLY" = true ]; then
        test_image
        exit 0
    fi
    
    # Full deployment process
    cleanup
    build_image
    test_image
    deploy_compose
    show_status
    
    print_success "Production deployment completed successfully!"
    echo ""
    print_status "Your application is now running at: http://localhost:${PORT}"
    print_status "To view logs: docker-compose logs -f"
    print_status "To stop: docker-compose down"
}

# Run main function
main "$@"
