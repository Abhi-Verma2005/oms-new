#!/usr/bin/env node

/**
 * 🚀 QUICK RAG PERFORMANCE TEST
 * Quick test to verify the optimized RAG system is working
 */

const http = require('http')
const https = require('https')

const TEST_CONFIG = {
  baseUrl: process.env.TEST_BASE_URL || 'http://localhost:3000',
  testUser: 'test-user-quick',
  testQuery: 'What is my name and what websites do you recommend?',
}

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now()
    const isHttps = url.startsWith('https://')
    const requestModule = isHttps ? https : http
    
    const req = requestModule.request(url, {
      method: options.method || 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      timeout: 30000,
    }, (res) => {
      let data = ''
      
      res.on('data', (chunk) => {
        data += chunk
      })
      
      res.on('end', () => {
        const endTime = Date.now()
        resolve({
          statusCode: res.statusCode,
          body: data,
          timing: endTime - startTime,
        })
      })
    })
    
    req.on('error', reject)
    req.on('timeout', () => {
      req.destroy()
      reject(new Error('Request timeout'))
    })
    
    if (options.body) {
      req.write(options.body)
    }
    
    req.end()
  })
}

async function testRAGPerformance() {
  console.log('🚀 Quick RAG Performance Test')
  console.log(`Testing: ${TEST_CONFIG.baseUrl}/api/ai-chat?stream=1`)
  
  const testData = {
    message: TEST_CONFIG.testQuery,
    messages: [],
    userId: TEST_CONFIG.testUser,
    currentUrl: 'http://localhost:3000/publishers',
    cartState: { items: [], totalItems: 0, totalPrice: 0 }
  }
  
  try {
    console.log(`\n📝 Test Query: "${TEST_CONFIG.testQuery}"`)
    console.log(`👤 Test User: ${TEST_CONFIG.testUser}`)
    
    const response = await makeRequest(`${TEST_CONFIG.baseUrl}/api/ai-chat?stream=1`, {
      method: 'POST',
      body: JSON.stringify(testData),
    })
    
    console.log(`\n📊 Results:`)
    console.log(`  Status Code: ${response.statusCode}`)
    console.log(`  Response Time: ${response.timing}ms`)
    console.log(`  Response Length: ${response.body.length} characters`)
    
    if (response.statusCode === 200) {
      console.log(`\n✅ SUCCESS! RAG system is working`)
      console.log(`🚀 Response time: ${response.timing}ms (target: <3000ms)`)
      
      if (response.timing < 3000) {
        console.log(`🎉 EXCELLENT! Response time is within target (<3 seconds)`)
      } else if (response.timing < 6000) {
        console.log(`⚠️  GOOD! Response time is acceptable (<6 seconds)`)
      } else {
        console.log(`❌ SLOW! Response time is too high (>6 seconds)`)
      }
      
      // Show first part of response
      const preview = response.body.substring(0, 200)
      console.log(`\n📄 Response Preview:`)
      console.log(`  "${preview}${response.body.length > 200 ? '...' : ''}"`)
      
    } else {
      console.log(`\n❌ FAILED! HTTP ${response.statusCode}`)
      console.log(`Response: ${response.body}`)
    }
    
  } catch (error) {
    console.error(`\n❌ ERROR: ${error.message}`)
    console.log(`\nMake sure your server is running on ${TEST_CONFIG.baseUrl}`)
    console.log(`Run: npm run dev or yarn dev`)
  }
}

// Run the test
testRAGPerformance().catch(console.error)
