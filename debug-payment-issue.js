#!/usr/bin/env node

/**
 * Payment Issue Debugging Script
 * 
 * This script helps debug why orders are not appearing after successful payments.
 * Run this script to check all potential issues.
 */

const https = require('https');
const http = require('http');

// Configuration
const PRODUCTION_URL = 'https://oms-new-five.vercel.app';
const LOCAL_URL = 'http://localhost:3000';

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

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https');
    const client = isHttps ? https : http;
    
    const req = client.request(url, options, (res) => {
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

async function testWebhookEndpoint() {
  log('blue', '🔍 Testing Webhook Endpoint...');
  
  try {
    const response = await makeRequest(`${PRODUCTION_URL}/api/webhooks/stripe`, {
      method: 'GET'
    });
    
    if (response.statusCode === 200) {
      log('green', '✅ Webhook endpoint is accessible');
      log('blue', `Response: ${response.body}`);
    } else {
      log('red', `❌ Webhook endpoint returned status ${response.statusCode}`);
    }
  } catch (error) {
    log('red', `❌ Webhook endpoint test failed: ${error.message}`);
  }
}

async function testOrdersEndpoint() {
  log('blue', '🔍 Testing Orders Endpoint...');
  
  try {
    const response = await makeRequest(`${PRODUCTION_URL}/api/orders`, {
      method: 'GET'
    });
    
    if (response.statusCode === 200) {
      log('green', '✅ Orders endpoint is accessible');
      const data = JSON.parse(response.body);
      log('blue', `Found ${data.orders?.length || 0} orders`);
    } else if (response.statusCode === 401) {
      log('yellow', '⚠️ Orders endpoint requires authentication (expected)');
    } else {
      log('red', `❌ Orders endpoint returned status ${response.statusCode}`);
    }
  } catch (error) {
    log('red', `❌ Orders endpoint test failed: ${error.message}`);
  }
}

async function testWebhookWithMockData() {
  log('blue', '🔍 Testing Webhook with Mock Payment Data...');
  
  const mockWebhookPayload = {
    id: 'evt_debug_test',
    object: 'event',
    api_version: '2020-08-27',
    created: Math.floor(Date.now() / 1000),
    data: {
      object: {
        id: 'pi_debug_test_123',
        object: 'payment_intent',
        amount: 2000,
        currency: 'usd',
        status: 'succeeded',
        metadata: {
          userId: 'debug-user-123',
          items: JSON.stringify([{
            id: 'test-site-1',
            name: 'Test Site',
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
      id: 'req_debug_test',
      idempotency_key: null
    },
    type: 'payment_intent.succeeded'
  };
  
  try {
    const response = await makeRequest(`${PRODUCTION_URL}/api/webhooks/stripe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': 'test-signature' // Development mode bypass
      },
      body: JSON.stringify(mockWebhookPayload)
    });
    
    if (response.statusCode === 200) {
      log('green', '✅ Webhook processed successfully');
      log('blue', `Response: ${response.body}`);
    } else {
      log('red', `❌ Webhook processing failed with status ${response.statusCode}`);
      log('red', `Response: ${response.body}`);
    }
  } catch (error) {
    log('red', `❌ Webhook test failed: ${error.message}`);
  }
}

async function checkEnvironmentVariables() {
  log('blue', '🔍 Checking Environment Variables...');
  
  const requiredVars = [
    'STRIPE_SECRET_KEY',
    'STRIPE_PUBLISHABLE_KEY', 
    'STRIPE_WEBHOOK_SECRET',
    'DATABASE_URL',
    'NEXTAUTH_SECRET'
  ];
  
  const missingVars = [];
  
  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  }
  
  if (missingVars.length === 0) {
    log('green', '✅ All required environment variables are set');
  } else {
    log('red', `❌ Missing environment variables: ${missingVars.join(', ')}`);
    log('yellow', '💡 Make sure these are set in your deployment environment (Vercel)');
  }
}

function printDebuggingSteps() {
  log('cyan', '\n📋 Debugging Steps:');
  log('cyan', '1. Check Stripe Dashboard → Webhooks');
  log('cyan', '   - Ensure webhook is configured for your production URL');
  log('cyan', '   - URL should be: https://oms-new-five.vercel.app/api/webhooks/stripe');
  log('cyan', '   - Events should include: payment_intent.succeeded, payment_intent.payment_failed');
  
  log('cyan', '\n2. Check Vercel Environment Variables:');
  log('cyan', '   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables');
  log('cyan', '   - Ensure STRIPE_WEBHOOK_SECRET is set correctly');
  log('cyan', '   - Ensure DATABASE_URL is set correctly');
  
  log('cyan', '\n3. Check Stripe Webhook Logs:');
  log('cyan', '   - Go to Stripe Dashboard → Webhooks → Your Webhook');
  log('cyan', '   - Check "Recent deliveries" for failed attempts');
  log('cyan', '   - Look for 400/500 status codes');
  
  log('cyan', '\n4. Check Application Logs:');
  log('cyan', '   - Go to Vercel Dashboard → Your Project → Functions');
  log('cyan', '   - Look for webhook endpoint logs');
  log('cyan', '   - Check for database connection errors');
  
  log('cyan', '\n5. Test Webhook Manually:');
  log('cyan', '   - Use Stripe CLI: stripe listen --forward-to https://oms-new-five.vercel.app/api/webhooks/stripe');
  log('cyan', '   - Or use the test scripts in the /scripts directory');
}

async function main() {
  log('magenta', '🚀 Starting Payment Issue Debugging...\n');
  
  await checkEnvironmentVariables();
  console.log('');
  
  await testWebhookEndpoint();
  console.log('');
  
  await testOrdersEndpoint();
  console.log('');
  
  await testWebhookWithMockData();
  console.log('');
  
  printDebuggingSteps();
  
  log('magenta', '\n🎯 Next Steps:');
  log('magenta', '1. Run this script: node debug-payment-issue.js');
  log('magenta', '2. Check the output above for any ❌ errors');
  log('magenta', '3. Follow the debugging steps to fix any issues');
  log('magenta', '4. Test a payment again after fixing issues');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main, testWebhookEndpoint, testOrdersEndpoint, testWebhookWithMockData };
