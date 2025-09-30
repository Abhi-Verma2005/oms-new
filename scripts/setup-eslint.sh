#!/bin/bash

# Setup ESLint for Next.js project
echo "🔧 Setting up ESLint for Next.js..."

# Install ESLint dependencies
echo "📦 Installing ESLint dependencies..."
npm install --save-dev eslint eslint-config-next

# Create ESLint configuration
echo "⚙️ Creating ESLint configuration..."
cat > .eslintrc.json << 'EOF'
{
  "extends": ["next/core-web-vitals"],
  "rules": {
    "react/no-unescaped-entities": "off",
    "@next/next/no-page-custom-font": "off",
    "react-hooks/exhaustive-deps": "warn"
  }
}
EOF

# Test ESLint
echo "🧪 Testing ESLint..."
npm run lint

echo "✅ ESLint setup complete!"
echo "📋 ESLint configuration created at .eslintrc.json"


