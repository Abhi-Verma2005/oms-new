#!/usr/bin/env node

/**
 * Test webhook with secret WITHOUT whsec_ prefix
 */

const crypto = require('crypto');
const https = require('https');

// Test with secret WITH whsec_ prefix
const WEBHOOK_SECRET = 'whsec_V9gr0cEGnKBAhZYh2UvG9EuVc5PNlF3a';
const WEBHOOK_URL = 'https://oms-new-five.vercel.app/api/webhooks/stripe';

// Test payload
const payload = JSON.stringify({
  id: 'evt_test_no_whsec',
  object: 'event',
  api_version: '2020-08-27',
  created: Math.floor(Date.now() / 1000),
  data: {
    object: {
      id: 'pi_test_no_whsec_123',
      object: 'payment_intent',
      amount: 2000,
      currency: 'usd',
      status: 'succeeded',
      metadata: {
        userId: 'cmf2xwqgp00003bg1lzw6pev0',
        items: '[{"id":"test-site","name":"No Whsec Test Site","price":20.00,"quantity":1}]'
      }
    }
  },
  livemode: false,
  pending_webhooks: 1,
  request: {
    id: 'req_test_no_whsec_123',
    idempotency_key: null
  },
  type: 'payment_intent.succeeded'
});

function generateStripeSignature(payload, secret) {
  const timestamp = Math.floor(Date.now() / 1000);
  const signedPayload = `${timestamp}.${payload}`;
  
  console.log('=== Signature Generation (WITH whsec_) ===');
  console.log('Secret:', secret);
  console.log('Secret length:', secret.length);
  console.log('Timestamp:', timestamp);
  console.log('Payload length:', payload.length);
  
  // Use the full secret with whsec_ prefix for signature generation
  // Stripe's constructEvent expects the full secret including the prefix
  console.log('Secret for signing:', secret);
  
  const signature = crypto
    .createHmac('sha256', secret)
    .update(signedPayload, 'utf8')
    .digest('base64');
  
  const fullSignature = `t=${timestamp},v1=${signature}`;
  
  console.log('Generated signature:', fullSignature);
  
  return fullSignature;
}

function makeRequest(url, payload, signature) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    
    const options = {
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        'stripe-signature': signature
      }
    };

    console.log('\n=== Sending Request ===');
    console.log('URL:', url);
    console.log('Signature:', signature);

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        console.log('\n=== Response ===');
        console.log('Status:', res.statusCode);
        console.log('Body:', body);
        resolve({ statusCode: res.statusCode, body, headers: res.headers });
      });
    });

    req.on('error', (err) => {
      console.error('Request error:', err);
      reject(err);
    });

    req.write(payload);
    req.end();
  });
}

async function testWebhook() {
  try {
    console.log('=== Testing Webhook WITH whsec_ prefix ===');
    
    const signature = generateStripeSignature(payload, WEBHOOK_SECRET);
    const response = await makeRequest(WEBHOOK_URL, payload, signature);
    
    if (response.statusCode === 200) {
      console.log('\n✅ SUCCESS: Webhook processed successfully!');
    } else {
      console.log('\n❌ FAILED: Webhook returned status', response.statusCode);
    }
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
  }
}

testWebhook();
