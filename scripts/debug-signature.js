#!/usr/bin/env node

/**
 * Debug Stripe Signature Generation
 * This script helps debug signature generation issues
 */

const crypto = require('crypto');

// Your webhook secret from Stripe Dashboard
const WEBHOOK_SECRET = 'whsec_amSijv5kpME4L7L9jg4tuvzEwfsLbWNG';

// Test payload
const payload = JSON.stringify({
  id: 'evt_test_debug',
  object: 'event',
  type: 'payment_intent.succeeded',
  data: {
    object: {
      id: 'pi_test_debug_123',
      object: 'payment_intent',
      amount: 2000,
      currency: 'usd',
      status: 'succeeded',
      metadata: {
        userId: 'cmf2xwqgp00003bg1lzw6pev0',
        items: '[{"id":"test-site","name":"Debug Test Site","price":20.00,"quantity":1}]'
      }
    }
  }
});

function generateStripeSignature(payload, secret) {
  const timestamp = Math.floor(Date.now() / 1000);
  const signedPayload = `${timestamp}.${payload}`;
  
  console.log('Debug Info:');
  console.log('- Timestamp:', timestamp);
  console.log('- Payload length:', payload.length);
  console.log('- Signed payload length:', signedPayload.length);
  console.log('- Secret length:', secret.length);
  console.log('- Secret starts with:', secret.substring(0, 10));
  
  const signature = crypto
    .createHmac('sha256', secret)
    .update(signedPayload, 'utf8')
    .digest('base64');
  
  const fullSignature = `t=${timestamp},v1=${signature}`;
  
  console.log('- Generated signature:', fullSignature);
  console.log('- Signature length:', fullSignature.length);
  
  return fullSignature;
}

// Test signature generation
console.log('=== Stripe Signature Debug ===');
const signature = generateStripeSignature(payload, WEBHOOK_SECRET);

// Test with a simple payload
console.log('\n=== Simple Payload Test ===');
const simplePayload = '{"test": "data"}';
const simpleSignature = generateStripeSignature(simplePayload, WEBHOOK_SECRET);

// Test with different secret formats
console.log('\n=== Secret Format Tests ===');
const secretWithoutWhsec = WEBHOOK_SECRET.replace('whsec_', '');
console.log('Secret without whsec_:', secretWithoutWhsec);
const signatureWithoutWhsec = generateStripeSignature(payload, secretWithoutWhsec);

console.log('\n=== Summary ===');
console.log('1. Full secret signature:', signature);
console.log('2. Simple payload signature:', simpleSignature);
console.log('3. Without whsec_ signature:', signatureWithoutWhsec);
