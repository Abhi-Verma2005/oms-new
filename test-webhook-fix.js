#!/usr/bin/env node

/**
 * Webhook Fix Test Script
 * 
 * This script tests the webhook endpoint with proper Stripe signature
 * to verify that orders are being created correctly.
 */

const crypto = require('crypto');

// Configuration
const WEBHOOK_URL = 'https://oms-new-five.vercel.app/api/webhooks/stripe';
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test_secret';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(level, message) {
  const timestamp = new Date().toISOString();
  const color = colors[level] || colors.reset;
  console.log(`${color}[${timestamp}] [${level.toUpperCase()}]${colors.reset} ${message}`);
}

function generateStripeSignature(payload, secret) {
  const timestamp = Math.floor(Date.now() / 1000);
  const signedPayload = `${timestamp}.${payload}`;
  const signature = crypto
    .createHmac('sha256', secret)
    .update(signedPayload, 'utf8')
    .digest('hex');
  return `t=${timestamp},v1=${signature}`;
}

async function makeRequest(url, options = {}) {
  const https = require('https');
  
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });
    
    req.on('error', reject);
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

async function testWebhookWithProperSignature() {
  log('blue', '🔍 Testing Webhook with Proper Stripe Signature...');
  
  const mockWebhookPayload = {
    id: 'evt_webhook_test',
    object: 'event',
    api_version: '2020-08-27',
    created: Math.floor(Date.now() / 1000),
    data: {
      object: {
        id: 'pi_webhook_test_123',
        object: 'payment_intent',
        amount: 2000,
        currency: 'usd',
        status: 'succeeded',
        metadata: {
          userId: 'test-user-456',
          items: JSON.stringify([{
            id: 'test-site-2',
            name: 'Test Site 2',
            price: 20.00,
            quantity: 1
          }]),
          orderType: 'purchase'
        }
      }
    },
    livemode: false,
    pending_webhooks: 1,
    request: {
      id: 'req_webhook_test',
      idempotency_key: null
    },
    type: 'payment_intent.succeeded'
  };
  
  const payload = JSON.stringify(mockWebhookPayload);
  const signature = generateStripeSignature(payload, WEBHOOK_SECRET);
  
  try {
    const response = await makeRequest(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': signature
      },
      body: payload
    });
    
    if (response.statusCode === 200) {
      log('green', '✅ Webhook processed successfully with proper signature');
      log('blue', `Response: ${response.body}`);
      
      // Now test if we can fetch orders
      await testOrdersAfterWebhook();
    } else {
      log('red', `❌ Webhook processing failed with status ${response.statusCode}`);
      log('red', `Response: ${response.body}`);
    }
  } catch (error) {
    log('red', `❌ Webhook test failed: ${error.message}`);
  }
}

async function testOrdersAfterWebhook() {
  log('blue', '🔍 Testing Orders Endpoint After Webhook...');
  
  try {
    const response = await makeRequest('https://oms-new-five.vercel.app/api/orders', {
      method: 'GET'
    });
    
    if (response.statusCode === 200) {
      const data = JSON.parse(response.body);
      log('green', `✅ Orders endpoint accessible - found ${data.orders?.length || 0} orders`);
      
      if (data.orders && data.orders.length > 0) {
        log('green', '✅ Orders are being created successfully!');
        log('blue', `Latest order: ${JSON.stringify(data.orders[0], null, 2)}`);
      } else {
        log('yellow', '⚠️ No orders found - this might be expected if user is not authenticated');
      }
    } else if (response.statusCode === 401) {
      log('yellow', '⚠️ Orders endpoint requires authentication (expected)');
    } else {
      log('red', `❌ Orders endpoint returned status ${response.statusCode}`);
    }
  } catch (error) {
    log('red', `❌ Orders endpoint test failed: ${error.message}`);
  }
}

async function testWebhookHealth() {
  log('blue', '🔍 Testing Webhook Health...');
  
  try {
    const response = await makeRequest(WEBHOOK_URL, {
      method: 'GET'
    });
    
    if (response.statusCode === 200) {
      log('green', '✅ Webhook endpoint is healthy');
      log('blue', `Response: ${response.body}`);
    } else {
      log('red', `❌ Webhook health check failed with status ${response.statusCode}`);
    }
  } catch (error) {
    log('red', `❌ Webhook health check failed: ${error.message}`);
  }
}

function printConfigurationSteps() {
  log('cyan', '\n📋 Configuration Steps:');
  log('cyan', '1. Go to Stripe Dashboard → Developers → Webhooks');
  log('cyan', '2. Click "Add endpoint"');
  log('cyan', '3. Set URL: https://oms-new-five.vercel.app/api/webhooks/stripe');
  log('cyan', '4. Select events: payment_intent.succeeded, payment_intent.payment_failed');
  log('cyan', '5. Copy the webhook signing secret (starts with whsec_)');
  log('cyan', '6. Go to Vercel Dashboard → Your Project → Settings → Environment Variables');
  log('cyan', '7. Add STRIPE_WEBHOOK_SECRET with the copied value');
  log('cyan', '8. Redeploy your application');
  
  log('cyan', '\n🔧 Environment Variables Needed:');
  log('cyan', '- STRIPE_WEBHOOK_SECRET (from Stripe Dashboard)');
  log('cyan', '- STRIPE_SECRET_KEY (your Stripe secret key)');
  log('cyan', '- STRIPE_PUBLISHABLE_KEY (your Stripe publishable key)');
  log('cyan', '- DATABASE_URL (your database connection string)');
  log('cyan', '- NEXTAUTH_SECRET (your NextAuth secret)');
}

async function main() {
  log('magenta', '🚀 Starting Webhook Fix Test...\n');
  
  await testWebhookHealth();
  console.log('');
  
  await testWebhookWithProperSignature();
  console.log('');
  
  printConfigurationSteps();
  
  log('magenta', '\n🎯 After Configuration:');
  log('magenta', '1. Configure webhook in Stripe Dashboard');
  log('magenta', '2. Set environment variables in Vercel');
  log('magenta', '3. Redeploy your application');
  log('magenta', '4. Test a payment with a test card');
  log('magenta', '5. Check /orders page for the new order');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main, testWebhookWithProperSignature, testOrdersAfterWebhook };
