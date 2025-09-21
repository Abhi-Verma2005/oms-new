#!/usr/bin/env node

/**
 * Test script to verify the webhook fix works
 */

const crypto = require('crypto');
const http = require('http');
const https = require('https');

// Configuration
const WEBHOOK_URL = 'https://oms-new-five.vercel.app/api/webhooks/stripe';
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test';

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

function log(level, message) {
    const timestamp = new Date().toISOString();
    const color = colors[level] || colors.reset;
    console.log(`${color}[${level.toUpperCase()}]${colors.reset} ${timestamp} - ${message}`);
}

// Function to generate Stripe signature
function generateStripeSignature(payload, secret) {
    const timestamp = Math.floor(Date.now() / 1000);
    const signedPayload = `${timestamp}.${payload}`;
    const signature = crypto
        .createHmac('sha256', secret)
        .update(signedPayload, 'utf8')
        .digest('base64');
    
    return `t=${timestamp},v1=${signature}`;
}

// Function to make HTTP request
function makeRequest(url, options, data) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const isHttps = urlObj.protocol === 'https:';
        const requestModule = isHttps ? https : http;
        
        const requestOptions = {
            hostname: urlObj.hostname,
            port: urlObj.port || (isHttps ? 443 : 80),
            path: urlObj.pathname + urlObj.search,
            method: options.method || 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(data),
                ...options.headers
            }
        };

        const req = requestModule.request(requestOptions, (res) => {
            let body = '';
            res.on('data', (chunk) => {
                body += chunk;
            });
            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode,
                    headers: res.headers,
                    body: body
                });
            });
        });

        req.on('error', (err) => {
            reject(err);
        });

        req.write(data);
        req.end();
    });
}

// Test the webhook fix
async function testWebhookFix() {
    log('blue', 'Testing webhook fix with raw body handling');
    log('blue', `Webhook URL: ${WEBHOOK_URL}`);
    log('blue', `Webhook Secret: ${WEBHOOK_SECRET.substring(0, 10)}...`);
    console.log('');

    const testPayload = JSON.stringify({
        id: 'evt_test_fix_verification',
        object: 'event',
        api_version: '2020-08-27',
        created: Math.floor(Date.now() / 1000),
        data: {
            object: {
                id: 'pi_test_fix_verification',
                object: 'payment_intent',
                amount: 2000,
                currency: 'usd',
                status: 'succeeded',
                metadata: {
                    userId: 'test-user-fix',
                    items: JSON.stringify([{
                        id: 'site-fix-1',
                        name: 'Fix Test Site',
                        price: 20.00,
                        quantity: 1
                    }]),
                    orderType: 'purchase',
                    orderId: 'order-fix-test-123'
                }
            }
        },
        livemode: false,
        pending_webhooks: 1,
        request: {
            id: 'req_test_fix_123',
            idempotency_key: null
        },
        type: 'payment_intent.succeeded'
    });

    try {
        log('blue', '=== Testing Fixed Webhook ===');
        
        // Generate proper signature
        const signature = generateStripeSignature(testPayload, WEBHOOK_SECRET);
        log('cyan', `Generated signature: ${signature.substring(0, 20)}...`);
        
        const response = await makeRequest(WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'stripe-signature': signature
            }
        }, testPayload);

        // Check status code
        if (response.statusCode === 200) {
            log('green', `✓ Status code: ${response.statusCode} - Webhook fix successful!`);
        } else {
            log('red', `✗ Status code: ${response.statusCode} - Webhook still failing`);
        }

        // Log response body
        log('cyan', 'Response body:');
        try {
            const parsedBody = JSON.parse(response.body);
            console.log(JSON.stringify(parsedBody, null, 2));
        } catch (e) {
            console.log(response.body);
        }
        
        console.log('---\n');

    } catch (error) {
        log('red', `✗ Test failed with error: ${error.message}`);
        console.log('---\n');
    }
}

// Run test if this script is executed directly
if (require.main === module) {
    testWebhookFix().catch(console.error);
}

module.exports = { testWebhookFix, generateStripeSignature, makeRequest };
