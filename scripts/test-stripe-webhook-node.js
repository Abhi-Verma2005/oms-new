#!/usr/bin/env node

/**
 * Node.js Stripe Webhook Test Script
 * This script generates proper Stripe signatures for testing webhook endpoints
 */

const crypto = require('crypto');
const http = require('http');
const https = require('https');

// Configuration
const WEBHOOK_URL = 'https://oms-new-five.vercel.app/api/webhooks/stripe';
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET ||"";

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

// Test cases
const testCases = [
    {
        name: 'Health Check (GET)',
        method: 'GET',
        payload: '',
        headers: {},
        expectedStatus: 200
    },
    {
        name: 'Payment Intent Succeeded',
        method: 'POST',
        payload: JSON.stringify({
            id: 'evt_test_webhook_node',
            object: 'event',
            api_version: '2020-08-27',
            created: Math.floor(Date.now() / 1000),
            data: {
                object: {
                    id: 'pi_test_node_123456789',
                    object: 'payment_intent',
                    amount: 2000,
                    currency: 'usd',
                    status: 'succeeded',
                    metadata: {
                        userId: 'cmf2xwqgp00003bg1lzw6pev0',
                        items: JSON.stringify([{
                            id: 'site-node-1',
                            name: 'Node Test Site',
                            price: 20.00,
                            quantity: 1
                        }]),
                        orderType: 'purchase',
                        orderId: 'order-node-test-123'
                    }
                }
            },
            livemode: false,
            pending_webhooks: 1,
            request: {
                id: 'req_test_node_123',
                idempotency_key: null
            },
            type: 'payment_intent.succeeded'
        }),
        headers: {},
        expectedStatus: 200,
        useSignature: true
    },
    {
        name: 'Payment Intent Failed',
        method: 'POST',
        payload: JSON.stringify({
            id: 'evt_test_webhook_failed_node',
            object: 'event',
            api_version: '2020-08-27',
            created: Math.floor(Date.now() / 1000),
            data: {
                object: {
                    id: 'pi_test_failed_node_123',
                    object: 'payment_intent',
                    amount: 1500,
                    currency: 'usd',
                    status: 'requires_payment_method',
                    last_payment_error: {
                        code: 'card_declined',
                        decline_code: 'generic_decline',
                        message: 'Your card was declined.',
                        type: 'card_error'
                    },
                    metadata: {
                        userId: 'cmf2xwqgp00003bg1lzw6pev0',
                        items: JSON.stringify([{
                            id: 'site-node-2',
                            name: 'Failed Node Site',
                            price: 15.00,
                            quantity: 1
                        }]),
                        orderType: 'purchase'
                    }
                }
            },
            livemode: false,
            pending_webhooks: 1,
            request: {
                id: 'req_test_failed_node_123',
                idempotency_key: null
            },
            type: 'payment_intent.payment_failed'
        }),
        headers: {},
        expectedStatus: 200,
        useSignature: true
    },
    {
        name: 'Missing Signature (Should Fail)',
        method: 'POST',
        payload: JSON.stringify({
            id: 'evt_test_no_sig',
            object: 'event',
            type: 'payment_intent.succeeded',
            data: { object: { id: 'pi_test_no_sig' } }
        }),
        headers: {},
        expectedStatus: 400,
        useSignature: false
    },
    {
        name: 'Invalid JSON (Should Fail)',
        method: 'POST',
        payload: '{"invalid": json}',
        headers: {},
        expectedStatus: 400,
        useSignature: true
    }
];

// Main test function
async function runTests() {
    log('blue', 'Starting Stripe Webhook Tests');
    log('blue', `Webhook URL: ${WEBHOOK_URL}`);
    log('blue', `Webhook Secret: ${WEBHOOK_SECRET.substring(0, 10)}...`);
    console.log('');

    let passedTests = 0;
    let totalTests = testCases.length;

    for (const testCase of testCases) {
        try {
            log('blue', `=== ${testCase.name} ===`);
            
            let headers = { ...testCase.headers };
            
            // Add signature if needed
            if (testCase.useSignature && testCase.method === 'POST') {
                // For localhost testing, use development mode bypass
                if (WEBHOOK_URL.includes('localhost')) {
                    headers['stripe-signature'] = 'test-signature';
                    log('cyan', 'Using development mode bypass signature');
                } else {
                    const signature = generateStripeSignature(testCase.payload, WEBHOOK_SECRET);
                    headers['stripe-signature'] = signature;
                    log('cyan', `Generated signature: ${signature.substring(0, 20)}...`);
                }
            }

            const response = await makeRequest(WEBHOOK_URL, {
                method: testCase.method,
                headers: headers
            }, testCase.payload);

            // Check status code
            if (response.statusCode === testCase.expectedStatus) {
                log('green', `✓ Status code: ${response.statusCode} (expected: ${testCase.expectedStatus})`);
                passedTests++;
            } else {
                log('red', `✗ Status code: ${response.statusCode} (expected: ${testCase.expectedStatus})`);
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

    // Summary
    log('blue', '=== Test Summary ===');
    log('green', `Passed: ${passedTests}/${totalTests}`);
    if (passedTests === totalTests) {
        log('green', '🎉 All tests passed!');
    } else {
        log('yellow', `⚠️  ${totalTests - passedTests} test(s) failed`);
    }
}

// Run tests if this script is executed directly
if (require.main === module) {
    runTests().catch(console.error);
}

module.exports = { runTests, generateStripeSignature, makeRequest };
