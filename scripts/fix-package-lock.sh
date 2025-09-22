#!/bin/bash

# Fix package-lock.json sync issues
echo "🔧 Fixing package-lock.json sync issues..."

# Remove existing lock files
echo "🗑️  Removing existing lock files..."
rm -f package-lock.json
rm -f pnpm-lock.yaml

# Install dependencies to regenerate lock file
echo "📦 Installing dependencies..."
npm install

# Verify installation
echo "✅ Verifying installation..."
npm list --depth=0

echo "🎯 Package lock file has been regenerated!"
echo "📋 Next steps:"
echo "1. Commit the updated package-lock.json"
echo "2. Push to trigger GitHub Actions"
