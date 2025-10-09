#!/bin/bash

# Simple Webhook Test Script
# This script tests the Stripe webhook endpoint with proper header handling

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Test 1: Health Check (GET)
print_status "=== Test 1: Health Check (GET) ==="
response=$(curl -s http://localhost:3000/api/webhooks/stripe)
if echo "$response" | grep -q "Stripe webhook endpoint"; then
    print_success "✓ Health check passed"
else
    print_error "✗ Health check failed"
fi
echo "Response: $response"
echo "---"

# Test 2: Payment Intent Succeeded (Development Mode)
print_status "=== Test 2: Payment Intent Succeeded (Development Mode) ==="
payment_succeeded_payload='{
  "id": "evt_test_webhook",
  "object": "event",
  "api_version": "2020-08-27",
  "created": 1609459200,
  "data": {
    "object": {
      "id": "pi_test_123456789",
      "object": "payment_intent",
      "amount": 2000,
      "currency": "usd",
      "status": "succeeded",
      "metadata": {
        "userId": "test-user-123",
        "items": "[{\"id\":\"site-1\",\"name\":\"Test Site\",\"price\":20.00,\"quantity\":1}]",
        "orderType": "purchase",
        "orderId": "order-test-123"
      }
    }
  },
  "livemode": false,
  "pending_webhooks": 1,
  "request": {
    "id": "req_test_123",
    "idempotency_key": null
  },
  "type": "payment_intent.succeeded"
}'

response=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -H "stripe-signature: test-signature" \
    -d "$payment_succeeded_payload" \
    http://localhost:3000/api/webhooks/stripe)

if echo "$response" | grep -q "received.*true"; then
    print_success "✓ Payment succeeded webhook processed"
else
    print_error "✗ Payment succeeded webhook failed"
fi
echo "Response: $response"
echo "---"

# Test 3: Payment Intent Failed (Development Mode)
print_status "=== Test 3: Payment Intent Failed (Development Mode) ==="
payment_failed_payload='{
  "id": "evt_test_webhook_failed",
  "object": "event",
  "api_version": "2020-08-27",
  "created": 1609459200,
  "data": {
    "object": {
      "id": "pi_test_failed_123",
      "object": "payment_intent",
      "amount": 1500,
      "currency": "usd",
      "status": "requires_payment_method",
      "last_payment_error": {
        "code": "card_declined",
        "decline_code": "generic_decline",
        "message": "Your card was declined.",
        "type": "card_error"
      },
      "metadata": {
        "userId": "test-user-456",
        "items": "[{\"id\":\"site-2\",\"name\":\"Failed Site\",\"price\":15.00,\"quantity\":1}]",
        "orderType": "purchase"
      }
    }
  },
  "livemode": false,
  "pending_webhooks": 1,
  "request": {
    "id": "req_test_failed_123",
    "idempotency_key": null
  },
  "type": "payment_intent.payment_failed"
}'

response=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -H "stripe-signature: test-signature" \
    -d "$payment_failed_payload" \
    http://localhost:3000/api/webhooks/stripe)

if echo "$response" | grep -q "received.*true"; then
    print_success "✓ Payment failed webhook processed"
else
    print_error "✗ Payment failed webhook failed"
fi
echo "Response: $response"
echo "---"

# Test 4: Missing signature (should fail)
print_status "=== Test 4: Missing Signature (Should Fail) ==="
response=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d "$payment_succeeded_payload" \
    http://localhost:3000/api/webhooks/stripe)

if echo "$response" | grep -q "No signature"; then
    print_success "✓ Missing signature correctly rejected"
else
    print_error "✗ Missing signature not rejected"
fi
echo "Response: $response"
echo "---"

print_status "=== All tests completed ==="
