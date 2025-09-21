#!/bin/bash

# Health check script for the Next.js application
# This script checks if the application is running and healthy

set -e

# Configuration
APP_URL="http://localhost:3000/api/hello"
MAX_RETRIES=3
RETRY_DELAY=10
LOG_FILE="/home/$USER/app/logs/health.log"

# Create logs directory if it doesn't exist
mkdir -p "$(dirname "$LOG_FILE")"

# Function to log messages
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Function to check application health
check_health() {
    local response_code
    response_code=$(curl -s -o /dev/null -w "%{http_code}" "$APP_URL" || echo "000")
    
    if [ "$response_code" -eq 200 ]; then
        return 0
    else
        return 1
    fi
}

# Function to restart application
restart_app() {
    log "🔄 Restarting application..."
    cd /home/$USER/app
    
    # Stop containers
    docker-compose down --timeout 30 || true
    
    # Start containers
    docker-compose up -d
    
    # Wait for startup
    sleep 30
    
    log "✅ Application restart completed"
}

# Main health check logic
main() {
    log "🏥 Starting health check..."
    
    local retry_count=0
    
    while [ $retry_count -lt $MAX_RETRIES ]; do
        if check_health; then
            log "✅ Application is healthy (HTTP 200)"
            exit 0
        else
            retry_count=$((retry_count + 1))
            log "❌ Health check failed (attempt $retry_count/$MAX_RETRIES)"
            
            if [ $retry_count -lt $MAX_RETRIES ]; then
                log "⏳ Waiting $RETRY_DELAY seconds before retry..."
                sleep $RETRY_DELAY
            fi
        fi
    done
    
    # All retries failed, restart application
    log "❌ All health checks failed, attempting restart..."
    restart_app
    
    # Final health check after restart
    sleep 30
    if check_health; then
        log "✅ Application is healthy after restart"
        exit 0
    else
        log "❌ Application is still unhealthy after restart - manual intervention required"
        exit 1
    fi
}

# Run main function
main "$@"
