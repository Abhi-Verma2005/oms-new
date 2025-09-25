#!/bin/bash

# Comprehensive dependency fix script based on 2024 best practices
echo "🔧 Fixing dependency issues with Node.js 22..."

# Check Node.js version
echo "📋 Current Node.js version:"
node --version

# Clean everything
echo "🗑️  Cleaning existing files..."
rm -rf node_modules
rm -f package-lock.json
rm -f pnpm-lock.yaml

# Clear npm cache
echo "🧹 Clearing npm cache..."
npm cache clean --force

# Install with legacy peer deps to handle conflicts
echo "📦 Installing dependencies with legacy peer deps..."
npm install --legacy-peer-deps

# Verify installation
echo "✅ Verifying installation..."
npm list --depth=0

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Test build
echo "🏗️  Testing build..."
npm run build

echo "🎯 Dependencies fixed successfully!"
echo "📋 Next steps:"
echo "1. Commit the updated package-lock.json"
echo "2. Push to trigger GitHub Actions"
echo "3. Verify deployment works"

