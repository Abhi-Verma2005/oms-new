#!/bin/bash

# Stripe Webhook Test Script
# This script tests the Stripe webhook endpoint with various scenarios

# Configuration
WEBHOOK_URL="https://oms-new-five.vercel.app/api/webhooks/stripe"
LOCAL_URL="http://localhost:3000/api/webhooks/stripe"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to test webhook endpoint
test_webhook() {
    local test_name="$1"
    local payload="$2"
    local headers="$3"
    local expected_status="$4"
    local url="$5"
    
    print_status "Testing: $test_name"
    print_status "URL: $url"
    
    # Make the request
    response=$(curl -s -w "\n%{http_code}" -X POST \
        -H "Content-Type: application/json" \
        $headers \
        -d "$payload" \
        "$url")
    
    # Extract status code and body
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n -1)
    
    # Check if status code matches expected
    if [ "$http_code" = "$expected_status" ]; then
        print_success "✓ Status code: $http_code (expected: $expected_status)"
    else
        print_error "✗ Status code: $http_code (expected: $expected_status)"
    fi
    
    # Print response body
    echo "Response body:"
    echo "$body" | jq . 2>/dev/null || echo "$body"
    echo "---"
    echo
}

# Test 1: Health check (GET request)
print_status "=== Test 1: Health Check (GET) ==="
test_webhook "Health Check" "" "" "200" "$WEBHOOK_URL"

# Test 2: Payment Intent Succeeded (Development mode - bypass signature)
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

test_webhook "Payment Succeeded (Dev Mode)" "$payment_succeeded_payload" "-H 'stripe-signature: test-signature'" "200" "$LOCAL_URL"

# Test 3: Payment Intent Failed (Development mode)
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

test_webhook "Payment Failed (Dev Mode)" "$payment_failed_payload" "-H 'stripe-signature: test-signature'" "200" "$LOCAL_URL"

# Test 4: Missing signature (should fail)
print_status "=== Test 4: Missing Signature (Should Fail) ==="
test_webhook "Missing Signature" "$payment_succeeded_payload" "" "400" "$WEBHOOK_URL"

# Test 5: Invalid JSON (should fail)
print_status "=== Test 5: Invalid JSON (Should Fail) ==="
invalid_json='{"invalid": json}'
test_webhook "Invalid JSON" "$invalid_json" "-H 'stripe-signature: test-signature'" "400" "$LOCAL_URL"

# Test 6: Missing required metadata (should handle gracefully)
print_status "=== Test 6: Missing Required Metadata ==="
missing_metadata_payload='{
  "id": "evt_test_webhook_no_metadata",
  "object": "event",
  "api_version": "2020-08-27",
  "created": 1609459200,
  "data": {
    "object": {
      "id": "pi_test_no_metadata",
      "object": "payment_intent",
      "amount": 1000,
      "currency": "usd",
      "status": "succeeded",
      "metadata": {}
    }
  },
  "livemode": false,
  "pending_webhooks": 1,
  "request": {
    "id": "req_test_no_metadata",
    "idempotency_key": null
  },
  "type": "payment_intent.succeeded"
}'

test_webhook "Missing Metadata" "$missing_metadata_payload" "-H 'stripe-signature: test-signature'" "200" "$LOCAL_URL"

# Test 7: Unhandled event type
print_status "=== Test 7: Unhandled Event Type ==="
unhandled_event_payload='{
  "id": "evt_test_webhook_unhandled",
  "object": "event",
  "api_version": "2020-08-27",
  "created": 1609459200,
  "data": {
    "object": {
      "id": "cus_test_123",
      "object": "customer"
    }
  },
  "livemode": false,
  "pending_webhooks": 1,
  "request": {
    "id": "req_test_unhandled",
    "idempotency_key": null
  },
  "type": "customer.created"
}'

test_webhook "Unhandled Event" "$unhandled_event_payload" "-H 'stripe-signature: test-signature'" "200" "$LOCAL_URL"

print_status "=== All tests completed ==="
