#!/bin/bash

# Stripe Webhook Production Test Script
# This script tests the Stripe webhook endpoint with proper signature verification

# Configuration
WEBHOOK_URL="https://oms-new-five.vercel.app/api/webhooks/stripe"
WEBHOOK_SECRET="${STRIPE_WEBHOOK_SECRET:-whsec_test_secret}"

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

# Function to generate Stripe signature
generate_stripe_signature() {
    local payload="$1"
    local secret="$2"
    local timestamp=$(date +%s)
    
    # Create the signed payload
    local signed_payload="${timestamp}.${payload}"
    
    # Generate HMAC-SHA256 signature
    local signature=$(echo -n "$signed_payload" | openssl dgst -sha256 -hmac "$secret" -binary | base64)
    
    echo "t=${timestamp},v1=${signature}"
}

# Function to test webhook endpoint
test_webhook() {
    local test_name="$1"
    local payload="$2"
    local use_signature="$3"
    local expected_status="$4"
    
    print_status "Testing: $test_name"
    print_status "URL: $WEBHOOK_URL"
    
    # Prepare headers
    local headers="-H 'Content-Type: application/json'"
    
    if [ "$use_signature" = "true" ]; then
        local signature=$(generate_stripe_signature "$payload" "$WEBHOOK_SECRET")
        headers="$headers -H 'stripe-signature: $signature'"
    fi
    
    # Make the request
    response=$(curl -s -w "\n%{http_code}" -X POST \
        -H "Content-Type: application/json" \
        $headers \
        -d "$payload" \
        "$WEBHOOK_URL")
    
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

# Check if webhook secret is set
if [ -z "$STRIPE_WEBHOOK_SECRET" ]; then
    print_warning "STRIPE_WEBHOOK_SECRET not set. Using test secret for signature generation."
    print_warning "Set STRIPE_WEBHOOK_SECRET environment variable for production testing."
fi

# Test 1: Health check (GET request)
print_status "=== Test 1: Health Check (GET) ==="
curl -s -w "\nHTTP Status: %{http_code}\n" -X GET "$WEBHOOK_URL"
echo "---"
echo

# Test 2: Payment Intent Succeeded with proper signature
print_status "=== Test 2: Payment Intent Succeeded (With Signature) ==="
payment_succeeded_payload='{
  "id": "evt_test_webhook_prod",
  "object": "event",
  "api_version": "2020-08-27",
  "created": 1609459200,
  "data": {
    "object": {
      "id": "pi_test_prod_123456789",
      "object": "payment_intent",
      "amount": 2000,
      "currency": "usd",
      "status": "succeeded",
      "metadata": {
        "userId": "test-user-prod-123",
        "items": "[{\"id\":\"site-prod-1\",\"name\":\"Production Test Site\",\"price\":20.00,\"quantity\":1}]",
        "orderType": "purchase",
        "orderId": "order-prod-test-123"
      }
    }
  },
  "livemode": false,
  "pending_webhooks": 1,
  "request": {
    "id": "req_test_prod_123",
    "idempotency_key": null
  },
  "type": "payment_intent.succeeded"
}'

test_webhook "Payment Succeeded (With Signature)" "$payment_succeeded_payload" "true" "200"

# Test 3: Payment Intent Failed with proper signature
print_status "=== Test 3: Payment Intent Failed (With Signature) ==="
payment_failed_payload='{
  "id": "evt_test_webhook_failed_prod",
  "object": "event",
  "api_version": "2020-08-27",
  "created": 1609459200,
  "data": {
    "object": {
      "id": "pi_test_failed_prod_123",
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
        "userId": "test-user-prod-456",
        "items": "[{\"id\":\"site-prod-2\",\"name\":\"Failed Production Site\",\"price\":15.00,\"quantity\":1}]",
        "orderType": "purchase"
      }
    }
  },
  "livemode": false,
  "pending_webhooks": 1,
  "request": {
    "id": "req_test_failed_prod_123",
    "idempotency_key": null
  },
  "type": "payment_intent.payment_failed"
}'

test_webhook "Payment Failed (With Signature)" "$payment_failed_payload" "true" "200"

# Test 4: Invalid signature (should fail)
print_status "=== Test 4: Invalid Signature (Should Fail) ==="
test_webhook "Invalid Signature" "$payment_succeeded_payload" "false" "400"

# Test 5: Missing signature (should fail)
print_status "=== Test 5: Missing Signature (Should Fail) ==="
response=$(curl -s -w "\n%{http_code}" -X POST \
    -H "Content-Type: application/json" \
    -d "$payment_succeeded_payload" \
    "$WEBHOOK_URL")

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n -1)

if [ "$http_code" = "400" ]; then
    print_success "✓ Status code: $http_code (expected: 400)"
else
    print_error "✗ Status code: $http_code (expected: 400)"
fi

echo "Response body:"
echo "$body" | jq . 2>/dev/null || echo "$body"
echo "---"
echo

# Test 6: Large payload test
print_status "=== Test 6: Large Payload Test ==="
large_payload='{
  "id": "evt_test_webhook_large",
  "object": "event",
  "api_version": "2020-08-27",
  "created": 1609459200,
  "data": {
    "object": {
      "id": "pi_test_large_123",
      "object": "payment_intent",
      "amount": 50000,
      "currency": "usd",
      "status": "succeeded",
      "metadata": {
        "userId": "test-user-large-123",
        "items": "[{\"id\":\"site-large-1\",\"name\":\"Large Order Site 1\",\"price\":100.00,\"quantity\":5},{\"id\":\"site-large-2\",\"name\":\"Large Order Site 2\",\"price\":200.00,\"quantity\":3},{\"id\":\"site-large-3\",\"name\":\"Large Order Site 3\",\"price\":150.00,\"quantity\":2}]",
        "orderType": "purchase",
        "orderId": "order-large-test-123"
      }
    }
  },
  "livemode": false,
  "pending_webhooks": 1,
  "request": {
    "id": "req_test_large_123",
    "idempotency_key": null
  },
  "type": "payment_intent.succeeded"
}'

test_webhook "Large Payload" "$large_payload" "true" "200"

print_status "=== All production tests completed ==="
print_warning "Note: Make sure to set STRIPE_WEBHOOK_SECRET environment variable for proper signature verification in production."
