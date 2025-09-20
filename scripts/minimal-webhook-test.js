#!/usr/bin/env node

/**
 * Minimal Stripe Webhook Test
 * This tests the exact same signature generation as Stripe uses
 */

const crypto = require('crypto');
const https = require('https');

// Your webhook secret from Stripe Dashboard
const WEBHOOK_SECRET = 'whsec_amSijv5kpME4L7L9jg4tuvzEwfsLbWNG';
const WEBHOOK_URL = 'https://oms-new-five.vercel.app/api/webhooks/stripe';

// Test payload - exactly like Stripe would send
const payload = JSON.stringify({
  id: 'evt_test_minimal',
  object: 'event',
  api_version: '2020-08-27',
  created: Math.floor(Date.now() / 1000),
  data: {
    object: {
      id: 'pi_test_minimal_123',
      object: 'payment_intent',
      amount: 2000,
      currency: 'usd',
      status: 'succeeded',
      metadata: {
        userId: 'cmf2xwqgp00003bg1lzw6pev0',
        items: '[{"id":"test-site","name":"Minimal Test Site","price":20.00,"quantity":1}]'
      }
    }
  },
  livemode: false,
  pending_webhooks: 1,
  request: {
    id: 'req_test_minimal_123',
    idempotency_key: null
  },
  type: 'payment_intent.succeeded'
});

function generateStripeSignature(payload, secret) {
  const timestamp = Math.floor(Date.now() / 1000);
  const signedPayload = `${timestamp}.${payload}`;
  
  console.log('=== Signature Generation Debug ===');
  console.log('Timestamp:', timestamp);
  console.log('Payload length:', payload.length);
  console.log('Secret length:', secret.length);
  console.log('Secret starts with:', secret.substring(0, 15));
  
  const signature = crypto
    .createHmac('sha256', secret)
    .update(signedPayload, 'utf8')
    .digest('base64');
  
  const fullSignature = `t=${timestamp},v1=${signature}`;
  
  console.log('Generated signature:', fullSignature);
  console.log('Signature length:', fullSignature.length);
  
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

    console.log('\n=== Request Details ===');
    console.log('URL:', url);
    console.log('Headers:', options.headers);
    console.log('Payload preview:', payload.substring(0, 100) + '...');

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        console.log('\n=== Response ===');
        console.log('Status:', res.statusCode);
        console.log('Headers:', res.headers);
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
    console.log('=== Minimal Stripe Webhook Test ===');
    console.log('Webhook URL:', WEBHOOK_URL);
    console.log('Webhook Secret:', WEBHOOK_SECRET.substring(0, 15) + '...');
    
    const signature = generateStripeSignature(payload, WEBHOOK_SECRET);
    
    console.log('\n=== Sending Request ===');
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
