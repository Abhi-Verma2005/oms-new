#!/bin/bash

# Environment setup script for VM
# This script helps you set up environment variables on your VM

set -e

echo "🔧 Setting up environment variables on VM..."

# Check if we're in the right directory
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ Please run this script from your app directory (where docker-compose.yml is located)"
    exit 1
fi

# Create .env.production file
echo "📝 Creating .env.production file..."

cat > .env.production << 'EOF'
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/oms_db"

# NextAuth.js
NEXTAUTH_SECRET="your-nextauth-secret-key-here"
NEXTAUTH_URL="https://yourdomain.com"

# OAuth Providers
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Stripe
STRIPE_PUBLISHABLE_KEY="pk_live_your-stripe-publishable-key"
STRIPE_SECRET_KEY="sk_live_your-stripe-secret-key"
STRIPE_WEBHOOK_SECRET="whsec_your-stripe-webhook-secret"

# WebSocket
NEXT_PUBLIC_WEBSOCKET_URL="wss://yourdomain.com"

# AI/Gemini
GEMINI_API_KEY="your-gemini-api-key"

# Email Configuration
EMAIL_SERVER_HOST="smtp.gmail.com"
EMAIL_SERVER_PORT="587"
EMAIL_SERVER_USER="your-email@gmail.com"
EMAIL_SERVER_PASSWORD="your-app-password"
EMAIL_FROM="noreply@yourdomain.com"
EOF

echo "✅ Created .env.production file"
echo ""
echo "📋 Next steps:"
echo "   1. Edit the .env.production file with your actual values:"
echo "      nano .env.production"
echo ""
echo "   2. Replace all placeholder values with your real credentials"
echo ""
echo "   3. Test the Docker build:"
echo "      docker-compose build"
echo ""
echo "   4. Run the application:"
echo "      docker-compose up -d"
echo ""
echo "⚠️  Important:"
echo "   - Make sure to use your actual domain in NEXTAUTH_URL and NEXT_PUBLIC_WEBSOCKET_URL"
echo "   - Use HTTPS (https://) and WSS (wss://) for production URLs"
echo "   - Keep your secrets secure and don't commit this file to git"

