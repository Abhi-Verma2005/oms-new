#!/usr/bin/env node

/**
 * Debug Webhook Secret
 * Check for hidden characters or encoding issues
 */

const secret = 'whsec_V9gr0cEGnKBAhZYh2UvG9EuVc5PNlF3a';

console.log('=== Webhook Secret Debug ===');
console.log('Secret:', secret);
console.log('Length:', secret.length);
console.log('Character codes:');
for (let i = 0; i < secret.length; i++) {
  console.log(`  ${i}: '${secret[i]}' (${secret.charCodeAt(i)})`);
}

console.log('\n=== Base64 Check ===');
try {
  const decoded = Buffer.from(secret, 'base64');
  console.log('Base64 decoded length:', decoded.length);
  console.log('Base64 decoded:', decoded.toString('hex'));
} catch (e) {
  console.log('Not valid base64');
}

console.log('\n=== Stripe Secret Format Check ===');
console.log('Starts with whsec_:', secret.startsWith('whsec_'));
console.log('After whsec_:', secret.substring(6));
console.log('After whsec_ length:', secret.substring(6).length);

// Test signature generation
const crypto = require('crypto');
const testPayload = '{"test": "data"}';
const timestamp = Math.floor(Date.now() / 1000);
const signedPayload = `${timestamp}.${testPayload}`;

console.log('\n=== Signature Generation Test ===');
console.log('Test payload:', testPayload);
console.log('Timestamp:', timestamp);
console.log('Signed payload:', signedPayload);

const signature = crypto
  .createHmac('sha256', secret)
  .update(signedPayload, 'utf8')
  .digest('base64');

console.log('Generated signature:', signature);
console.log('Full signature header:', `t=${timestamp},v1=${signature}`);
