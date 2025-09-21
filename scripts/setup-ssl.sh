#!/bin/bash

# SSL setup script using Let's Encrypt
# This script sets up SSL certificates for the domain

set -e

# Configuration
DOMAIN="${1:-your-domain.com}"
EMAIL="${2:-admin@your-domain.com}"
NGINX_CONF="/home/$USER/app/nginx/nginx.conf"

# Function to log messages
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Function to check if domain is accessible
check_domain() {
    log "🌐 Checking if domain $DOMAIN is accessible..."
    
    if curl -s --connect-timeout 10 "http://$DOMAIN" > /dev/null; then
        log "✅ Domain is accessible"
        return 0
    else
        log "❌ Domain is not accessible. Please ensure:"
        log "   1. DNS is pointing to this server"
        log "   2. Port 80 is open"
        log "   3. Nginx is running"
        return 1
    fi
}

# Function to install certbot
install_certbot() {
    log "📦 Installing Certbot..."
    
    # Update package list
    sudo apt update
    
    # Install certbot and nginx plugin
    sudo apt install -y certbot python3-certbot-nginx
    
    log "✅ Certbot installed"
}

# Function to get SSL certificate
get_certificate() {
    log "🔐 Getting SSL certificate for $DOMAIN..."
    
    # Stop nginx container temporarily
    cd /home/$USER/app
    docker-compose stop nginx
    
    # Get certificate
    sudo certbot certonly \
        --standalone \
        --email "$EMAIL" \
        --agree-tos \
        --no-eff-email \
        -d "$DOMAIN"
    
    # Update nginx configuration with domain
    log "🔧 Updating Nginx configuration..."
    sed -i "s/your-domain.com/$DOMAIN/g" "$NGINX_CONF"
    
    # Start nginx container
    docker-compose up -d nginx
    
    log "✅ SSL certificate obtained and configured"
}

# Function to setup auto-renewal
setup_renewal() {
    log "🔄 Setting up automatic certificate renewal..."
    
    # Create renewal script
    sudo tee /etc/cron.d/certbot-renewal > /dev/null << EOF
# Renew Let's Encrypt certificates twice daily
0 */12 * * * root certbot renew --quiet --deploy-hook "cd /home/$USER/app && docker-compose restart nginx"
EOF
    
    # Test renewal
    sudo certbot renew --dry-run
    
    log "✅ Auto-renewal configured"
}

# Function to verify SSL
verify_ssl() {
    log "🔍 Verifying SSL configuration..."
    
    sleep 10  # Wait for nginx to start
    
    if curl -s --connect-timeout 10 "https://$DOMAIN" > /dev/null; then
        log "✅ SSL is working correctly"
        
        # Test SSL grade
        log "📊 Testing SSL configuration..."
        curl -s "https://api.ssllabs.com/api/v3/analyze?host=$DOMAIN&publish=off&startNew=on" > /dev/null || true
    else
        log "❌ SSL verification failed"
        return 1
    fi
}

# Main function
main() {
    log "🚀 Starting SSL setup for domain: $DOMAIN"
    
    # Check if running as root for certbot operations
    if [ "$EUID" -eq 0 ]; then
        log "❌ Please run this script as a regular user, not root"
        exit 1
    fi
    
    # Check domain accessibility
    if ! check_domain; then
        log "❌ Cannot proceed with SSL setup"
        exit 1
    fi
    
    # Install certbot
    install_certbot
    
    # Get certificate
    get_certificate
    
    # Setup auto-renewal
    setup_renewal
    
    # Verify SSL
    verify_ssl
    
    log "🎉 SSL setup completed successfully!"
    log "🌐 Your site is now available at: https://$DOMAIN"
}

# Show usage if no domain provided
if [ -z "$1" ]; then
    echo "Usage: $0 <domain> [email]"
    echo "Example: $0 example.com admin@example.com"
    exit 1
fi

# Run main function
main
