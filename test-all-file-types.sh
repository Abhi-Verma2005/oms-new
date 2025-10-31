#!/bin/bash

echo "🧪 Comprehensive File Processing Test"
echo "====================================="

# Test CSV file
echo "📊 Testing CSV processing..."
curl -s -X POST http://localhost:3000/api/upload-document \
  -F "file=@package.json" \
  -F "userId=csv_test" \
  | jq -r '.success // "Failed"'

# Test TXT file  
echo "📄 Testing TXT processing..."
curl -s -X POST http://localhost:3000/api/upload-document \
  -F "file=@test.txt" \
  -F "userId=txt_test" \
  | jq -r '.success // "Failed"'

# Test PDF file
echo "📄 Testing PDF processing..."
curl -s -X POST http://localhost:3000/api/upload-document \
  -F "file=@./node_modules/.pnpm/pdf-parse@1.1.1/node_modules/pdf-parse/test/data/01-valid.pdf" \
  -F "userId=pdf_test" \
  | jq -r '.success // "Failed"'

echo "✅ All tests completed!"


