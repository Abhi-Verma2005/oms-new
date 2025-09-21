#!/usr/bin/env node

const https = require('https');

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    const req = https.request(requestOptions, (res) => {
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

    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

async function testDebugEndpoint() {
  try {
    console.log('Testing webhook debug endpoint...');
    
    const response = await makeRequest('https://oms-new-five.vercel.app/api/webhook-debug', {
      method: 'GET'
    });
    
    console.log('Status:', response.statusCode);
    console.log('Response:', response.body);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testDebugEndpoint();
