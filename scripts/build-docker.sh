#!/bin/bash

# Docker build script with font loading resilience
set -e

echo "🚀 Starting Docker build with font optimization..."

# Set environment variables for build
export NODE_ENV=production
export NEXT_TELEMETRY_DISABLED=1
export NEXT_FONT_GOOGLE_MOCKED_RESPONSES=1
export NODE_TLS_REJECT_UNAUTHORIZED=0
export HTTP_TIMEOUT=30000

# Build with retry logic
echo "📦 Building Next.js application..."
for i in 1 2 3; do
  echo "🔄 Build attempt $i/3..."
  
  if [ -f pnpm-lock.yaml ]; then
    pnpm build
  else
    npm run build
  fi
  
  if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    break
  else
    echo "❌ Build attempt $i failed"
    if [ $i -eq 3 ]; then
      echo "💥 All build attempts failed"
      exit 1
    fi
    echo "⏳ Waiting 10 seconds before retry..."
    sleep 10
  fi
done

echo "🎉 Build completed successfully!"
