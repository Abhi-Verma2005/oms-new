# Stripe Webhook Testing Scripts

This directory contains comprehensive test scripts for testing your Stripe webhook endpoint at `https://oms-new-five.vercel.app/api/webhooks/stripe`.

## Scripts Overview

### 1. `test-stripe-webhook.sh` - Basic Bash Tests
- **Purpose**: Basic webhook testing with development mode bypass
- **Best for**: Local development and quick testing
- **Features**:
  - Tests both local and production URLs
  - Uses development mode signature bypass
  - Tests various scenarios including error cases

### 2. `test-stripe-webhook-production.sh` - Production Bash Tests
- **Purpose**: Production-ready testing with proper signature verification
- **Best for**: Testing production webhook endpoint
- **Features**:
  - Generates proper Stripe signatures using OpenSSL
  - Tests signature verification
  - Includes large payload testing

### 3. `test-stripe-webhook-node.js` - Node.js Tests
- **Purpose**: Most accurate testing with proper Stripe signature generation
- **Best for**: Comprehensive testing and CI/CD pipelines
- **Features**:
  - Uses Node.js crypto module for accurate signature generation
  - Detailed logging and colored output
  - Promise-based async testing

## Prerequisites

### For Bash Scripts
```bash
# Install required tools
brew install jq  # For JSON formatting
# or
sudo apt-get install jq  # On Ubuntu/Debian

# Make scripts executable
chmod +x test-stripe-webhook.sh
chmod +x test-stripe-webhook-production.sh
```

### For Node.js Script
```bash
# No additional dependencies required (uses built-in Node.js modules)
chmod +x test-stripe-webhook-node.js
```

## Environment Variables

Set your Stripe webhook secret for production testing:

```bash
export STRIPE_WEBHOOK_SECRET="whsec_your_actual_webhook_secret_here"
```

## Usage

### 1. Basic Testing (Development Mode)
```bash
# Test local development server
./test-stripe-webhook.sh

# Test production server (with dev mode bypass)
./test-stripe-webhook.sh
```

### 2. Production Testing (With Signature Verification)
```bash
# Set your webhook secret
export STRIPE_WEBHOOK_SECRET="whsec_your_actual_webhook_secret_here"

# Run production tests
./test-stripe-webhook-production.sh
```

### 3. Node.js Testing (Most Accurate)
```bash
# Set your webhook secret
export STRIPE_WEBHOOK_SECRET="whsec_your_actual_webhook_secret_here"

# Run Node.js tests
node test-stripe-webhook-node.js
```

## Test Scenarios

All scripts test the following scenarios:

### ✅ Success Cases
1. **Health Check (GET)** - Basic endpoint availability
2. **Payment Intent Succeeded** - Successful payment processing
3. **Payment Intent Failed** - Failed payment handling
4. **Large Payload** - Testing with multiple items
5. **Unhandled Event Types** - Graceful handling of unknown events

### ❌ Error Cases
1. **Missing Signature** - Should return 400
2. **Invalid JSON** - Should return 400
3. **Missing Required Metadata** - Should handle gracefully
4. **Invalid Signature** - Should return 400

## Expected Responses

### Successful Webhook Processing
```json
{
  "received": true
}
```

### Error Responses
```json
{
  "error": "No signature"
}
```

```json
{
  "error": "Invalid signature"
}
```

```json
{
  "error": "Invalid JSON"
}
```

## Troubleshooting

### Common Issues

1. **"No signature" error**
   - Make sure you're using the production script with proper signature generation
   - Check that `STRIPE_WEBHOOK_SECRET` is set correctly

2. **"Invalid signature" error**
   - Verify your webhook secret matches the one in Stripe Dashboard
   - Ensure the signature generation is using the correct algorithm

3. **Connection refused/timeout**
   - Check if your webhook URL is accessible
   - Verify the endpoint is deployed and running

4. **500 Internal Server Error**
   - Check your webhook endpoint logs
   - Verify database connections and environment variables

### Debug Mode

For detailed debugging, check your webhook endpoint logs. The endpoint logs:
- Webhook reception details
- Signature verification status
- Payment processing steps
- Database operations
- Error details

## Webhook Endpoint Analysis

Based on your current implementation, the webhook handles:

### Supported Events
- `payment_intent.succeeded` - Creates orders and logs activities
- `payment_intent.payment_failed` - Creates failed order records

### Required Metadata
- `userId` - User identifier
- `items` - JSON string of purchased items
- `orderType` - Type of order (optional)
- `orderId` - Order identifier (optional)

### Database Operations
- Creates `Order` records with items and transactions
- Logs activities using `ActivityLogger`
- Handles both successful and failed payments

## Production Deployment Checklist

Before deploying to production:

1. ✅ Set `STRIPE_WEBHOOK_SECRET` environment variable
2. ✅ Test with production webhook secret
3. ✅ Verify database connections work
4. ✅ Check that all required environment variables are set
5. ✅ Test error scenarios
6. ✅ Monitor webhook delivery in Stripe Dashboard

## Monitoring

After deployment, monitor:
- Stripe Dashboard webhook logs
- Your application logs
- Database for order creation
- Activity logs for user actions

## Support

If you encounter issues:
1. Check the webhook endpoint logs
2. Verify Stripe Dashboard webhook configuration
3. Test with the provided scripts
4. Review the webhook endpoint implementation
