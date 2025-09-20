#!/bin/bash

# Quick Stripe Webhook Test
# This is a simple test to quickly verify your webhook endpoint is working

WEBHOOK_URL="http://localhost:3000/api/webhooks/stripe"

echo "🔍 Testing Stripe Webhook Endpoint"
echo "URL: $WEBHOOK_URL"
echo ""

# Test 1: Health Check
echo "1. Testing Health Check (GET)..."
response=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X GET "$WEBHOOK_URL")
http_code=$(echo "$response" | grep "HTTP_CODE:" | cut -d: -f2)
body=$(echo "$response" | sed '/HTTP_CODE:/d')

if [ "$http_code" = "200" ]; then
    echo "✅ Health check passed (Status: $http_code)"
else
    echo "❌ Health check failed (Status: $http_code)"
fi
echo "Response: $body"
echo ""

# Test 2: Payment Intent with Development Signature
echo "2. Testing Payment Intent (Development Mode)..."
payment_payload='{
  "id": "evt_quick_test",
  "object": "event",
  "type": "payment_intent.succeeded",
  "data": {
    "object": {
      "id": "pi_quick_test_123",
      "object": "payment_intent",
      "amount": 1000,
      "currency": "usd",
      "status": "succeeded",
        "metadata": {
          "userId": "cmf2xwqgp00003bg1lzw6pev0",
        "items": "[{\"id\":\"test-site\",\"name\":\"Quick Test Site\",\"price\":10.00,\"quantity\":1}]"
      }
    }
  }
}'

response=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST \
    -H "Content-Type: application/json" \
    -H "stripe-signature: test-signature" \
    -d "$payment_payload" \
    "$WEBHOOK_URL")

http_code=$(echo "$response" | grep "HTTP_CODE:" | cut -d: -f2)
body=$(echo "$response" | sed '/HTTP_CODE:/d')

if [ "$http_code" = "200" ]; then
    echo "✅ Payment test passed (Status: $http_code)"
else
    echo "❌ Payment test failed (Status: $http_code)"
fi
echo "Response: $body"
echo ""

# Test 3: Missing Signature (Should Fail)
echo "3. Testing Missing Signature (Should Fail)..."
response=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST \
    -H "Content-Type: application/json" \
    -d "$payment_payload" \
    "$WEBHOOK_URL")

http_code=$(echo "$response" | grep "HTTP_CODE:" | cut -d: -f2)
body=$(echo "$response" | sed '/HTTP_CODE:/d')

if [ "$http_code" = "400" ]; then
    echo "✅ Missing signature test passed (Status: $http_code) - Correctly rejected"
else
    echo "❌ Missing signature test failed (Status: $http_code) - Should be 400"
fi
echo "Response: $body"
echo ""

echo "🏁 Quick test completed!"
echo ""
echo "Next steps:"
echo "1. For comprehensive testing, run: ./scripts/test-stripe-webhook.sh"
echo "2. For production testing, run: ./scripts/test-stripe-webhook-production.sh"
echo "3. For Node.js testing, run: node scripts/test-stripe-webhook-node.js"
